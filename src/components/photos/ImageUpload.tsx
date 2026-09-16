"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";

type SelectedFile = {
  id: string;
  file: File;
  preview: string;
};

type ImageUploadProps = {
  onUpload: (files: File[]) => Promise<void>;
  onCancel: () => void;
};

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export function ImageUpload({ onUpload, onCancel }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const list = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
    const mapped = list.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setFiles((prev) => {
      const ids = new Set(prev.map((p) => p.id));
      return [...prev, ...mapped.filter((m) => !ids.has(m.id))];
    });
    setError(null);
    setSuccess(false);
  }, []);

  function removeFile(id: string) {
    setFiles((prev) => {
      const item = prev.find((f) => f.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((f) => f.id !== id);
    });
  }

  async function handleUpload() {
    if (files.length === 0) {
      setError("Select at least one image to upload.");
      return;
    }
    setLoading(true);
    setProgress(10);
    setError(null);
    try {
      setProgress(40);
      await onUpload(files.map((f) => f.file));
      setProgress(100);
      setSuccess(true);
      files.forEach((f) => URL.revokeObjectURL(f.preview));
      setFiles([]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while uploading. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
        className={cn("mjms-upload-zone", dragOver && "mjms-upload-zone-active")}
      >
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#6a5f9a]/8">
          <Upload className="h-5 w-5 text-[#6a5f9a]" />
        </div>
        <p className="text-sm font-medium text-foreground">Drag &amp; drop photos here</p>
        <p className="mjms-meta mt-1">JPEG, PNG, WebP, or GIF · Multiple files supported</p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="h-4 w-4" />
          Choose files
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {files.map((item) => (
            <div key={item.id} className="mjms-photo-card group relative aspect-square overflow-hidden">
              <Image
                src={item.preview}
                alt={item.file.name}
                fill
                className="object-cover"
                unoptimized
              />
              <button
                type="button"
                onClick={() => removeFile(item.id)}
                className="absolute right-1.5 top-1.5 rounded-[6px] bg-black/55 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                aria-label={`Remove ${item.file.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          <div className="mjms-progress-track">
            <div className="mjms-progress-bar" style={{ width: `${progress}%` }} />
          </div>
          <p className="mjms-meta">Uploading photos…</p>
        </div>
      )}

      {error && (
        <p className="mjms-alert mjms-alert-error" role="alert">
          {error}
        </p>
      )}

      {success && (
        <p className="mjms-alert mjms-alert-success" role="status">
          Photos uploaded successfully.
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleUpload}
          loading={loading}
          disabled={files.length === 0}
        >
          Upload {files.length > 0 ? `(${files.length})` : "Photos"}
        </Button>
      </div>
    </div>
  );
}
