import { Storage } from "@google-cloud/storage";

// Initialize Google Cloud Storage
// Uses explicit credentials if available, otherwise falls back to implicit auth (ADC)
const storageOptions: any = {};
if (process.env.GCS_PROJECT_ID) {
  storageOptions.projectId = process.env.GCS_PROJECT_ID;
}
if (process.env.GCS_CLIENT_EMAIL && process.env.GCS_PRIVATE_KEY) {
  storageOptions.credentials = {
    client_email: process.env.GCS_CLIENT_EMAIL,
    // Replace escaped newlines with actual newlines if necessary
    private_key: process.env.GCS_PRIVATE_KEY.replace(/\\n/g, "\n"),
  };
}

const storage = new Storage(storageOptions);
const BUCKET_NAME = process.env.GCS_BUCKET_NAME;

/**
 * Uploads a file buffer to Google Cloud Storage and returns a signed download URL.
 * 
 * @param buffer - The file content as a Buffer.
 * @param originalFileName - The original name of the file.
 * @param contentType - The MIME type of the file.
 * @returns The signed URL for downloading the file.
 */
export async function uploadFileToGCS(
  buffer: Buffer,
  originalFileName: string,
  contentType: string
): Promise<{ url: string; fileName: string } | null> {
  if (!BUCKET_NAME) {
    console.warn("GCS_BUCKET_NAME is not defined. Skipping upload.");
    return null;
  }

  // Sanitize bucket name
  const cleanBucketName = BUCKET_NAME;
  console.log(`Starting GCS upload to bucket: ${cleanBucketName}`);

  const bucket = storage.bucket(cleanBucketName);
  const fileName = `${Date.now()}-${originalFileName}`;
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_"); // Sanitize filename
  const blob = bucket.file(cleanFileName);

  console.log(`Uploading file: ${cleanFileName}`);
  
  await blob.save(buffer, {
    contentType: contentType,
    resumable: false,
  });
  console.log("File saved to GCS.");

  console.log("Generating signed URL...");
  const [url] = await blob.getSignedUrl({
    action: "read",
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  });
  console.log("Signed URL generated.");

  return { url, fileName: cleanFileName };
}

export async function getDownloadUrl(fileName: string): Promise<string | null> {
  if (!BUCKET_NAME) {
    console.warn("GCS_BUCKET_NAME is not defined.");
    return null;
  }
  const bucket = storage.bucket(BUCKET_NAME);
  const blob = bucket.file(fileName);
  
  // Check if file exists
  const [exists] = await blob.exists();
  if (!exists) {
    return null;
  }

  const [url] = await blob.getSignedUrl({
    action: "read",
    expires: Date.now() + 1000 * 60 * 60 * 24, // 24 hours
  });
  return url;
}
