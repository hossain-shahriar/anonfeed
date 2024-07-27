// src/app/api/follow/route.ts
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
        const loggedInUserId = session.user._id as string;

        // Ensure loggedInUserId is a string
        if (!loggedInUserId) {
            return NextResponse.json({ success: false, message: "Logged in user ID is missing" }, { status: 400 });
        }

        const userToFollow = await UserModel.findOne({ username });
        if (!userToFollow) {
            return NextResponse.json({ success: false, message: "User to follow not found" }, { status: 404 });
        }

        const userToFollowId = userToFollow._id;

        // Convert pendingFollowRequests to an array of ObjectId strings
        const pendingFollowRequests = userToFollow.pendingFollowRequests.map(id => id.toString());

        // Check if there's already a pending follow request
        const alreadyRequested = pendingFollowRequests.includes(loggedInUserId);
        if (alreadyRequested) {
            return NextResponse.json({ success: false, message: "Follow request already sent" }, { status: 400 });
        }

        // Add to pending follow requests for the user to be followed
        await UserModel.findByIdAndUpdate(userToFollowId, { $addToSet: { pendingFollowRequests: loggedInUserId } });

        // Add to sent follow requests for the logged-in user
        await UserModel.findByIdAndUpdate(loggedInUserId, { $addToSet: { sentFollowRequests: userToFollowId } });

        return NextResponse.json({ success: true, message: "Follow request sent successfully" }, { status: 200 });
    } catch (error) {
        console.error('An unexpected error occurred:', error);
        return NextResponse.json({ message: 'Internal server error', success: false }, { status: 500 });
    }
}
