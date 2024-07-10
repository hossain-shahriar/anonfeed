import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import { User } from "next-auth";
import mongoose from "mongoose";

export async function GET(request: Request) {
    await dbConnect();

    const session = await getServerSession(authOptions);
    const user = session?.user as User;

    if (!session || !session.user) {
        return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const userId = new mongoose.Types.ObjectId(user._id);

    try {
        const userFeeds = await UserModel.aggregate([
            { $match: { _id: userId } },
            { $lookup: {
                from: 'feeds',
                localField: 'feeds',
                foreignField: '_id',
                as: 'feeds'
            }},
            { $unwind: '$feeds' },
            { $sort: { 'feeds.createdAt': -1 } },
            { $group: { _id: '$_id', feeds: { $push: '$feeds' } } }
        ]).exec();

        if (!userFeeds || userFeeds.length === 0) {
            return Response.json(
                { message: 'User not found', success: false },
                { status: 404 }
            );
        }

        return Response.json(
            { feeds: userFeeds[0].feeds },
            { status: 200 }
        );
    } catch (error) {
        console.error('An unexpected error occurred:', error);
        return Response.json(
            { message: 'Internal server error', success: false },
            { status: 500 }
        );
    }
}
