// src/app/api/is-following/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ success: false, message: "Unauthorized", isFollowing: false }, { status: 401 });
        }

        const { username } = await request.json();
        const loggedInUserId = new mongoose.Types.ObjectId(session.user._id);

        const userToCheck = await UserModel.findOne({ username });
        if (!userToCheck) {
            return NextResponse.json({ success: false, message: "User not found", isFollowing: false }, { status: 404 });
        }

        const userToCheckId = new mongoose.Types.ObjectId(userToCheck._id as mongoose.Types.ObjectId);

        const loggedInUser = await UserModel.findById(loggedInUserId);
        if (!loggedInUser) {
            return NextResponse.json({ success: false, message: "Logged-in user not found", isFollowing: false }, { status: 404 });
        }

        const isFollowing = loggedInUser.following.some(followingId => followingId.equals(userToCheckId));

        return NextResponse.json({ success: true, isFollowing }, { status: 200 });
    } catch (error) {
        console.error('An unexpected error occurred:', error);
        return NextResponse.json({ message: 'Internal server error', success: false, isFollowing: false }, { status: 500 });
    }
}
