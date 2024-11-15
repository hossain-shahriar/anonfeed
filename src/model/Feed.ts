// src/model/Feed.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IFeed extends Document {
    _id: mongoose.Types.ObjectId;
    title: string;
    description: string;
    createdAt: Date;
    comments: mongoose.Types.ObjectId[];  // New field
}

const FeedSchema: Schema<IFeed> = new Schema({
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
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
});

const FeedModel = (mongoose.models.Feed as mongoose.Model<IFeed>) || mongoose.model<IFeed>("Feed", FeedSchema);

export default FeedModel;
