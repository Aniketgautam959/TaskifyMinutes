import { NextRequest, NextResponse } from "next/server";
import { uploadFileToGCS } from "@/app/services/logic/gcs_upload";
import { connectToDatabase } from "@/app/lib/db";
import { FileModel } from "@/app/models/File";
import { User } from "@/app/models/User";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    // Use ignore because sometimes User model might not be registered if this is the first endpoint hit, 
    // but in this project it seems User is used elsewhere. 
    // Safest is to import User.
    const user = await User.findOne({ clerkId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const durationInput = formData.get("duration"); // Expect duration from client if available

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check if file size is greater than 500MB
    const MAX_SIZE = 500 * 1024 * 1024;
    
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "you cant ipload more than 500" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await uploadFileToGCS(buffer, file.name, file.type);

    if (!uploadResult) {
      return NextResponse.json(
        { error: "Failed to upload file to storage" },
        { status: 500 }
      );
    }

    // Determine file type
    let filetype: 'text' | 'video' | 'image' | 'audio' = 'text';
    if (file.type.startsWith('video/')) filetype = 'video';
    else if (file.type.startsWith('image/')) filetype = 'image';
    else if (file.type.startsWith('audio/')) filetype = 'audio';
    
    // Create File document
    const fileDoc = new FileModel({
      gcsobjectkey: uploadResult.fileName,
      filesize: file.size,
      user: user._id,
      filetype: filetype,
      duration: durationInput ? Number(durationInput) : undefined,
    });

    await fileDoc.save();

    return NextResponse.json(
      { 
        fileId: fileDoc._id,
        url: uploadResult.url, 
        gcsObjectId: uploadResult.fileName 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Upload API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

