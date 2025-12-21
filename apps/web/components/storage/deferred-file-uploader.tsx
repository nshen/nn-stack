'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orpc } from '@/lib/orpc';
import { Button } from '@nn-stack/ui/components/button';
import { Progress } from '@nn-stack/ui/components/progress';
import { Card, CardContent } from '@nn-stack/ui/components/card';
import { Alert, AlertTitle, AlertDescription } from '@nn-stack/ui/components/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@nn-stack/ui/components/alert-dialog';
import { toast } from '@nn-stack/ui/components/sonner';
import { X, Upload, FileIcon, Trash2, Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { cn } from '@nn-stack/ui/lib/utils';
import Image from 'next/image';
import { uploadFile } from '@/lib/upload';

type FileStatus = 'idle' | 'uploading' | 'success' | 'error';

interface FileWithPreview {
  file: File;
  id: string;
  preview: string;
  status: FileStatus;
  progress: number;
}

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

export function DeferredFileUploader() {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch existing files
  const { data: remoteFiles, isLoading: isLoadingRemote, error: fetchError } = useQuery(
    orpc.storage.list.queryOptions({
      retry: false,
    }),
  );

  // Mutations
  const presignMutation = useMutation(orpc.storage.presign.mutationOptions());
  const deleteMutation = useMutation(orpc.storage.delete.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.storage.list.key() });
      toast.success('File deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete file: ${error.message}`);
    }
  }));

  const handleDownload = (url: string | null) => {
    if (url) {
      window.open(url, '_blank');
    } else {
      toast.error('File URL is not available.');
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      id: crypto.randomUUID(),
      preview: URL.createObjectURL(file),
      status: 'idle' as FileStatus,
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected: (fileRejections) => {
      for (const rejection of fileRejections) {
        const isTooLarge = rejection.errors.some((e) => e.code === 'file-too-large');
        if (isTooLarge) {
          toast.error(`File ${rejection.file.name} is too large. Max size is 1MB.`);
        } else {
          toast.error(`File ${rejection.file.name} was rejected: ${rejection.errors[0]?.message}`);
        }
      }
    },
    accept: {
      'image/*': [],
      'application/pdf': [],
    },
    maxSize: MAX_FILE_SIZE,
    disabled: !!fetchError, // Disable dropzone on error
  });

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleDeleteRemote = (key: string) => {
    setFileToDelete(key);
  };

  const confirmDelete = async () => {
    if (fileToDelete) {
      await deleteMutation.mutateAsync({ key: fileToDelete });
      setFileToDelete(null);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);

    try {
      // 1. Get presigned URLs for all idle files
      const filesToUpload = files.filter((f) => f.status === 'idle' || f.status === 'error');
      if (filesToUpload.length === 0) return;

      const presignResult = await presignMutation.mutateAsync(
        filesToUpload.map((f) => ({
          filename: f.file.name,
          contentType: f.file.type,
        }))
      );

      // 2. Upload each file
      await Promise.all(
        filesToUpload.map(async (fileItem, index) => {
          const presigned = presignResult[index];
          if (!presigned) return;

          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileItem.id ? { ...f, status: 'uploading' } : f
            )
          );

          try {
            await uploadFile(presigned.url, fileItem.file, (progress) => {
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === fileItem.id ? { ...f, progress } : f
                )
              );
            });

            setFiles((prev) => {
              const file = prev.find((f) => f.id === fileItem.id);
              if (file) {
                URL.revokeObjectURL(file.preview);
              }
              return prev.filter((f) => f.id !== fileItem.id);
            });
          } catch (error) {
            console.error('Upload failed for', fileItem.file.name, error);
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileItem.id ? { ...f, status: 'error' } : f
              )
            );
          }
        })
      );

      // Refresh remote list
      queryClient.invalidateQueries({ queryKey: orpc.storage.list.key() });
    } catch (error) {
      console.error('Batch upload failed', error);
      // Optional: Show error to user
    } finally {
      setIsUploading(false);
    }
  };

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      files.forEach((file) => {
        URL.revokeObjectURL(file.preview);
      });
    };
  }, [files]);

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-4">
      {fetchError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {fetchError.message || 'Failed to connect to storage service.'}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Upload Files</h2>
        
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors",
            isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
            fetchError && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Drag & drop files here, or click to select</p>
          <p className="text-sm text-muted-foreground mt-1">
            Support for images and PDF (max 1MB). Files are queued before uploading.
          </p>
        </div>

        {/* Queue List */}
        {files.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Queue ({files.length})</h3>
              <Button onClick={handleUpload} disabled={isUploading || files.every(f => f.status === 'success')}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Start Upload'
                )}
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {files.map((file) => (
                <Card key={file.id} className="relative overflow-hidden">
                  <CardContent className="p-4 flex gap-4 items-center">
                    <div className="relative h-16 w-16 shrink-0 rounded-md overflow-hidden bg-muted">
                      {file.file.type.startsWith('image/') ? (
                        <Image
                          src={file.preview}
                          alt={file.file.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <FileIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate text-sm" title={file.file.name}>
                            {file.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(file.file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeFile(file.id)}
                          disabled={file.status === 'uploading' || file.status === 'success'}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {file.status !== 'idle' && (
                        <div className="space-y-1">
                          <Progress value={file.progress} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{file.status === 'uploading' ? 'Uploading...' : file.status}</span>
                            <span>{file.progress}%</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {file.status === 'success' && (
                      <div className="absolute top-2 right-2 bg-background/80 rounded-full p-1 text-green-500">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t pt-8">
        <h2 className="text-2xl font-bold tracking-tight mb-4">Uploaded Files (R2)</h2>
        {isLoadingRemote ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : remoteFiles && remoteFiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {remoteFiles.map((file) => (
              <Card key={file.key}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      className="min-w-0 cursor-pointer group text-left flex-1" 
                      onClick={() => handleDownload(file.url)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="font-medium text-sm truncate group-hover:text-primary group-hover:underline flex-1 min-w-0" title={file.key}>
                          {file.key}
                        </p>
                        <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB • {new Date(file.uploadedAt).toLocaleDateString()}
                      </p>
                    </button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => handleDeleteRemote(file.key)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No files uploaded yet.</p>
                )}
              </div>
        
              <AlertDialog open={!!fileToDelete} onOpenChange={(open) => !open && setFileToDelete(null)}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the file
                      <span className="font-medium text-foreground mx-1">{fileToDelete}</span>
                      from the storage.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={confirmDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        }
        