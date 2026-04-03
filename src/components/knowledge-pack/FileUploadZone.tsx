"use client";

import React, { useCallback, useRef, useState } from "react";
import { Upload, X, FileText, Image } from "lucide-react";

const ACCEPTED_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/webp",
];

const ACCEPTED_EXTENSIONS = [".pdf", ".txt", ".md", ".doc", ".docx", ".png", ".jpg", ".jpeg", ".webp"];
const MAX_FILE_MB = 20;

interface FileUploadZoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

export default function FileUploadZone({ files, onFilesChange }: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const validateAndAdd = useCallback(
    (incoming: FileList | File[]) => {
      const validated: File[] = [];
      for (const file of Array.from(incoming)) {
        const ext = "." + file.name.split(".").pop()?.toLowerCase();
        if (!ACCEPTED_TYPES.includes(file.type) && !ACCEPTED_EXTENSIONS.includes(ext)) continue;
        if (file.size > MAX_FILE_MB * 1024 * 1024) continue;
        validated.push(file);
      }
      if (validated.length > 0) {
        onFilesChange([...files, ...validated]);
      }
    },
    [files, onFilesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      validateAndAdd(e.dataTransfer.files);
    },
    [validateAndAdd]
  );

  const removeFile = (idx: number) => {
    onFilesChange(files.filter((_, i) => i !== idx));
  };

  const isImage = (f: File) => f.type.startsWith("image/");

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center justify-center gap-2 py-8 px-4 rounded-xl cursor-pointer transition-colors"
        style={{
          backgroundColor: dragOver ? "var(--bg-2)" : "var(--bg-1)",
          border: `2px dashed ${dragOver ? "var(--accent-amber)" : "var(--border-default)"}`,
        }}
      >
        <Upload size={24} style={{ color: dragOver ? "var(--accent-amber)" : "var(--text-3)" }} />
        <p className="text-sm" style={{ color: "var(--text-2)" }}>
          Drag & drop files here, or click to browse
        </p>
        <p className="text-xs" style={{ color: "var(--text-3)" }}>
          PDF, TXT, MD, DOC, PNG, JPG, WEBP &mdash; {MAX_FILE_MB} MB max per file
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS.join(",")}
          className="hidden"
          onChange={(e) => e.target.files && validateAndAdd(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {files.map((f, i) => (
            <div
              key={`${f.name}-${i}`}
              className="flex items-center justify-between px-3 py-2 rounded-lg"
              style={{ backgroundColor: "var(--bg-2)" }}
            >
              <div className="flex items-center gap-2 min-w-0">
                {isImage(f) ? (
                  <Image size={14} style={{ color: "var(--accent-cyan)" }} />
                ) : (
                  <FileText size={14} style={{ color: "var(--accent-amber)" }} />
                )}
                <span className="text-xs truncate" style={{ color: "var(--text-2)" }}>
                  {f.name}
                </span>
                <span className="text-[10px] flex-shrink-0" style={{ color: "var(--text-3)" }}>
                  ({(f.size / 1024 / 1024).toFixed(1)} MB)
                </span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="p-1 rounded-md hover:bg-white/5"
                style={{ color: "var(--text-3)" }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
