// src/app/api/get-profile-photo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';

export async function POST(request: NextRequest) {
    await dbConnect();

    const { username } = await request.json();

    try {
        const user = await UserModel.findOne({ username });

        if (!user) {
            return NextResponse.json(
                { message: 'User not found', success: false },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, profilePhoto: user.profilePhoto });
    } catch (error) {
        console.error('Error fetching profile photo:', error);
        return NextResponse.json({ success: false, message: 'Failed to fetch profile photo' }, { status: 500 });
    }
}
