import { Todo } from '../model/Todo';

export interface ApiResponse {
    success: boolean;
    message: string;
    todos?: Array<Todo>
}