'use client';

import { DeferredFileUploader } from '@/components/storage/deferred-file-uploader';

export default function R2UploadPage() {
  return (
    <div className="space-y-6">
      <DeferredFileUploader />
    </div>
  );
}
