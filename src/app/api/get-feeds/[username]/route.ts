// src/app/api/get-feeds/[username]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';
import FeedModel, { IFeed } from '@/model/Feed';
import CommentModel, { IComment } from '@/model/Comment';
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

        const feeds: IFeed[] = userFeeds.length > 0 ? userFeeds[0].feeds : [];

        const feedIds = feeds.map((feed: IFeed) => feed._id);
        const comments = await CommentModel.find({ feed: { $in: feedIds } }).populate('user').exec();

        const feedsWithComments = feeds.map((feed: IFeed) => ({
            ...feed,
            comments: comments.filter(comment => comment.feed.equals(feed._id)).map(comment => ({
                _id: comment._id,
                comment: comment.comment,
                createdAt: comment.createdAt,
                user: {
                    username: (comment.user as any).username,
                    profilePhoto: (comment.user as any).profilePhoto
                }
            }))
        }));

        console.log('Feeds with comments:', feedsWithComments);

        return NextResponse.json(
            { 
                feeds: feedsWithComments, 
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
