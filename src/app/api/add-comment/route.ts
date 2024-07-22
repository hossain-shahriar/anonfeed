// src/app/api/add-comment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CommentModel from '@/model/Comment';
import FeedModel from '@/model/Feed';
import UserModel from '@/model/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const { feedId, comment } = await request.json();
        const userId = session.user._id;

        const feed = await FeedModel.findById(feedId);
        if (!feed) {
            return NextResponse.json({ success: false, message: "Feed not found" }, { status: 404 });
        }

        const newComment = new CommentModel({
            comment,
            createdAt: new Date(),
            user: new mongoose.Types.ObjectId(userId),
            feed: new mongoose.Types.ObjectId(feedId),
        });

        const savedComment = await newComment.save();

        await FeedModel.findByIdAndUpdate(feedId, { $addToSet: { comments: savedComment._id } });
        await UserModel.findByIdAndUpdate(userId, { $addToSet: { comments: savedComment._id } });

        return NextResponse.json({ success: true, message: "Comment added successfully", comment: savedComment }, { status: 201 });
    } catch (error) {
        console.error('An unexpected error occurred:', error);
        return NextResponse.json({ message: 'Internal server error', success: false }, { status: 500 });
    }
}
