// src/app/api/get-pending-follow-requests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session) {
            console.log('Unauthorized access attempt');
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const loggedInUserId = new mongoose.Types.ObjectId(session.user._id);
        console.log(`Fetching pending follow requests for user ID: ${loggedInUserId}`);

        const loggedInUser = await UserModel.findById(loggedInUserId).populate('pendingFollowRequests', 'username profilePhoto');

        if (!loggedInUser) {
            console.log('Logged-in user not found');
            return NextResponse.json({ success: false, message: "Logged-in user not found" }, { status: 404 });
        }

        console.log('Pending follow requests:', loggedInUser.pendingFollowRequests);

        const pendingFollowRequests = loggedInUser.pendingFollowRequests.map((user: any) => ({
            username: user.username,
            profilePhoto: user.profilePhoto || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
        }));
        
        console.log('Pending follow requests:', pendingFollowRequests);
        return NextResponse.json({ success: true, pendingFollowRequests }, { status: 200 });
    } catch (error) {
        console.error('An unexpected error occurred:', error);
        return NextResponse.json({ message: 'Internal server error', success: false }, { status: 500 });
    }
}
