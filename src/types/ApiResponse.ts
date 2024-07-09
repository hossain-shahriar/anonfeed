import { Todo } from '../model/Feed';

export interface ApiResponse {
    success: boolean;
    message: string;
    todos?: Array<Todo>
}