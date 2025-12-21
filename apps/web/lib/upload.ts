/**
 * Uploads a file to a given URL using XMLHttpRequest to support progress tracking.
 *
 * @param url The destination URL (e.g., a presigned S3 URL).
 * @param file The File object to upload.
 * @param onProgress Callback function that receives the upload progress (0-100).
 * @returns A Promise that resolves when the upload is complete, or rejects on error.
 *
 * @example
 * ```typescript
 * import { uploadFile } from '@/lib/upload';
 *
 * try {
 *   await uploadFile(presignedUrl, myFile, (progress) => {
 *     console.log(`Upload progress: ${progress}%`);
 *     setProgress(progress);
 *   });
 *   console.log('Upload complete!');
 * } catch (error) {
 *   console.error('Upload failed:', error);
 * }
 * ```
 */
export const uploadFile = (url: string, file: File, onProgress?: (progress: number) => void): Promise<void> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percentCompleted = Math.round((event.loaded * 100) / event.total);
        onProgress(percentCompleted);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Upload failed due to network error'));
    xhr.send(file);
  });
};
