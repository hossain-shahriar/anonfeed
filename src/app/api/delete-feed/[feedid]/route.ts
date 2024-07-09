import UserModel from '@/model/User';
import FeedModel from '@/model/Feed';
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
    // Remove the feed document from the Feed collection
    const feed = await FeedModel.findByIdAndDelete(feedId);

    if (!feed) {
      return new Response(
        JSON.stringify({ message: 'Feed not found', success: false }),
        { status: 404 }
      );
    }

    // Remove the feed reference from the user's feeds array
    await UserModel.updateOne(
      { _id: _user._id },
      { $pull: { feeds: feedId } }
    );

    return new Response(
      JSON.stringify({ message: 'Feed deleted', success: true }),
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
