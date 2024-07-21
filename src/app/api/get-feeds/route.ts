import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import { User } from "next-auth";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
    await dbConnect();

    const session = await getServerSession(authOptions);
    const user = session?.user as User;

    if (!session || !session.user) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const userId = new mongoose.Types.ObjectId(user._id);

    try {
        const loggedInUser = await UserModel.findById(userId);

        if (!loggedInUser) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        const userFeeds = await UserModel.aggregate([
            { $match: { _id: userId } },
            { $lookup: {
                from: 'feeds',
                localField: 'feeds',
                foreignField: '_id',
                as: 'feeds'
            }},
            { $unwind: '$feeds' },
            { $sort: { 'feeds.createdAt': -1 } },
            { $group: { _id: '$_id', feeds: { $push: '$feeds' } } }
        ]).exec();

        const feeds = userFeeds.length > 0 ? userFeeds[0].feeds : [];

        return NextResponse.json(
            { 
                feeds: feeds,
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
