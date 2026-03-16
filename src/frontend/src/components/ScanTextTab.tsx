import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ScanResult } from "@/lib/piiDetector";
import { scanText } from "@/lib/piiDetector";
import { FileText, Loader2, Search, X } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";

const SAMPLE_TEXT = `Hi, I'm Priya Sharma and I live in Mumbai, Maharashtra.
You can reach me at priya.sharma@example.com or call +91-9876543210.
My Aadhaar number is 1234 5678 9012 and PAN is ABCDE1234F.
Passport: A1234567 | Credit Card: 4532-1234-5678-9010
Bank Account: 123456789012
Server IP: 192.168.1.100
password=MySecr3tP@ss!
api_key=sk-abc123def456ghi789jkl012mno345
auth=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9abc123`;

interface ScanTextTabProps {
  onResult: (result: ScanResult) => void;
}

export function ScanTextTab({ onResult }: ScanTextTabProps) {
  const [text, setText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleScan = async () => {
    if (!text.trim()) return;
    setIsScanning(true);

    // Simulate slight delay for UX feedback
    await new Promise((r) => setTimeout(r, 300));
    const result = scanText(text, "pasted-text.txt");
    onResult(result);
    setIsScanning(false);
  };

  const handleClear = () => {
    setText("");
    textareaRef.current?.focus();
  };

  const loadSample = () => {
    setText(SAMPLE_TEXT);
    textareaRef.current?.focus();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-base font-semibold"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Paste Text to Scan
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Paste any text containing sensitive information to detect PII
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={loadSample}
          style={{ color: "oklch(0.72 0.16 187)" }}
        >
          <FileText className="w-3 h-3 mr-1" />
          Load sample
        </Button>
      </div>

      <div className="relative">
        <Textarea
          ref={textareaRef}
          data-ocid="scan_text.textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your text here to scan for PII — emails, phone numbers, Aadhaar, PAN, credit cards, passwords, API keys..."
          className="min-h-[220px] resize-y font-mono text-sm leading-relaxed scrollbar-thin"
          style={{
            background: "oklch(0.15 0.018 255)",
            border: "1px solid oklch(0.28 0.022 255)",
            color: "oklch(0.94 0.008 250)",
          }}
        />
        <div className="absolute bottom-3 right-3 text-xs text-muted-foreground font-mono">
          {text.length.toLocaleString()} chars
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          data-ocid="scan_text.submit_button"
          onClick={handleScan}
          disabled={!text.trim() || isScanning}
          className="gap-2 font-semibold"
          style={{
            background: "oklch(0.72 0.16 187)",
            color: "oklch(0.11 0.018 255)",
          }}
        >
          {isScanning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Scan Text
            </>
          )}
        </Button>

        <Button
          data-ocid="scan_text.cancel_button"
          variant="outline"
          onClick={handleClear}
          disabled={!text}
          className="gap-2"
        >
          <X className="w-4 h-4" />
          Clear
        </Button>

        {isScanning && (
          <div
            data-ocid="scan.loading_state"
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: "oklch(0.72 0.16 187)" }}
            />
            Analyzing patterns...
          </div>
        )}
      </div>
    </motion.div>
  );
}
