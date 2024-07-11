// src/app/api/unfollow/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const { username } = await request.json();
        const loggedInUserId = session.user._id;

        const userToUnfollow = await UserModel.findOne({ username });
        if (!userToUnfollow) {
            return NextResponse.json({ success: false, message: "User to unfollow not found" }, { status: 404 });
        }

        const userToUnfollowId = userToUnfollow._id;

        await UserModel.findByIdAndUpdate(loggedInUserId, { $pull: { following: userToUnfollowId } });
        await UserModel.findByIdAndUpdate(userToUnfollowId, { $pull: { followers: loggedInUserId } });

        return NextResponse.json({ success: true, message: "Unfollowed successfully" }, { status: 200 });
    } catch (error) {
        console.error('An unexpected error occurred:', error);
        return NextResponse.json({ message: 'Internal server error', success: false }, { status: 500 });
    }
}
