// src/app/api/count-followers/route.ts
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
        const profileUser = await UserModel.findOne({ username });
        if (!profileUser) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        const followersCount = profileUser.followers.length;

        return NextResponse.json({ success: true, followersCount }, { status: 200 });
    } catch (error) {
        console.error('An unexpected error occurred:', error);
        return NextResponse.json({ message: 'Internal server error', success: false }, { status: 500 });
    }
}
