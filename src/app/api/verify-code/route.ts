import dbConnect from "@/lib/dbConnect";
import User from "@/model/User";

export async function POST(request: Request) {
    await dbConnect();

    try {
        const { username, code } = await request.json();

        const decodedUsername = decodeURIComponent(username);

        const user = await User.findOne({ username: decodedUsername })
        if (!user) {
            return Response.json({
                success: false,
                message: "User not found"
            },
                { status: 500 }
            )
        }

        const isCodeValid = user.verifyCode === code;
        const isCodeNotExpired = new Date(user.verifyCodeExpiry) > new Date();

        if (isCodeValid && isCodeNotExpired) {
            user.verified = true;
            await user.save();

            return Response.json({ success: true, message: "User verified successfully" })
        } else if (!isCodeNotExpired){
            return Response.json({ success: false, message: "Verification code expired" },
                { status: 400 }
            )
        } else {
            return Response.json({ success: false, message: "Invalid verification code" },
                { status: 400 }
            )
        }

    } catch (error) {
        console.error("Error verifying user: ", error);
        return Response.json({ success: false, message: "Error verifying user" },
            { status: 500 }
        )
    }
}