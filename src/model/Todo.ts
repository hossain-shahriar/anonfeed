import mongoose, {Schema, Document} from "mongoose";
import { User } from "./User";

export interface Todo extends Document {
    title: string;
    description: string;
    createdAt: Date;
    completed: boolean;
    user: User
}

const TodoSchema: Schema<Todo> = new Schema({
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

const Todo = (mongoose.models.Todo as mongoose.Model<Todo>) || mongoose.model<Todo>("Todo", TodoSchema);

export default Todo;