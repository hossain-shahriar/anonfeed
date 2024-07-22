// src/model/User.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    verifyCode: string;
    verifyCodeExpiry: Date;
    verified: boolean;
    isAccepting: boolean;
    isPublic: boolean;
    following: mongoose.Types.ObjectId[];
    followers: mongoose.Types.ObjectId[];
    feeds: mongoose.Types.ObjectId[];
    profilePhoto: string;  // New field
    coverPhoto: string;    // New field
    comments: mongoose.Types.ObjectId[];  // New field
}

const UserSchema: Schema<IUser> = new Schema({
    username: {
        type: String,
        required: [true, "Username is required"],
        trim: true,
        unique: true
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        match: [/.+\@.+\..+/, "Please enter a valid e-mail address"]
    },
    password: {
        type: String,
        required: [true, "Password is required"],
    },
    verifyCode: {
        type: String,
        required: [true, "Verification code is required"],
    },
    verifyCodeExpiry: {
        type: Date,
        required: [true, "Verification code expiry is required"],
    },
    verified: {
        type: Boolean,
        default: false
    },
    isAccepting: {
        type: Boolean,
        default: true
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    feeds: [{ type: Schema.Types.ObjectId, ref: "Feed" }],
    profilePhoto: {
        type: String,
        default: ''
    },
    coverPhoto: {
        type: String,
        default: ''
    },
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
});

const UserModel = (mongoose.models.User as mongoose.Model<IUser>) || mongoose.model<IUser>("User", UserSchema);

export default UserModel;
