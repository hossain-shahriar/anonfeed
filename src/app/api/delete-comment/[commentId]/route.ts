// src/app/api/delete-comment/[commentId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CommentModel from '@/model/Comment';
import FeedModel from '@/model/Feed';
import UserModel from '@/model/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const commentId = params.commentId;
    const userId = session.user._id;

    const comment = await CommentModel.findById(commentId);
    if (!comment) {
      return NextResponse.json({ success: false, message: "Comment not found" }, { status: 404 });
    }

    const feed = await FeedModel.findById(comment.feed);
    if (!feed) {
      return NextResponse.json({ success: false, message: "Feed not found" }, { status: 404 });
    }

    await CommentModel.findByIdAndDelete(commentId);
    await FeedModel.findByIdAndUpdate(comment.feed, { $pull: { comments: commentId } });
    await UserModel.findByIdAndUpdate(comment.user, { $pull: { comments: commentId } });

    return NextResponse.json({ success: true, message: "Comment deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return NextResponse.json({ message: 'Internal server error', success: false }, { status: 500 });
  }
}
