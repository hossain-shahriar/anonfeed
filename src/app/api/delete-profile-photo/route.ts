// src/app/api/delete-profile-photo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';

// Configure Cloudinary with environment variables
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
    await dbConnect();

    const { username, publicId } = await request.json();

    try {
        const user = await UserModel.findOne({ username });

        if (!user) {
            return NextResponse.json(
                { message: 'User not found', success: false },
                { status: 404 }
            );
        }

        // Delete the image from Cloudinary
        await cloudinary.uploader.destroy(publicId);

        // Remove the profile photo URL from the user document
        user.profilePhoto = '';
        await user.save();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting profile photo:', error);
        return NextResponse.json({ success: false, message: 'Failed to delete profile photo' }, { status: 500 });
    }
}
