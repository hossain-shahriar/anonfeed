// src/app/api/get-feeds/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import FeedModel from "@/model/Feed";
import CommentModel from '@/model/Comment';
import { User } from "next-auth";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
    await dbConnect();

    const session = await getServerSession(authOptions);
    const user = session?.user as User;

    if (!session || !session.user) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const userId = new mongoose.Types.ObjectId("669e0ff5d7cb34f324acfa9b");

    try {
        const loggedInUser = await UserModel.findById(userId);

        if (!loggedInUser) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        const feeds = await FeedModel.find({ _id: { $in: loggedInUser.feeds } }).sort({ createdAt: -1 }).exec();

        const feedIds = feeds.map(feed => feed._id);
        const comments = await CommentModel.find({ feed: { $in: feedIds } }).populate('user').exec();

        const feedsWithComments = feeds.map(feed => ({
            ...feed.toObject(),
            comments: comments
                .filter(comment => comment.feed.equals(feed._id))
                .map(comment => ({
                    _id: comment._id,
                    comment: comment.comment,
                    createdAt: comment.createdAt,
                    user: {
                        username: (comment.user as any).username,
                        profilePhoto: (comment.user as any).profilePhoto
                    }
                }))
        }));

        return NextResponse.json(
            { 
                feeds: feedsWithComments,
                profilePhoto: loggedInUser.profilePhoto,
                coverPhoto: loggedInUser.coverPhoto,
                followingCount: loggedInUser.following.length,
                followersCount: loggedInUser.followers.length
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('An unexpected error occurred:', error);
        return NextResponse.json(
            { message: 'Internal server error', success: false },
            { status: 500 }
        );
    }
}
