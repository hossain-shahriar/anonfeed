// src/app/api/show-followers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const username = searchParams.get('username');

        const user = await UserModel.findOne({ username }).populate('followers', 'username profilePhoto');
        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        const followers = user.followers.map((follower: any) => ({
            username: follower.username,
            profilePhoto: follower.profilePhoto
        }));

        return NextResponse.json({ followers }, { status: 200 });
    } catch (error) {
        console.error('An unexpected error occurred:', error);
        return NextResponse.json({ message: 'Internal server error', success: false }, { status: 500 });
    }
}
