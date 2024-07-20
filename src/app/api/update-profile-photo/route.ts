// src/app/api/update-profile-photo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';

export async function POST(request: NextRequest) {
    await dbConnect();

    const { username, profilePhoto } = await request.json();

    try {
        const user = await UserModel.findOne({ username });

        if (!user) {
            return NextResponse.json(
                { message: 'User not found', success: false },
                { status: 404 }
            );
        }

        user.profilePhoto = profilePhoto;
        await user.save();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating profile photo:', error);
        return NextResponse.json({ success: false, message: 'Failed to update profile photo' }, { status: 500 });
    }
}
