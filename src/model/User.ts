import mongoose, {Schema, Document} from "mongoose";
import { Feed } from "./Feed";

export interface User extends Document {
    username: string;
    email: string;
    password: string;
    verifyCode: string;
    verifyCodeExpiry: Date;
    verified: boolean;
    following: User[];
    followers: User[];
    feeds: Feed[];
}

const UserSchema: Schema<User> = new Schema({
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
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    feeds: [{ type: Schema.Types.ObjectId, ref: "Feed" }],
});

const User = (mongoose.models.User as mongoose.Model<User>) || mongoose.model<User>("User", UserSchema)

export default User