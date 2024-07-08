import dbConnect from "@/lib/dbConnect";
import User from "@/model/User";
import { z } from "zod";
import { usernameValidation } from "@/schemas/signUpSchema";

const UsernameQuerySchema = z.object({
    username: usernameValidation
});

export async function GET(request: Request) {
    await dbConnect();

    try {
        const { searchParams } = new URL(request.url);
        const queryParam = {
            username: searchParams.get("username")
        };

        //validate with zod
        const result = UsernameQuerySchema.safeParse(queryParam);
        if (!result.success) {
            const usernameErrors = result.error.format().username?._errors || [];
            return Response.json({
                success: false,
                message: usernameErrors?.length > 0 ? usernameErrors.join(", ") : "Invalid query parameters"},
                { status: 400 }
            )
        }

        const { username } = result.data;

        const existingVerifiedUser = await User.findOne
        ({ username, verified: true });

        if (existingVerifiedUser) {
            return Response.json({ success: false, message: "Username already exists" },
                { status: 409 }
            )
        }

        return Response.json({ success: true, message: "Username is unique" },
            { status: 409 }
        )

    } catch (error) {
        console.error("Error checking username uniqueness: ", error);
        return Response.json({ success: false, message: "Error checking username uniqueness" },
            { status: 500 }
        )
    }
}