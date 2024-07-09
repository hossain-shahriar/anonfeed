import mongoose, { Schema, Document } from "mongoose";
import UserModel, { IUser } from "./User";

export interface IFeed extends Document {
    title: string;
    description: string;
    createdAt: Date;
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
    }
});

const FeedModel = (mongoose.models.Feed as mongoose.Model<IFeed>) || mongoose.model<IFeed>("Feed", FeedSchema);

export default FeedModel;
