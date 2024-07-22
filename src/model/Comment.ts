// src/model/Comment.ts
import mongoose, { Schema, Document } from "mongoose";
import { IUser } from "./User";
import { IFeed } from "./Feed";

export interface IComment extends Document {
    comment: string;
    createdAt: Date;
    user: mongoose.Types.ObjectId;
    feed: mongoose.Types.ObjectId;
}

const CommentSchema: Schema<IComment> = new Schema({
    comment: {
        type: String,
        required: [true, "Comment is required"],
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    feed: {
        type: Schema.Types.ObjectId,
        ref: "Feed",
        required: true
    }
});

const CommentModel = (mongoose.models.Comment as mongoose.Model<IComment>) || mongoose.model<IComment>("Comment", CommentSchema);

export default CommentModel;
