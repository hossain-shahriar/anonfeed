'use client';

import FeedCard from '@/components/FeedCard';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { IFeed } from '@/model/Feed';
import { ApiResponse } from '@/types/ApiResponse';
import { zodResolver } from '@hookform/resolvers/zod';
import axios, { AxiosError } from 'axios';
import { Loader2, RefreshCcw, Eye, Trash2, UploadCloud } from 'lucide-react';
import { User } from 'next-auth';
import { useSession } from 'next-auth/react';
import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { acceptFeedSchema } from '@/schemas/acceptFeedSchema';
import { CldUploadWidget } from 'next-cloudinary';
import { IComment } from '@/model/Comment';
import mongoose from 'mongoose';

type PopulatedComment = Omit<IComment, 'user'> & {
  user: {
    username: string;
    profilePhoto: string;
  };
};

type FeedCardProps = {
  feed: IFeed & { comments: PopulatedComment[] };
  onFeedDelete?: (feedId: string) => void;
  onCommentDelete?: (commentId: string) => void;
};

type PopulatedFeed = IFeed & { comments: PopulatedComment[] };

function UserDashboard() {
  const [feeds, setFeeds] = useState<PopulatedFeed[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitchLoading, setIsSwitchLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState('');
  const [coverPhoto, setCoverPhoto] = useState('');
  const [profilePhotoPublicId, setProfilePhotoPublicId] = useState('');
  const [coverPhotoPublicId, setCoverPhotoPublicId] = useState('');
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followers, setFollowers] = useState<{ username: string; profilePhoto: string }[]>([]);
  const [following, setFollowing] = useState<{ username: string; profilePhoto: string }[]>([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  const { toast } = useToast();

  const handleDeleteFeed = (feedId: string) => {
    setFeeds(feeds.filter((feed) => feed._id.toString() !== feedId));
  };

  const { data: session } = useSession();

  const form = useForm({
    resolver: zodResolver(acceptFeedSchema),
  });

  const { register, watch, setValue } = form;
  const acceptFeeds = watch('acceptFeeds');

  const fetchAcceptFeeds = useCallback(async () => {
    setIsSwitchLoading(true);
    try {
      const response = await axios.get<ApiResponse>('/api/accept-feeds');
      setValue('acceptFeeds', response.data.isAccepting);
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast({
        title: 'Error',
        description:
          axiosError.response?.data.message ??
          'Failed to fetch feed settings',
        variant: 'destructive',
      });
    } finally {
      setIsSwitchLoading(false);
    }
  }, [setValue, toast]);

  const fetchFeeds = useCallback(
    async (refresh: boolean = false) => {
      setIsLoading(true);
      setIsSwitchLoading(false);
      try {
        const response = await axios.get<ApiResponse>('/api/get-feeds');
        console.log('Response data:', response.data);

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
        }

        setProfilePhoto(response.data.profilePhoto || '');
        setCoverPhoto(response.data.coverPhoto || '');
        const profilePhotoParts = response.data.profilePhoto?.split('/');
        const coverPhotoParts = response.data.coverPhoto?.split('/');
        setProfilePhotoPublicId(profilePhotoParts?.[profilePhotoParts.length - 1]?.split('.')[0] || '');
        setCoverPhotoPublicId(coverPhotoParts?.[coverPhotoParts.length - 1]?.split('.')[0] || '');
        setFollowersCount(response.data.followersCount || 0);
        setFollowingCount(response.data.followingCount || 0);
        if (refresh) {
          toast({
            title: 'Refreshed Feeds',
            description: 'Showing latest feeds',
          });
        }
      } catch (error) {
        const axiosError = error as AxiosError<ApiResponse>;
        toast({
          title: 'Error',
          description:
            axiosError.response?.data.message ?? 'Failed to fetch feeds',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
        setIsSwitchLoading(false);
      }
    },
    [setIsLoading, setFeeds, toast]
  );


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
    if (!session || !session.user) return;

    fetchFeeds();
    fetchAcceptFeeds();
  }, [session, setValue, toast, fetchAcceptFeeds, fetchFeeds]);

  // Handle switch change
  const handleSwitchChange = async () => {
    try {
      const response = await axios.post<ApiResponse>('/api/accept-feeds', {
        acceptFeeds: !acceptFeeds,
      });
      setValue('acceptFeeds', !acceptFeeds);
      toast({
        title: response.data.message,
        variant: 'default',
      });
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast({
        title: 'Error',
        description:
          axiosError.response?.data.message ??
          'Failed to update feed settings',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteProfilePhoto = async () => {
    try {
      await axios.post('/api/delete-profile-photo', {
        username: session?.user?.username,
        publicId: profilePhotoPublicId,
      });
      setProfilePhoto('');
      toast({
        title: 'Success',
        description: 'Profile photo deleted successfully!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete profile photo',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCoverPhoto = async () => {
    try {
      await axios.post('/api/delete-cover-photo', {
        username: session?.user?.username,
        publicId: coverPhotoPublicId,
      });
      setCoverPhoto('');
      toast({
        title: 'Success',
        description: 'Cover photo deleted successfully!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete cover photo',
        variant: 'destructive',
      });
    }
  };

  if (!session || !session.user) {
    return <div></div>;
  }

  const { username } = session.user as User;

  const baseUrl = `${window.location.protocol}//${window.location.host}`;
  const profileUrl = `${baseUrl}/u/${username}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(profileUrl);
    toast({
      title: 'URL Copied!',
      description: 'Profile URL has been copied to clipboard.',
    });
  };

  const handleUploadProfilePhotoSuccess = async (result: any) => {
    try {
      const publicId = result.info.public_id;
      await axios.post('/api/update-profile-photo', {
        username,
        profilePhoto: result.info.secure_url,
      });
      setProfilePhoto(result.info.secure_url);
      setProfilePhotoPublicId(publicId);
      toast({
        title: 'Success',
        description: 'Profile photo updated successfully!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile photo',
        variant: 'destructive',
      });
    }
  };

  const handleUploadCoverPhotoSuccess = async (result: any) => {
    try {
      const publicId = result.info.public_id;
      await axios.post('/api/update-cover-photo', {
        username,
        coverPhoto: result.info.secure_url,
      });
      setCoverPhoto(result.info.secure_url);
      setCoverPhotoPublicId(publicId);
      toast({
        title: 'Success',
        description: 'Cover photo updated successfully!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update cover photo',
        variant: 'destructive',
      });
    }
  };

  const handleCoverPhotoClick = (open: any) => (event: React.MouseEvent<HTMLDivElement>) => {
    open();
  };

  const handleProfilePhotoClick = (open: any) => (event: React.MouseEvent<HTMLDivElement>) => {
    open();
  };

  return (
    <div className="my-8 mx-4 md:mx-8 lg:mx-auto p-6 bg-white rounded w-full max-w-6xl">
      <div className="relative">
        {coverPhoto ? (
          <div className="relative h-48 w-full mb-4 rounded overflow-hidden">
            <img src={coverPhoto} alt="Cover Photo" className="object-cover w-full h-full" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-50 text-white space-x-4">
              <button className="bg-red-500 p-2 rounded-full" onClick={handleDeleteCoverPhoto}>
                <Trash2 className="w-6 h-6" />
              </button>
              <a href={coverPhoto} target="_blank" rel="noopener noreferrer" className="bg-blue-500 p-2 rounded-full">
                <Eye className="w-6 h-6" />
              </a>
            </div>
          </div>
        ) : (
          <CldUploadWidget
            signatureEndpoint="/api/sign-image"
            uploadPreset="anonfeed"
            onSuccess={handleUploadCoverPhotoSuccess}
          >
            {({ open }) => (
              <div className="relative h-48 w-full mb-4 bg-gray-200 rounded overflow-hidden">
                <div className="flex items-center justify-center h-full w-full cursor-pointer hover:bg-gray-300 transition-colors" onClick={handleCoverPhotoClick(open)}>
                  <UploadCloud className="w-10 h-10 text-gray-500" />
                  <span className="ml-2 text-gray-500">Upload Cover Photo</span>
                </div>
              </div>
            )}
          </CldUploadWidget>
        )}

        <div className="absolute left-4 bottom-[-40px] transform translate-y-1/2">
          {profilePhoto ? (
            <div className="relative w-52 h-52 rounded-full overflow-hidden border-4 border-white">
              <img src={profilePhoto} alt="Profile Photo" className="object-cover w-full h-full" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-50 text-white space-x-4 rounded-full">
                <button className="bg-red-500 p-2 rounded-full" onClick={handleDeleteProfilePhoto}>
                  <Trash2 className="w-6 h-6" />
                </button>
                <a href={profilePhoto} target="_blank" rel="noopener noreferrer" className="bg-blue-500 p-2 rounded-full">
                  <Eye className="w-6 h-6" />
                </a>
              </div>
            </div>
          ) : (
            <CldUploadWidget
              signatureEndpoint="/api/sign-image"
              uploadPreset="anonfeed"
              onSuccess={handleUploadProfilePhotoSuccess}
            >
              {({ open }) => (
                <div className="relative w-52 h-52 rounded-full bg-gray-200 overflow-hidden border-4 border-white">
                  <div className="flex items-center justify-center h-full w-full cursor-pointer hover:bg-gray-300 transition-colors" onClick={handleProfilePhotoClick(open)}>
                    <UploadCloud className="w-10 h-10 text-gray-500" />
                    <span className="ml-2 text-gray-500">Upload Profile Photo</span>
                  </div>
                </div>
              )}
            </CldUploadWidget>
          )}
        </div>
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
        <h2 className="text-lg font-semibold mb-2">Copy Your Unique Link</h2>
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

      <div className="mt-4">
        <Switch
          {...register('acceptFeeds')}
          checked={acceptFeeds}
          onCheckedChange={handleSwitchChange}
          disabled={isSwitchLoading}
        />
        <span className="ml-2">
          Accept Feeds: {acceptFeeds ? 'On' : 'Off'}
        </span>
      </div>
      <Separator className="my-4" />

      <Button
        className="mt-4"
        variant="outline"
        onClick={(e) => {
          e.preventDefault();
          fetchFeeds(true);
        }}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCcw className="h-4 w-4" />
        )}
      </Button>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        {feeds.length > 0 ? (
          feeds.map((feed) => (
            <FeedCard
              key={feed._id.toString()}
              feed={feed}
              onFeedDelete={handleDeleteFeed}
            />
          ))
        ) : (
          <p>No feeds to display.</p>
        )}
      </div>
    </div>
  );
}

export default UserDashboard;
