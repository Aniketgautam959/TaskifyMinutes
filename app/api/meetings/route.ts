
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import { Meeting } from '@/app/models/Meeting';
import '@/app/models/Task'; // Ensure Task model is registered for population
import { User } from '@/app/models/User';
import { ensureUserSynced } from '@/app/lib/syncUser';

export async function GET() {
  try {


    await connectToDatabase();

    const user = await ensureUserSynced();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const meetings = await Meeting.find({ user: user._id })
      .sort({ date: -1 })
      .populate('tasks'); // Optional: populate tasks if needed here

    return NextResponse.json(meetings);
  } catch (error) {
    console.error('Error fetching meetings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    const user = await ensureUserSynced();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      date,
      duration,
      summary,
      transcript,
      mom,
      videoUrl,
      transcriptUrl,
      confidenceLevel,
      tags,
      category,
    } = body;

    // Basic validation
    if (!title || !date) {
      return NextResponse.json(
        { error: 'Title and Date are required' },
        { status: 400 }
      );
    }

    const newMeeting = await Meeting.create({
      title,
      date: new Date(date),
      duration,
      summary,
      transcript,
      mom,
      videoUrl,
      transcriptUrl,
      confidenceLevel,
      tags,
      category,
      user: user._id,
    });

    return NextResponse.json(newMeeting, { status: 201 });
  } catch (error) {
    console.error('Error creating meeting:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
