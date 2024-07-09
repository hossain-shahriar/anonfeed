// import {resend} from "@/lib/resend";

// import VerificationEmail from "../../emails/VerificationEmail";

// import { ApiResponse } from "@/types/ApiResponse";

// export async function sendVerificationEmail(
//     email: string,
//     username: string,
//     verifyCode: string
// ): Promise<ApiResponse> {
//     try {
//         console.log({email, username, verifyCode})
//         const emailResponse = await resend.emails.send({
//             from: "onboarding@resend.dev",
//             to: email,
//             subject: "Verify your account",
//             react: VerificationEmail({ username, otp: verifyCode }),
//         })
//         console.log('Email Response:', emailResponse);
//         return {success: true, message: 'Verification email sent successfully' }
//     } catch (emailError) {
//         console.error('Error sending verification email:', emailError);
//         return {success: false, message: 'Error sending verification email' }
//     }
// }

import dotenv from 'dotenv';
dotenv.config();

import nodemailer from 'nodemailer';
import { ApiResponse } from "@/types/ApiResponse";

export async function sendVerificationEmail(
    email: string,
    username: string,
    verifyCode: string
): Promise<ApiResponse> {
    // Create a transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // Use `true` for port 465, `false` for other ports
        auth: {
            user: process.env.NODEMAILER_USER,
            pass: process.env.NODEMAILER_PASS,
        },
    });

    // Define the email options
    const mailOptions = {
        from: `Anonfeed <${process.env.NODEMAILER_USER}>`, // sender address
        to: email, // receiver address
        subject: "Verify your account", // Subject line
        text: `Hello ${username},\n\nThank you for registering with us. Please use the following verification code to verify your account: ${verifyCode}\n\nIf you did not register with us, please ignore this email.`, // plain text body
        html: `<strong>Hello ${username},</strong><br/><br/>Thank you for registering with us. Please use the following verification code to verify your account: <strong>${verifyCode}</strong><br/><br/>If you did not register with us, please ignore this email.`, // html body
    };

    try {
        // Send mail with defined transport object
        const info = await transporter.sendMail(mailOptions);
        
        console.log("Message sent: %s", info.messageId);
        // Preview URL: %s", nodemailer.getTestMessageUrl(info));
        
        return { success: true, message: 'Verification email sent successfully' };
    } catch (error) {
        console.error('Error sending verification email:', error);
        return { success: false, message: 'Error sending verification email' };
    }
}
