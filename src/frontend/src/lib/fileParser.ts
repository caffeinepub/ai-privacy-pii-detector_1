/**
 * File Parser — extract text content from uploaded files.
 * Supports TXT, CSV, JSON natively.
 * PDF and DOCX are unsupported in this environment.
 */

export interface ParseResult {
  text: string;
  supported: boolean;
  message?: string;
}

const UNSUPPORTED_MESSAGE =
  "PDF and DOCX formats are not supported in this browser environment. " +
  "Please copy and paste the text content manually into the Scan Text tab.";

/**
 * Parse a file and return its text content.
 * Returns { supported: false } for unsupported formats.
 */
export async function parseFile(file: File): Promise<ParseResult> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  switch (ext) {
    case "txt": {
      const text = await file.text();
      return { text, supported: true };
    }

    case "csv": {
      const text = await file.text();
      return { text, supported: true };
    }

    case "json": {
      try {
        const raw = await file.text();
        const parsed = JSON.parse(raw);
        const text = JSON.stringify(parsed, null, 2);
        return { text, supported: true };
      } catch {
        const text = await file.text();
        return { text, supported: true };
      }
    }

    case "pdf":
    case "docx":
    case "doc":
      return {
        text: "",
        supported: false,
        message: UNSUPPORTED_MESSAGE,
      };

    default:
      return {
        text: "",
        supported: false,
        message: `File type ".${ext}" is not supported. Supported formats: TXT, CSV, JSON.`,
      };
  }
}

/** Format file size for display */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Get icon name for file type */
export function getFileTypeIcon(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "txt":
      return "file-text";
    case "csv":
      return "sheet";
    case "json":
      return "braces";
    case "pdf":
      return "file-type";
    case "docx":
    case "doc":
      return "file-word";
    default:
      return "file";
  }
}
