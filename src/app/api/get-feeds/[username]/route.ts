// src/app/api/get-feeds/[username]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';
import { getServerSession } from 'next-auth';
import { authOptions } from "../../auth/[...nextauth]/options";

export async function GET(request: NextRequest, { params }: { params: { username: string } }) {
    try {
        await dbConnect();
        console.log('Database connected');

        const session = await getServerSession(authOptions);

        if (!session) {
            console.log('Unauthorized access attempt');
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const { username } = params;
        console.log(`Fetching feeds for user: ${username}`);

        const userFeeds = await UserModel.aggregate([
            { $match: { username: username } },
            {
                $lookup: {
                    from: 'feeds',
                    localField: 'feeds',
                    foreignField: '_id',
                    as: 'feeds'
                }
            },
            { $unwind: '$feeds' },
            { $sort: { 'feeds.createdAt': -1 } },
            { $group: { _id: '$_id', feeds: { $push: '$feeds' } } }
        ]).exec();

        console.log('Aggregation result:', userFeeds);

        if (!userFeeds || userFeeds.length === 0) {
            console.log('User not found or no feeds available');
            return NextResponse.json(
                { message: 'User not found', success: false },
                { status: 404 }
            );
        }

        console.log('Feeds found:', userFeeds[0].feeds);
        return NextResponse.json(
            { feeds: userFeeds[0].feeds },
            { status: 200 }
        );
    } catch (error) {
        console.error('An unexpected error occurred:', error);
        return NextResponse.json({ message: 'Internal server error', success: false }, { status: 500 });
    }
}
