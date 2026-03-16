import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatFileSize, parseFile } from "@/lib/fileParser";
import { scanText } from "@/lib/piiDetector";
import type { ScanResult } from "@/lib/piiDetector";
import {
  AlertTriangle,
  Braces,
  File,
  FileText,
  Loader2,
  Search,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";

type FileStatus = "pending" | "scanning" | "scanned" | "unsupported";

interface FileEntry {
  id: string;
  file: File;
  status: FileStatus;
  message?: string;
}

interface ScanFilesTabProps {
  onResults: (results: ScanResult[]) => void;
  onFilesProcessed: (count: number) => void;
}

function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "txt":
      return <FileText className="w-4 h-4" />;
    case "csv":
      return <FileText className="w-4 h-4" />;
    case "json":
      return <Braces className="w-4 h-4" />;
    default:
      return <File className="w-4 h-4" />;
  }
}

export function ScanFilesTab({
  onResults,
  onFilesProcessed,
}: ScanFilesTabProps) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const idCounter = useRef(0);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    const entries: FileEntry[] = arr.map((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const unsupported = ["pdf", "docx", "doc"].includes(ext);
      idCounter.current += 1;
      return {
        id: `f${idCounter.current}`,
        file,
        status: unsupported ? "unsupported" : "pending",
        message: unsupported
          ? "PDF and DOCX are not supported — paste text manually"
          : undefined,
      };
    });
    setFiles((prev) => [...prev, ...entries]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const pendingFiles = files.filter((f) => f.status === "pending");

  const handleScanAll = async () => {
    if (pendingFiles.length === 0) return;
    setIsScanning(true);
    setProgress(0);

    const results: ScanResult[] = [];
    let processed = 0;

    for (const entry of pendingFiles) {
      setFiles((prev) =>
        prev.map((f) => (f.id === entry.id ? { ...f, status: "scanning" } : f)),
      );

      const parsed = await parseFile(entry.file);
      if (parsed.supported) {
        const result = scanText(parsed.text, entry.file.name);
        results.push(result);
      }

      setFiles((prev) =>
        prev.map((f) => (f.id === entry.id ? { ...f, status: "scanned" } : f)),
      );

      processed += 1;
      setProgress(Math.round((processed / pendingFiles.length) * 100));
      await new Promise((r) => setTimeout(r, 80));
    }

    onResults(results);
    onFilesProcessed(processed);
    setIsScanning(false);
    setProgress(100);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div>
        <h2
          className="text-base font-semibold"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
        >
          Upload Files to Scan
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Supports TXT, CSV, JSON — drag & drop or click to browse
        </p>
      </div>

      {/* Dropzone — label wraps hidden input for semantic file trigger */}
      <label
        htmlFor="file-upload-input"
        data-ocid="scan_files.dropzone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className="relative cursor-pointer rounded-lg transition-all duration-200 block"
        style={{
          border: isDragOver
            ? "2px dashed oklch(0.72 0.16 187)"
            : "2px dashed oklch(0.28 0.022 255)",
          background: isDragOver
            ? "oklch(0.72 0.16 187 / 0.07)"
            : "oklch(0.15 0.018 255)",
          boxShadow: isDragOver
            ? "0 0 20px oklch(0.72 0.16 187 / 0.15)"
            : "none",
        }}
      >
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
            style={{
              background: isDragOver
                ? "oklch(0.72 0.16 187 / 0.2)"
                : "oklch(0.22 0.022 255)",
              border: "1px solid oklch(0.28 0.022 255)",
            }}
          >
            <Upload
              className="w-5 h-5"
              style={{
                color: isDragOver
                  ? "oklch(0.72 0.16 187)"
                  : "oklch(0.55 0.01 250)",
              }}
            />
          </div>
          <p className="text-sm font-medium">
            {isDragOver ? "Drop files here" : "Drag & drop files here"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            or{" "}
            <span
              style={{ color: "oklch(0.72 0.16 187)" }}
              className="font-medium"
            >
              click to browse
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            TXT, CSV, JSON, PDF*, DOCX* &nbsp;·&nbsp; Multiple files supported
          </p>
          <p className="text-xs mt-1" style={{ color: "oklch(0.55 0.01 250)" }}>
            *PDF and DOCX display unsupported notice
          </p>
        </div>
        <input
          id="file-upload-input"
          type="file"
          multiple
          accept=".txt,.csv,.json,.pdf,.docx,.doc"
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
          data-ocid="scan_files.upload_button"
        />
      </label>

      {/* File list */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {files.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: index * 0.04 }}
                data-ocid={`file_list.item.${index + 1}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                style={{
                  background: "oklch(0.17 0.022 255)",
                  border: "1px solid oklch(0.28 0.022 255)",
                }}
              >
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-md flex-shrink-0"
                  style={{ background: "oklch(0.22 0.025 255)" }}
                >
                  <span style={{ color: "oklch(0.72 0.16 187)" }}>
                    {getFileIcon(entry.file.name)}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {entry.file.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(entry.file.size)}
                    </span>
                    {entry.message && (
                      <span
                        className="flex items-center gap-1 text-xs"
                        style={{ color: "oklch(0.78 0.17 70)" }}
                      >
                        <AlertTriangle className="w-3 h-3" />
                        Unsupported format
                      </span>
                    )}
                  </div>
                </div>

                <FileStatusBadge status={entry.status} />

                <button
                  type="button"
                  data-ocid={`file_list.delete_button.${index + 1}`}
                  onClick={() => removeFile(entry.id)}
                  disabled={entry.status === "scanning"}
                  className="p-1 rounded transition-colors hover:bg-muted flex-shrink-0 disabled:opacity-40"
                  aria-label="Remove file"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress */}
      <AnimatePresence>
        {isScanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
            data-ocid="scan.loading_state"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Scanning files...</span>
              <span
                style={{ color: "oklch(0.72 0.16 187)" }}
                className="font-mono"
              >
                {progress}%
              </span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          data-ocid="scan_files.submit_button"
          onClick={handleScanAll}
          disabled={pendingFiles.length === 0 || isScanning}
          className="gap-2 font-semibold"
          style={{
            background: "oklch(0.72 0.16 187)",
            color: "oklch(0.11 0.018 255)",
          }}
        >
          {isScanning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Scanning {pendingFiles.length} file
              {pendingFiles.length !== 1 ? "s" : ""}...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Scan{" "}
              {pendingFiles.length > 0
                ? `${pendingFiles.length} file${pendingFiles.length !== 1 ? "s" : ""}`
                : "Files"}
            </>
          )}
        </Button>

        {files.length > 0 && !isScanning && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFiles([])}
            className="text-xs text-muted-foreground"
          >
            Clear all
          </Button>
        )}
      </div>
    </motion.div>
  );
}

function FileStatusBadge({ status }: { status: FileStatus }) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="secondary" className="text-xs shrink-0">
          Pending
        </Badge>
      );
    case "scanning":
      return (
        <Badge
          className="text-xs shrink-0"
          style={{
            background: "oklch(0.72 0.16 187 / 0.2)",
            color: "oklch(0.72 0.16 187)",
            border: "1px solid oklch(0.72 0.16 187 / 0.4)",
          }}
        >
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Scanning
        </Badge>
      );
    case "scanned":
      return (
        <Badge
          className="text-xs shrink-0"
          style={{
            background: "oklch(0.72 0.18 145 / 0.2)",
            color: "oklch(0.72 0.18 145)",
            border: "1px solid oklch(0.72 0.18 145 / 0.4)",
          }}
        >
          Scanned
        </Badge>
      );
    case "unsupported":
      return (
        <Badge
          className="text-xs shrink-0"
          style={{
            background: "oklch(0.78 0.17 70 / 0.15)",
            color: "oklch(0.78 0.17 70)",
            border: "1px solid oklch(0.78 0.17 70 / 0.4)",
          }}
        >
          Unsupported
        </Badge>
      );
  }
}
