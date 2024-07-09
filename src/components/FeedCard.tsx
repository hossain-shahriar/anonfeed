'use client'

import React from 'react';
import axios, { AxiosError } from 'axios';
import dayjs from 'dayjs';
import { X } from 'lucide-react';
import { IFeed } from '@/model/Feed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ApiResponse } from '@/types/ApiResponse';

type FeedCardProps = {
  feed: IFeed;
  onFeedDelete: (feedId: string) => void;
};

const FeedCard = ({ feed, onFeedDelete }: FeedCardProps) => {
  const { toast } = useToast();

  const handleDeleteConfirm = async () => {
    try {
      const response = await axios.delete<ApiResponse>(
        `/api/delete-feed/${feed._id.toString()}`
      );
      toast({
        title: response.data.message,
      });
      onFeedDelete(feed._id.toString());
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast({
        title: 'Error',
        description:
          axiosError.response?.data.message ?? 'Failed to delete feed',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="card-bordered">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{feed.title}</CardTitle>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant='destructive'>
                <X className="w-5 h-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  this feed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <div className="text-sm">
          {dayjs(feed.createdAt).format('MMM D, YYYY h:mm A')}
        </div>
      </CardHeader>
      <CardContent>
        <p>{feed.description}</p>
      </CardContent>
    </Card>
  );
}

export default FeedCard;
