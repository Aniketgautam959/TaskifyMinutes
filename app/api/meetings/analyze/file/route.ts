import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db';
import { Meeting } from '@/app/models/Meeting';
import { Task } from '@/app/models/Task';
import { User } from '@/app/models/User';
import { FileModel } from '@/app/models/File';
import { auth } from '@clerk/nextjs/server';
import { processMeetingTranscript } from '@/app/services/logic/analyse_transcript';
import { resolveMediaMime, summarizeMeetingMedia } from '@/app/services/logic/summarize_media';
import { saveRecording } from '@/app/services/logic/recording_store';
import { Types } from 'mongoose';

function formatDuration(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '0m';
  const minutes = Math.max(1, Math.round(totalSeconds / 60));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

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
    const mediaMime = file && file.size > 0 ? resolveMediaMime(file.name, file.type) : null;
    
    if (file && file.size > 0 && !mediaMime) {
      transcriptText = await file.text();

      // Only upload if no ID was provided, as we want to save this new file
      if (!transcriptFileId) {
        try {
          console.log("========== Saving transcript file==========");
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const uploadResult = await saveRecording(buffer, file.name, file.type || 'text/plain', String(user._id));

          if (uploadResult) {
            console.log("========== File saved==========");
            const newFile = new FileModel({
              gcsobjectkey: uploadResult.fileName,
              storageId: uploadResult.storageId,
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
    const durationSeconds = Number(formData.get('duration'));

    const screenshotIds = formData.getAll('screenshotIds').map((value) => String(value));
    const screenshotSeconds = formData.getAll('screenshotSeconds').map((value) => Number(value));
    const screenshots = screenshotIds.flatMap((id, index) => {
      if (!Types.ObjectId.isValid(id)) return [];
      const seconds = screenshotSeconds[index];
      return [{ file: new Types.ObjectId(id), seconds: Number.isFinite(seconds) ? seconds : 0 }];
    });

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

    let analysisResult;
    if (mediaMime && file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const mediaResult = await summarizeMeetingMedia(buffer, mediaMime, file.name);
      analysisResult = {
        title: mediaResult.title,
        summary: mediaResult.summary,
        transcript: mediaResult.transcript,
        mom: mediaResult.mom,
        tags: mediaResult.tags,
        category: mediaResult.category,
        tasks: mediaResult.detailedTasks,
        confidence_level: mediaResult.confidence_level,
      };
    } else if (!transcriptText) {
      return NextResponse.json({ error: 'Transcript content is missing' }, { status: 400 });
    } else {
      analysisResult = await processMeetingTranscript(transcriptText);
    }
    console.log("========== Analysis result==========");

    // 2. Create Meeting
    console.log("=======transcript file id =============", transcriptFileId)
    console.log("type of file id", typeof transcriptFileId)
    const newMeeting = new Meeting({
      title: requestTitle || analysisResult.title,
      summary: analysisResult.summary,
      date: requestDate ? requestDate : new Date(),
      duration: formatDuration(durationSeconds),
      transcript: analysisResult.transcript,
      mom: analysisResult.mom,
      currentStatus: 'Completed',
      tags: analysisResult.tags,
      category: requestCategory || analysisResult.category,
      confidenceLevel: analysisResult.confidence_level,
      transcriptFile: !mediaMime && transcriptFileId && Types.ObjectId.isValid(transcriptFileId)
        ? new Types.ObjectId(transcriptFileId)
        : undefined,
      videoFile: mediaMime && transcriptFileId && Types.ObjectId.isValid(transcriptFileId)
        ? new Types.ObjectId(transcriptFileId)
        : undefined,
      user: user._id,
      tasks: [],
      screenshots,
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
