
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import { Task } from '@/app/models/Task';
import { User } from '@/app/models/User';
import { ensureUserSynced } from '@/app/lib/syncUser';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await ensureUserSynced();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await req.json();
    const { id } = await params;

    const task = await Task.findOne({ _id: id, user: user._id });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true } // Return the updated document
    ).populate('sourceMeeting', 'title');

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
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

    await connectToDatabase();

    const { id } = await params;

    const task = await Task.findOne({ _id: id, user: user._id });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    await Task.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
