// src/app/profile/[username]/page.tsx
'use client';

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

function UserProfile() {
    const [feeds, setFeeds] = useState<IFeed[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followingCount, setFollowingCount] = useState(0);
    const [followersCount, setFollowersCount] = useState(0);
    const { toast } = useToast();
    const { username } = useParams();
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/sign-in');
        }
    }, [status, router]);

    const fetchFeeds = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axios.get<ApiResponse>(`/api/get-feeds/${username}`);
            if (response.data.feeds) {
                setFeeds(response.data.feeds);
            } else {
                setFeeds([]); // Clear feeds if not following or no feeds available
            }
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>;
            if (axiosError.response?.status === 403) {
                setFeeds([]); // Clear feeds if not following
            }
            toast({
                title: 'Error',
                description:
                    axiosError.response?.data.message ?? 'Failed to fetch feeds',
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

    const fetchFollowingCount = useCallback(async () => {
        try {
            const response = await axios.post<ApiResponse>('/api/count-following', { username });
            setFollowingCount(response.data.followingCount ?? 0);
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>;
            toast({
                title: 'Error',
                description:
                    axiosError.response?.data.message ?? 'Failed to fetch following count',
                variant: 'destructive',
            });
        }
    }, [username, toast]);

    const fetchFollowersCount = useCallback(async () => {
        try {
            const response = await axios.post<ApiResponse>('/api/count-followers', { username });
            setFollowersCount(response.data.followersCount ?? 0);
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>;
            toast({
                title: 'Error',
                description:
                    axiosError.response?.data.message ?? 'Failed to fetch followers count',
                variant: 'destructive',
            });
        }
    }, [username, toast]);

    // Fetch initial state from the server
    useEffect(() => {
        if (!username) return;

        fetchFeeds();
        checkFollowingStatus();
        fetchFollowingCount();
        fetchFollowersCount();
    }, [username, fetchFeeds, checkFollowingStatus, fetchFollowingCount, fetchFollowersCount]);

    const handleFollow = async () => {
        try {
            await axios.post('/api/follow', { username });
            setIsFollowing(true);
            fetchFeeds(); // Refresh feeds after following
            fetchFollowersCount(); // Refresh followers count after following
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
            fetchFollowersCount(); // Refresh followers count after unfollowing
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

    // Check if the profile belongs to the logged-in user
    const isOwnProfile = session?.user?.username === username;

    return (
        <div className="my-8 mx-4 md:mx-8 lg:mx-auto p-6 bg-white rounded w-full max-w-6xl">
            <h1 className="text-4xl font-bold mb-4">{username}'s Profile</h1>

            <div className="flex items-center space-x-4">
                <div>
                    <span className="font-semibold">Following:</span> {followingCount}
                </div>
                <div>
                    <span className="font-semibold">Followers:</span> {followersCount}
                </div>
            </div>

            {!isOwnProfile && (
                <Button className="mt-4" variant="outline" onClick={isFollowing ? handleUnfollow : handleFollow}>
                    {isFollowing ? 'Unfollow' : 'Follow'}
                </Button>
            )}

            <Button
                className="mt-4"
                variant="outline"
                onClick={(e) => {
                    e.preventDefault();
                    fetchFeeds();
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
