// src/app/api/delete-feed/[feedid]/route.ts
import UserModel from '@/model/User';
import FeedModel from '@/model/Feed';
import CommentModel from '@/model/Comment';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/dbConnect';
import { User } from 'next-auth';
import { NextRequest } from 'next/server';
import { authOptions } from '../../auth/[...nextauth]/options';

export async function DELETE(
  request: Request,
  { params }: { params: { feedid: string } }
) {
  const feedId = params.feedid;
  await dbConnect();
  const session = await getServerSession(authOptions);
  const _user: User = session?.user as User;
  if (!session || !_user) {
    return new Response(
      JSON.stringify({ success: false, message: 'Not authenticated' }),
      { status: 401 }
    );
  }

  try {
    // Find and delete the feed document from the Feed collection
    const feed = await FeedModel.findByIdAndDelete(feedId);

    if (!feed) {
      return new Response(
        JSON.stringify({ message: 'Feed not found', success: false }),
        { status: 404 }
      );
    }

    // Remove the feed reference from the user's feeds array
    const updatedResult = await UserModel.updateOne(
      { _id: _user._id, feeds: feedId },
      { $pull: { feeds: feedId } }
    );

    if (updatedResult.modifiedCount === 0) {
      return new Response(
        JSON.stringify({ message: 'Feed not found or already deleted', success: false }),
        { status: 404 }
      );
    }

    // Find and delete all comments related to the feed
    const comments = await CommentModel.find({ feed: feedId });
    const commentIds = comments.map(comment => comment._id);

    await CommentModel.deleteMany({ feed: feedId });

    // Remove the comment references from the user's comments array
    await UserModel.updateMany(
      { comments: { $in: commentIds } },
      { $pull: { comments: { $in: commentIds } } }
    );

    return new Response(
      JSON.stringify({ message: 'Feed and associated comments deleted', success: true }),
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting feed:', error);
    return new Response(
      JSON.stringify({ message: 'Error deleting feed', success: false }),
      { status: 500 }
    );
  }
}
