'use client'

import React, { useState } from 'react';
import axios, { AxiosError } from 'axios';
import dayjs from 'dayjs';
import { X } from 'lucide-react';
import { IFeed } from '@/model/Feed';
import { IComment } from '@/model/Comment';
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
import { Input } from '@/components/ui/input';
import { ApiResponse } from '@/types/ApiResponse';
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
  isProfileView?: boolean; // New prop to indicate profile view
};

const FeedCard = ({ feed, onFeedDelete, onCommentDelete, isProfileView = false }: FeedCardProps) => {
  const { toast } = useToast();
  const [commentText, setCommentText] = useState('');

  const handleDeleteConfirm = async () => {
    try {
      const response = await axios.delete<ApiResponse>(
        `/api/delete-feed/${feed._id.toString()}`
      );
      toast({
        title: response.data.message,
      });
      if (onFeedDelete) {
        onFeedDelete(feed._id.toString());
      }
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

  const handleDeleteCommentConfirm = async (commentId: string) => {
    console.log(`Deleting comment with ID: ${commentId}`);
    try {
      const response = await axios.delete<ApiResponse>(
        `/api/delete-comment/${commentId}`
      );
      toast({
        title: response.data.message,
      });
      if (onCommentDelete) {
        onCommentDelete(commentId);
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast({
        title: 'Error',
        description:
          axiosError.response?.data.message ?? 'Failed to delete comment',
        variant: 'destructive',
      });
    }
  };

  const handleAddComment = async () => {
    try {
      const response = await axios.post<ApiResponse>('/api/add-comment', {
        feedId: feed._id.toString(),
        comment: commentText,
      });
      toast({
        title: response.data.message,
      });
      setCommentText(''); // Clear the input box after adding the comment
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast({
        title: 'Error',
        description:
          axiosError.response?.data.message ?? 'Failed to add comment',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="card-bordered">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{feed.title}</CardTitle>
          {onFeedDelete && (
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
          )}
        </div>
        <div className="text-sm">
          {dayjs(feed.createdAt).format('MMM D, YYYY h:mm A')}
        </div>
      </CardHeader>
      <CardContent>
        <p>{feed.description}</p>
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Comments</h3>
          <div className="max-h-64 overflow-y-auto">
            {feed.comments.map((comment: PopulatedComment) => (
              <div key={(comment._id as mongoose.Types.ObjectId).toString()} className="mt-2 p-2 bg-gray-100 rounded">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <img
                      src={comment.user.profilePhoto || '/default-profile.png'}
                      alt={comment.user.username}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="font-semibold">{comment.user.username}</span>
                    <span className="text-sm text-gray-600">{dayjs(comment.createdAt).format('MMM D, YYYY h:mm A')}</span>
                  </div>
                  {!isProfileView && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant='destructive' size='sm'>
                          <X className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete
                            this comment.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteCommentConfirm((comment._id as mongoose.Types.ObjectId).toString())}>
                            Continue
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
                <p className="mt-2">{comment.comment}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center space-x-2">
            <Input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-grow"
            />
            <Button onClick={handleAddComment}>Comment</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default FeedCard;
