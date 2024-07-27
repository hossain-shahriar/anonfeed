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
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const { username } = await request.json();
        const loggedInUserId = new mongoose.Types.ObjectId(session.user._id);

        const userToReject = await UserModel.findOne({ username });
        if (!userToReject) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        const userToRejectId = userToReject._id;

        await UserModel.findByIdAndUpdate(loggedInUserId, { $pull: { pendingFollowRequests: userToRejectId } });

        return NextResponse.json({ success: true, message: "Follow request rejected" }, { status: 200 });
    } catch (error) {
        console.error('An unexpected error occurred:', error);
        return NextResponse.json({ message: 'Internal server error', success: false }, { status: 500 });
    }
}
