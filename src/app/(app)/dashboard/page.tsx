// src/app/(app)/dashboard/page.tsx
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
import { Loader2, RefreshCcw, Trash2 } from 'lucide-react';
import { User } from 'next-auth';
import { useSession } from 'next-auth/react';
import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { acceptFeedSchema } from '@/schemas/acceptFeedSchema';
import { CldUploadWidget } from 'next-cloudinary';

function UserDashboard() {
  const [feeds, setFeeds] = useState<IFeed[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitchLoading, setIsSwitchLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState('');
  const [profilePhotoPublicId, setProfilePhotoPublicId] = useState('');

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
        setFeeds(response.data.feeds || []);
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

  const fetchProfilePhoto = useCallback(async () => {
    try {
      const response = await axios.post('/api/get-profile-photo', {
        username: session?.user?.username,
      });
      if (response.data.success) {
        setProfilePhoto(response.data.profilePhoto);
        const urlParts = response.data.profilePhoto.split('/');
        const publicId = urlParts[urlParts.length - 1].split('.')[0];
        setProfilePhotoPublicId(publicId);
      }
    } catch (error) {
      console.error('Error fetching profile photo:', error);
    }
  }, [session]);

  // Fetch initial state from the server
  useEffect(() => {
    if (!session || !session.user) return;

    fetchFeeds();
    fetchAcceptFeeds();
    fetchProfilePhoto();
  }, [session, setValue, toast, fetchAcceptFeeds, fetchFeeds, fetchProfilePhoto]);

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

  const handleUploadSuccess = async (result: any) => {
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

  return (
    <div className="my-8 mx-4 md:mx-8 lg:mx-auto p-6 bg-white rounded w-full max-w-6xl">
      <h1 className="text-4xl font-bold mb-4">User Dashboard</h1>

      <div className="mb-4">
        {profilePhoto ? (
          <div className="relative">
            <img src={profilePhoto} alt="Profile Photo" className="w-32 h-32 rounded-full object-cover mb-4" />
            <Button
              onClick={handleDeleteProfilePhoto}
              className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="w-32 h-32 bg-gray-200 rounded-full mb-4"></div>
        )}
        <CldUploadWidget
          signatureEndpoint="/api/sign-image"
          uploadPreset="anonfeed"
          onSuccess={handleUploadSuccess}
        >
          {({ open }) => {
            return (
              <button
                onClick={() => open()}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Upload Profile Photo
              </button>
            );
          }}
        </CldUploadWidget>
      </div>

      <div className="mb-4">
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

      <div className="mb-4">
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
      <Separator />

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
