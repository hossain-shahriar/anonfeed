import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import mongoose from 'mongoose';

export async function GET(request: NextRequest, { params }: { params: { username: string } }) {
    try {
        await dbConnect();
        console.log('Database connected');

        const session = await getServerSession(authOptions);

        if (!session) {
            console.log('Unauthorized access attempt');
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const { username } = params;
        console.log(`Fetching feeds for user: ${username}`);

        const loggedInUserId = new mongoose.Types.ObjectId(session.user._id);

        const profileUser = await UserModel.findOne({ username });
        if (!profileUser) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        const profileUserId = new mongoose.Types.ObjectId(profileUser._id as mongoose.Types.ObjectId);

        const loggedInUser = await UserModel.findById(loggedInUserId);
        if (!loggedInUser) {
            return NextResponse.json({ success: false, message: "Logged-in user not found" }, { status: 404 });
        }

        const isFollowing = loggedInUser.following.some(followingId => followingId.equals(profileUserId));

        const userFeeds = isFollowing ? await UserModel.aggregate([
            { $match: { username: username } },
            {
                $lookup: {
                    from: 'feeds',
                    localField: 'feeds',
                    foreignField: '_id',
                    as: 'feeds'
                }
            },
            { $unwind: '$feeds' },
            { $sort: { 'feeds.createdAt': -1 } },
            { $group: { _id: '$_id', feeds: { $push: '$feeds' } } }
        ]).exec() : [];

        console.log('Aggregation result:', userFeeds);

        const feeds = userFeeds.length > 0 ? userFeeds[0].feeds : [];

        console.log('Feeds found:', feeds);

        return NextResponse.json(
            { 
                feeds: feeds, 
                profilePhoto: profileUser.profilePhoto,
                coverPhoto: profileUser.coverPhoto,
                followingCount: profileUser.following.length,
                followersCount: profileUser.followers.length
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('An unexpected error occurred:', error);
        return NextResponse.json({ message: 'Internal server error', success: false }, { status: 500 });
    }
}
