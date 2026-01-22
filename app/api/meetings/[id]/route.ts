
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import { Meeting } from '@/app/models/Meeting';
import { User } from '@/app/models/User';
import { ensureUserSynced } from '@/app/lib/syncUser';
import mongoose from 'mongoose';
import '@/app/models/File';
import '@/app/models/Task';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // Correct type for Next.js App Router dynamic routes
) {
  try {
    const user = await ensureUserSynced();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ error: 'Invalid meeting ID' }, { status: 400 });
    }

    await connectToDatabase();

    const meeting = await Meeting.findOne({ _id: id, user: user._id })
      .populate('tasks')
      .populate('videoFile')
      .populate('transcriptFile');

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    return NextResponse.json(meeting);
  } catch (error) {
    console.error('Error fetching meeting:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await ensureUserSynced();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid meeting ID' }, { status: 400 });
    }

    await connectToDatabase();

    const body = await req.json();

    const updatedMeeting = await Meeting.findOneAndUpdate(
      { _id: id, user: user._id },
      { $set: body },
      { new: true, runValidators: true }
    )
    .populate('tasks')
    .populate('videoFile')
    .populate('transcriptFile');

    if (!updatedMeeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    return NextResponse.json(updatedMeeting);
  } catch (error) {
    console.error('Error updating meeting:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
     const user = await ensureUserSynced();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid meeting ID' }, { status: 400 });
    }

    await connectToDatabase();

    const deletedMeeting = await Meeting.findOneAndDelete({
      _id: id,
      user: user._id,
    });

    if (!deletedMeeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
