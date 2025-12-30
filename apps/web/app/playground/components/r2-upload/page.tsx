'use client';

import { DeferredFileUploader } from '@/components/storage/deferred-file-uploader';
import { SourceCodeButton } from '@/components/source-code-button';

export default function R2UploadPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">R2 Storage Demo</h1>
          <p className="text-muted-foreground mt-2">
            Direct S3-compatible file uploads with progress tracking.
          </p>
        </div>
        <SourceCodeButton path="apps/web/components/storage/deferred-file-uploader.tsx" />
      </div>
      <DeferredFileUploader />
    </div>
  );
}
