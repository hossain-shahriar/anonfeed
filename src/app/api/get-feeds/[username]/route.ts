// src/app/api/get-feeds/[username]/route.ts
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

        if (!isFollowing) {
            return NextResponse.json({ success: false, message: "You are not following this user" }, { status: 403 });
        }

        const userFeeds = await UserModel.aggregate([
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
        ]).exec();

        console.log('Aggregation result:', userFeeds);

        if (!userFeeds || userFeeds.length === 0) {
            console.log('User not found or no feeds available');
            return NextResponse.json(
                { message: 'User not found', success: false },
                { status: 404 }
            );
        }

        console.log('Feeds found:', userFeeds[0].feeds);
        return NextResponse.json(
            { feeds: userFeeds[0].feeds },
            { status: 200 }
        );
    } catch (error) {
        console.error('An unexpected error occurred:', error);
        return NextResponse.json({ message: 'Internal server error', success: false }, { status: 500 });
    }
}
