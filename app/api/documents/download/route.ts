import { NextRequest, NextResponse } from "next/server";
import { getDownloadUrl } from "@/app/services/logic/gcs_upload";
import { connectToDatabase } from "@/app/lib/db";
import { FileModel } from "@/app/models/File";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    // Find the file document
    const fileDoc = await FileModel.findById(fileId);

    if (!fileDoc) {
      return NextResponse.json(
        { error: "File record not found" },
        { status: 404 }
      );
    }

    const downloadUrl = await getDownloadUrl(fileDoc.gcsobjectkey);

    if (!downloadUrl) {
      return NextResponse.json(
        { error: "GCS File not found or could not generate download URL" },
        { status: 404 }
      );
    }

    // Return the URL so the client can initiate the download
    return NextResponse.json({ url: downloadUrl }, { status: 200 });
  } catch (error) {
    console.error("Download API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

