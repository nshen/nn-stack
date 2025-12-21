'use client';

import { DeferredFileUploader } from '@/components/storage/deferred-file-uploader';

export default function R2UploadPage() {
  return (
    <div className="container py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Cloudflare R2 Storage</h1>
        <p className="text-muted-foreground">
          Demonstration of Deferred Uploads with Presigned URLs. 
          Files are queued locally and uploaded directly to R2 in a batch.
        </p>
      </div>
      <DeferredFileUploader />
    </div>
  );
}
