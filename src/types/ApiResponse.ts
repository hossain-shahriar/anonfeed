import { IUser } from '@/model/User';
import { IFeed } from '../model/Feed';
import { IComment } from '../model/Comment';

export interface ApiResponse {
    success: boolean;
    message: string;
    profilePhoto?: string;
    coverPhoto?: string;
    feeds?: Array<IFeed>;
    users?: Array<IUser>;
    following?: Array<IUser>;
    followers?: Array<IUser>;
    isAccepting?: boolean;
    isFollowing?: boolean;
    followersCount?: number;
    followingCount?: number;
    comment?: IComment;
}
