"use client";

import { useState, useRef } from "react";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface Props {
  caseId: string;
  onSuccess?: (fileName: string, chunks: number) => void;
}

type Status = "idle" | "uploading" | "success" | "error";

export function DocumentUpload({ caseId, onSuccess }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.name.endsWith(".pdf")) {
      setStatus("error");
      setMessage("Only PDF files are supported");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setStatus("error");
      setMessage("File must be under 10 MB");
      return;
    }

    setStatus("uploading");
    setMessage(`Processing ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("case_id", caseId);
      formData.append("file_name", file.name);

      const res = await fetch("/api/documents/ingest", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Upload failed");
      }

      setStatus("success");
      setMessage(
        `${file.name} indexed — ${data.chunks_inserted} chunks ready for search`,
      );
      onSuccess?.(file.name, data.chunks_inserted);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const borderColor = dragOver
    ? "border-indigo-500 bg-indigo-50"
    : status === "error"
      ? "border-red-400 bg-red-50"
      : status === "success"
        ? "border-green-400 bg-green-50"
        : "border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50";

  return (
    <div className="space-y-3">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${borderColor}`}
        onDrop={onDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        {status === "uploading" && (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            <p className="text-sm text-indigo-600 font-medium">{message}</p>
            <p className="text-xs text-gray-400">
              Embedding chunks... this takes 10–30 seconds
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <p className="text-sm text-green-700 font-medium">{message}</p>
            <p className="text-xs text-gray-400">
              Drop another PDF to add more documents
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="text-sm text-red-600 font-medium">{message}</p>
            <p className="text-xs text-gray-400">Click to try again</p>
          </div>
        )}

        {status === "idle" && (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-gray-400" />
            <p className="text-sm font-medium text-gray-600">
              Drop a PDF or click to upload
            </p>
            <p className="text-xs text-gray-400">
              FIR, chargesheet, court order — max 10 MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
