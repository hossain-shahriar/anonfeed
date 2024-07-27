// src/app/profile/[username]/page.tsx
'use client'

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios, { AxiosError } from 'axios';
import FeedCard from '@/components/FeedCard';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { IFeed } from '@/model/Feed';
import { ApiResponse } from '@/types/ApiResponse';
import { RefreshCcw, Loader2 } from 'lucide-react';
import { IComment } from '@/model/Comment';
import mongoose from 'mongoose';

type PopulatedComment = Omit<IComment, 'user'> & {
    user: {
        username: string;
        profilePhoto: string;
    };
};

type PopulatedFeed = IFeed & { comments: PopulatedComment[] };

function UserProfile() {
    const [feeds, setFeeds] = useState<PopulatedFeed[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followingCount, setFollowingCount] = useState(0);
    const [followersCount, setFollowersCount] = useState(0);
    const [profilePhoto, setProfilePhoto] = useState('');
    const [coverPhoto, setCoverPhoto] = useState('');
    const [followers, setFollowers] = useState<{ username: string; profilePhoto: string }[]>([]);
    const [following, setFollowing] = useState<{ username: string; profilePhoto: string }[]>([]);
    const [showFollowers, setShowFollowers] = useState(false);
    const [showFollowing, setShowFollowing] = useState(false);
    const { toast } = useToast();
    const { username } = useParams();
    const { data: session, status } = useSession();
    const router = useRouter();
    const [hasRequested, setHasRequested] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/sign-in');
        }
    }, [status, router]);

    const fetchProfileData = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axios.get<ApiResponse>(`/api/get-feeds/${username}`);
            if (response.data.feeds) {
                const feedsWithComments = response.data.feeds.map((feed: any) => ({
                    ...feed,
                    comments: feed.comments.map((comment: any) => ({
                        _id: new mongoose.Types.ObjectId(comment._id),
                        comment: comment.comment,
                        createdAt: new Date(comment.createdAt),
                        user: {
                            username: comment.user.username,
                            profilePhoto: comment.user.profilePhoto,
                        },
                    })),
                }));
                setFeeds(feedsWithComments);
            } else {
                setFeeds([]); // Clear feeds if not following or no feeds available
            }
            setProfilePhoto(response.data.profilePhoto || '');
            setCoverPhoto(response.data.coverPhoto || '');
            setFollowingCount(response.data.followingCount ?? 0);
            setFollowersCount(response.data.followersCount ?? 0);
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>;
            if (axiosError.response?.status === 403) {
                setFeeds([]); // Clear feeds if not following
            }
            toast({
                title: 'Error',
                description:
                    axiosError.response?.data.message ?? 'Failed to fetch profile data',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [username, toast]);

    const checkFollowingStatus = useCallback(async () => {
        try {
            const response = await axios.post<ApiResponse>('/api/is-following', { username });
            setIsFollowing(response.data.isFollowing ?? false); // Ensure isFollowing is a boolean
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>;
            toast({
                title: 'Error',
                description:
                    axiosError.response?.data.message ?? 'Failed to check following status',
                variant: 'destructive',
            });
        }
    }, [username, toast]);

    const checkRequestStatus = useCallback(async () => {
        try {
            const response = await axios.post<ApiResponse>('/api/has-been-requested', { username });
            setHasRequested(response.data.hasBeenRequested ?? false);
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>;
            toast({
                title: 'Error',
                description: axiosError.response?.data.message ?? 'Failed to check follow request status',
                variant: 'destructive',
            });
        }
    }, [username, toast]);


    const fetchFollowers = async () => {
        try {
            const response = await axios.get<{ followers: { username: string; profilePhoto: string }[] }>(`/api/show-followers?username=${username}`);
            setFollowers(response.data.followers);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to fetch followers',
                variant: 'destructive',
            });
        }
    };

    const fetchFollowing = async () => {
        try {
            const response = await axios.get<{ following: { username: string; profilePhoto: string }[] }>(`/api/show-following?username=${username}`);
            setFollowing(response.data.following);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to fetch following',
                variant: 'destructive',
            });
        }
    };

    useEffect(() => {
        if (!username) return;
        fetchProfileData();
        checkFollowingStatus();
        checkRequestStatus(); // Add this line
    }, [username, fetchProfileData, checkFollowingStatus, checkRequestStatus]);


    const handleFollow = async () => {
        try {
            await axios.post('/api/follow', { username });
            setIsFollowing(true);
            fetchProfileData(); // Refresh profile data after following
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>;
            toast({
                title: 'Error',
                description:
                    axiosError.response?.data.message ?? 'Failed to follow user',
                variant: 'destructive',
            });
        }
    };

    const handleUnfollow = async () => {
        try {
            await axios.post('/api/unfollow', { username });
            setIsFollowing(false);
            setFeeds([]); // Clear feeds immediately after unfollowing
            fetchProfileData(); // Refresh profile data after unfollowing
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>;
            toast({
                title: 'Error',
                description:
                    axiosError.response?.data.message ?? 'Failed to unfollow user',
                variant: 'destructive',
            });
        }
    };

    const isOwnProfile = session?.user?.username === username;

    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    const profileUrl = `${baseUrl}/u/${username}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(profileUrl);
        toast({
            title: 'URL Copied!',
            description: 'Profile URL has been copied to clipboard.',
        });
    };

    return (
        <div className="my-8 mx-4 md:mx-8 lg:mx-auto p-6 bg-white rounded w-full max-w-6xl">
            <div className="relative">
                {coverPhoto && (
                    <div className="relative h-48 w-full mb-4 rounded overflow-hidden">
                        <img src={coverPhoto} alt="Cover Photo" className="object-cover w-full h-full" />
                    </div>
                )}
                <div className="absolute left-4 bottom-[-40px] transform translate-y-1/2">
                    {profilePhoto && (
                        <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white">
                            <img src={profilePhoto} alt="Profile Photo" className="object-cover w-full h-full" />
                        </div>
                    )}
                </div>
                {!isOwnProfile && (
                    <div className="absolute right-4 bottom-[-40px] transform translate-y-1/2">
                        <Button
                            className="bg-blue-500 text-white"
                            onClick={isFollowing ? handleUnfollow : handleFollow}
                        >
                            {isFollowing ? 'Unfollow' : hasRequested ? 'Requested' : 'Follow'}
                        </Button>
                    </div>
                )}
            </div>
            <div className="mt-16 text-center">
                <h1 className="text-4xl font-bold mb-2">{username}</h1>
                <div className="flex justify-center space-x-8">
                    <div
                        onMouseEnter={() => {
                            fetchFollowers();
                            setShowFollowers(true);
                        }}
                        onMouseLeave={() => setShowFollowers(false)}
                    >
                        <h2 className="text-lg font-semibold">Followers</h2>
                        <p>{followersCount}</p>
                        {showFollowers && (
                            <div className="absolute mt-2 w-56 bg-white border rounded shadow-lg p-4">
                                {followers.map((follower, index) => (
                                    <div key={index} className="flex items-center space-x-2 mb-2">
                                        <img
                                            src={follower.profilePhoto || '/default-profile.png'}
                                            alt={follower.username}
                                            className="w-8 h-8 rounded-full"
                                        />
                                        <span>{follower.username}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div
                        onMouseEnter={() => {
                            fetchFollowing();
                            setShowFollowing(true);
                        }}
                        onMouseLeave={() => setShowFollowing(false)}
                    >
                        <h2 className="text-lg font-semibold">Following</h2>
                        <p>{followingCount}</p>
                        {showFollowing && (
                            <div className="absolute mt-2 w-56 bg-white border rounded shadow-lg p-4">
                                {following.map((follow, index) => (
                                    <div key={index} className="flex items-center space-x-2 mb-2">
                                        <img
                                            src={follow.profilePhoto || '/default-profile.png'}
                                            alt={follow.username}
                                            className="w-8 h-8 rounded-full"
                                        />
                                        <span>{follow.username}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-lg font-semibold mb-2">Copy This User's Unique Link</h2>
                <div className="flex items-center">
                    <input
                        type="text"
                        value={profileUrl}
                        disabled
                        className="input input-bordered w-full p-2 mr-2"
                    />
                    <Button onClick={copyToClipboard}>Copy</Button>
                </div>
            </div>

            <Button
                className="mt-4"
                variant="outline"
                onClick={(e) => {
                    e.preventDefault();
                    fetchProfileData();
                }}
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <RefreshCcw className="h-4 w-4" />
                )}
            </Button>
            <Separator />
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                {feeds.length > 0 ? (
                    feeds.map((feed) => (
                        <FeedCard
                            key={feed._id.toString()}
                            feed={feed}
                            isProfileView={true} // Pass true for profile view
                        />
                    ))
                ) : (
                    <p>No feeds to display.</p>
                )}
            </div>
        </div>
    );
}

export default UserProfile;
