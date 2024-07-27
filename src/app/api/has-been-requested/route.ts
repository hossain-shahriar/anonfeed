// src/app/api/has-been-requested/route.ts
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
            return NextResponse.json({ success: false, message: "Unauthorized", hasBeenRequested: false }, { status: 401 });
        }

        const { username } = await request.json();
        const loggedInUserId = new mongoose.Types.ObjectId(session.user._id);

        const userToCheck = await UserModel.findOne({ username });
        if (!userToCheck) {
            return NextResponse.json({ success: false, message: "User not found", hasBeenRequested: false }, { status: 404 });
        }

        const hasBeenRequested = userToCheck.pendingFollowRequests.some(requestId => requestId.equals(loggedInUserId));

        return NextResponse.json({ success: true, hasBeenRequested }, { status: 200 });
    } catch (error) {
        console.error('An unexpected error occurred:', error);
        return NextResponse.json({ message: 'Internal server error', success: false, hasBeenRequested: false }, { status: 500 });
    }
}
