import UserModel from '@/model/User';
import FeedModel, { IFeed } from '@/model/Feed';
import dbConnect from '@/lib/dbConnect';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  await dbConnect();
  const { username, title, description } = await request.json();

  try {
    const user = await UserModel.findOne({ username });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found', success: false },
        { status: 404 }
      );
    }

    // Check if the user is accepting feeds
    if (!user.isAccepting) {
      return NextResponse.json(
        { message: 'User is not accepting feeds', success: false },
        { status: 403 } // 403 Forbidden status
      );
    }

    // Create a new feed
    const newFeed = new FeedModel({
      title,
      description,
      createdAt: new Date(), // Automatically set the current date and time
    });

    // Save the new feed
    const savedFeed = await newFeed.save();

    // Add the new feed to the user's feeds array
    user.feeds.push(savedFeed._id as mongoose.Types.ObjectId);
    await user.save();

    return NextResponse.json(
      { message: 'Feed added successfully', success: true },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding feed:', error);
    return NextResponse.json(
      { message: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
