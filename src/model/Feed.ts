import mongoose, {Schema, Document} from "mongoose";
import { User } from "./User";

export interface Feed extends Document {
    title: string;
    description: string;
    createdAt: Date;
    completed: boolean;
    user: User
}

const FeedSchema: Schema<Feed> = new Schema({
    title: {
        type: String,
        required: [true, "Title is required"],
    },
    description: {
        type: String,
        required: [true, "Description is required"],
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    completed: {
        type: Boolean,
        default: false
    },
    user: { type: Schema.Types.ObjectId, ref: "User" }
});

const Feed = (mongoose.models.Feed as mongoose.Model<Feed>) || mongoose.model<Feed>("Feed", FeedSchema);

export default Feed;