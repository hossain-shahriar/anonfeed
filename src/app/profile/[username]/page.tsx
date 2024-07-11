// src/app/profile/[username]/page.tsx
'use client';

import FeedCard from '@/components/FeedCard';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import axios, { AxiosError } from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { IFeed } from '@/model/Feed';
import { ApiResponse } from '@/types/ApiResponse';
import { RefreshCcw, Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';

function UserProfile() {
  const [feeds, setFeeds] = useState<IFeed[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { username } = useParams();

  const fetchFeeds = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get<ApiResponse>(`/api/get-feeds/${username}`);
      setFeeds(response.data.feeds || []);
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
    }
  }, [username, toast]);

  // Fetch initial state from the server
  useEffect(() => {
    if (!username) return;

    fetchFeeds();
  }, [username, fetchFeeds]);

  return (
    <div className="my-8 mx-4 md:mx-8 lg:mx-auto p-6 bg-white rounded w-full max-w-6xl">
      <h1 className="text-4xl font-bold mb-4">{username}'s Profile</h1>

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
