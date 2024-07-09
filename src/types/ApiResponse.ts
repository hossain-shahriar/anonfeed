import { IFeed } from '../model/Feed';

export interface ApiResponse {
    success: boolean;
    message: string;
    feeds?: Array<IFeed>;
    isAccepting?: boolean;
}
