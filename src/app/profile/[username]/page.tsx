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
    const [profilePhoto, setProfilePhoto] = useState('');
    const [coverPhoto, setCoverPhoto] = useState('');
    const { toast } = useToast();
    const { username } = useParams();
    const { data: session, status } = useSession();
    const router = useRouter();

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
                setFeeds(response.data.feeds);
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

    // Fetch initial state from the server
    useEffect(() => {
        if (!username) return;

        fetchProfileData();
        checkFollowingStatus();
    }, [username, fetchProfileData, checkFollowingStatus]);

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

    // Check if the profile belongs to the logged-in user
    const isOwnProfile = session?.user?.username === username;

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
                        <div className="relative w-52 h-52 rounded-full overflow-hidden border-4 border-white">
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
                            {isFollowing ? 'Unfollow' : 'Follow'}
                        </Button>
                    </div>
                )}
            </div>
            <div className="mt-16 text-center">
                <h1 className="text-4xl font-bold mb-2">{username}</h1>
                <div className="flex justify-center space-x-8">
                    <div>
                        <h2 className="text-lg font-semibold">Followers</h2>
                        <p>{followersCount}</p>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">Following</h2>
                        <p>{followingCount}</p>
                    </div>
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
