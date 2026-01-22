import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import { Meeting } from '@/app/models/Meeting';
import { Task } from '@/app/models/Task';
import { User } from '@/app/models/User';
import { FileModel } from '@/app/models/File';
import { auth } from '@clerk/nextjs/server';
import { processMeetingTranscript } from '@/app/services/logic/analyse_transcript';
import { getDownloadUrl, uploadFileToGCS } from '@/app/services/logic/gcs_upload';
import { Types } from 'mongoose';

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

    const formData = await req.formData();
    
    let transcriptText = '';
    let transcriptFileId: string | null = null;
    let requestTitle = '';
    let requestDate: Date | null = null;
    let requestCategory = '';

    // Fix 1: Ensure we don't treat empty strings as valid IDs
    const providedFileId = formData.get('fileId') as string;
    if (providedFileId && providedFileId.trim() !== '') {
      transcriptFileId = providedFileId;
    }

    const file = formData.get('file') as File | null;
    
    if (file && file.size > 0) {
      transcriptText = await file.text();

      // Only upload if no ID was provided, as we want to save this new file
      if (!transcriptFileId) {
        try {
          console.log("========== Uploading file to GCS==========");
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const uploadResult = await uploadFileToGCS(buffer, file.name, file.type || 'text/plain');

          if (uploadResult) {
            console.log("========== File uploaded to GCS==========");
            const newFile = new FileModel({
              gcsobjectkey: uploadResult.fileName,
              filesize: file.size,
              user: user._id,
              filetype: 'text',
            });
            const savedFile = await newFile.save();
            transcriptFileId = savedFile._id.toString();
            console.log("========== File saved to DB==========");
          }
        } catch (err) {
          console.error("Error uploading raw transcript file:", err);
        }
      }
    }
    
    requestTitle = (formData.get('title') as string) || '';
    const dateStr = formData.get('date') as string;
    if (dateStr) requestDate = new Date(dateStr);
    requestCategory = (formData.get('category') as string) || '';

    // // If fileId was provided but no text yet, fetch content from GCS
    // if (transcriptFileId && !transcriptText) {
    //   const fileDoc = await FileModel.findById(transcriptFileId);
    //   if (fileDoc) {
    //     const downloadUrl = await getDownloadUrl(fileDoc.gcsobjectkey);
    //     if (downloadUrl) {
    //       const response = await fetch(downloadUrl);
    //       if (response.ok) {
    //         transcriptText = await response.text();
    //       }
    //     }
    //   }
    // }

    if (!transcriptText) {
      return NextResponse.json({ error: 'Transcript content is missing' }, { status: 400 });
    }

    // 1. Process transcript with AI
    const analysisResult = await processMeetingTranscript(transcriptText);
    console.log("========== Analysis result==========");

    // 2. Create Meeting
    console.log("=======transcript file id =============", transcriptFileId)
    console.log("type of file id", typeof transcriptFileId)
    const newMeeting = new Meeting({
      title: requestTitle || analysisResult.title,
      summary: analysisResult.summary,
      date: requestDate ? requestDate : new Date(),
      duration: '0m',
      transcript: analysisResult.transcript,
      mom: analysisResult.mom,
      currentStatus: 'Completed',
      tags: analysisResult.tags,
      category: requestCategory || analysisResult.category,
      confidenceLevel: analysisResult.confidence_level,
      // Fix 2: Explicitly cast to ObjectId and verify string is not empty
      transcriptFile: (transcriptFileId && Types.ObjectId.isValid(transcriptFileId)) 
        ? new Types.ObjectId(transcriptFileId) 
        : undefined,
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
    console.error('Error in File Analysis API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
