import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import { Meeting } from '@/app/models/Meeting';
import { Task } from '@/app/models/Task';
import { User } from '@/app/models/User';
import { auth } from '@clerk/nextjs/server';
import { processMeetingTranscript } from '@/app/services/logic/analyse_transcript';

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findOne({ clerkId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { transcript: transcriptText, title: requestTitle, date: requestDate, category: requestCategory } = body;

    if (!transcriptText) {
      return NextResponse.json({ error: 'Transcript content is missing' }, { status: 400 });
    }

    // 1. Process transcript with AI
    const analysisResult = await processMeetingTranscript(transcriptText);

    // 2. Create Meeting
    const newMeeting = new Meeting({
      title: requestTitle || analysisResult.title,
      summary: analysisResult.summary,
      date: requestDate ? new Date(requestDate) : new Date(),
      duration: '0m',
      transcript: analysisResult.transcript,
      mom: analysisResult.mom,
      currentStatus: 'Completed',
      tags: analysisResult.tags,
      category: requestCategory || analysisResult.category,
      confidenceLevel: analysisResult.confidence_level,
      user: user._id,
      tasks: [],
    });

    const savedMeeting = await newMeeting.save();

    // 3. Create Tasks
    const taskPromises = (analysisResult.tasks || []).map(async (taskItem: any) => {
      const newTask = new Task({
        title: taskItem.title,
        description: taskItem.description,
        priority: taskItem.priority || 'Medium',
        tags: taskItem.tags,
        status: 'Backlog',
        sourceMeeting: savedMeeting._id,
        suggested: true,
        user: user._id,
      });
      return newTask.save();
    });

    const savedTasks = await Promise.all(taskPromises);

    // 4. Link Tasks to Meeting
    savedMeeting.tasks = savedTasks.map((t: any) => t._id);
    await savedMeeting.save();

    return NextResponse.json({
      meeting: savedMeeting,
      tasks: savedTasks,
    }, { status: 201 });

  } catch (error) {
    console.error('Error in Text Analysis API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
