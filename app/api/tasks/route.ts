
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import { Task } from '@/app/models/Task';
import { User } from '@/app/models/User';
import { ensureUserSynced } from '@/app/lib/syncUser';
import '@/app/models/Meeting';

export async function GET() {
  try {
    const user = await ensureUserSynced();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const tasks = await Task.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate('sourceMeeting', 'title'); // Populate meeting title for context if needed

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await ensureUserSynced();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await req.json();
    const { title, description, priority, status, tags, sourceMeeting, suggested } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const newTask = await Task.create({
      title,
      description,
      priority,
      status,
      tags,
      sourceMeeting,
      suggested,
      user: user._id,
    });

    const populatedTask = await newTask.populate('sourceMeeting', 'title');

    return NextResponse.json(populatedTask, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
