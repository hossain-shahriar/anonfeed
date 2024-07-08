import dbConnect from "@/lib/dbConnect";
import User from "@/model/User";
// import Todo from "@/model/Todo";
import bcrypt from "bcryptjs";

import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";

export async function POST(request: Request) {
    await dbConnect();

    try {
        const {username, email, password} = await request.json();
        const existingUserVerifiedByUsername = await User.findOne({
            username,
            isVerified: true
        })
        
        if (existingUserVerifiedByUsername) {
            return Response.json(
                {
                    success: false,
                    message: "User with this username already exists."
                },
                {
                    status: 400
                }
            )
        }

        const existingUserByEmail = await User.findOne
        ({email})

        const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

        if (existingUserByEmail) {
            if (existingUserByEmail.verified) {
                return Response.json(
                    {
                        success: false,
                        message: "User with this email already exists."
                    },
                    {
                        status: 400
                    }
                )
            }
            else {
                const hashedPassword = await bcrypt.hash(password, 10);
                existingUserByEmail.password = hashedPassword;
                existingUserByEmail.verifyCode = verifyCode;
                existingUserByEmail.verifyCodeExpiry = new Date(Date.now() + 3600000);
                await existingUserByEmail.save();
            }
        }else {
            const hashedPassword = await bcrypt.hash(password, 10);
            const expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours() + 1);

            const newUser = new User({
                username,
                email,
                password: hashedPassword,
                verifyCode,
                verifyCodeExpiry: expiryDate,
                verified: false,
                following: [],
                followers: [],
                todos: [],
        })
            await newUser.save();
        }

        //send verification email
        const emailResponse = await sendVerificationEmail(email, username, verifyCode);

        if (!emailResponse.success) {
            return Response.json(
                {
                    success: false,
                    message: `${emailResponse.message} Error sending verification email. Please try again later.`
                },
                {
                    status: 500
                }
            )
        }

        return Response.json(
            {
                success: true,
                message: "User registered successfully. Please verify your email address."
            },
            {
                status: 201
            }
        )

    } catch (error) {
        console.error("Error registering user: ", error)
        return Response.json(
            {
                success: false,
                message: "Error registering user. Please try again later."
            },
            {
                status: 500
            }
        )
    }
}