import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import { User } from "next-auth";

export async function POST(request: Request) {
    await dbConnect();

    const session = await getServerSession(authOptions)
    const user = session?.user as User

    if (!session || !session.user) {
        return Response.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const userId = user._id;
    const {acceptFeeds} = await request.json();

    try {
        const updatedUser = await UserModel.findByIdAndUpdate(
            userId,
            { isAccepting: acceptFeeds },
            { new: true }
        )

        if (!updatedUser) {
            return Response.json({ success: false, message: "User not found" }, { status: 404 })
        }

        return Response.json({ success: true, message: "User status updated successfully", updatedUser }, { status: 200 })

    } catch (error) {
        console.error("Failed to update user status to accept messages: ", error);
        return Response.json({ success: false, message: "Failed to update user status to accept messages" }, { status: 500 })
    }
}

export async function GET(request: Request) {
    await dbConnect();

    const session = await getServerSession(authOptions)
    const user = session?.user as User

    if (!session || !session.user) {
        return Response.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const userId = user._id;
    const foundUser = await UserModel.findById(userId);

    try {

        if (!foundUser) {
            return Response.json({ success: false, message: "User not found" }, { status: 404 })
        }

        return Response.json({ success: true, isAccepting: foundUser.isAccepting}, { status: 200 })

    } catch (error) {
        console.error("Failed to get user status to accept messages: ", error);
        return Response.json({ success: false, message: "Failed to get user status to accept messages" }, { status: 500 })
    }
}