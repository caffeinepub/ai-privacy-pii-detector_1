import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PiiType, ScanResult } from "@/lib/piiDetector";
import {
  PII_HIGHLIGHT_STYLES,
  PII_LABELS,
  maskEntities,
} from "@/lib/piiDetector";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileText,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface ResultsPanelProps {
  results: ScanResult[];
}

export function ResultsPanel({ results }: ResultsPanelProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeResult = results[activeIndex] ?? results[0];

  if (!activeResult) return null;

  const entityTypes = [
    ...new Set(activeResult.entities.map((e) => e.type)),
  ] as PiiType[];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      data-ocid="scan.success_state"
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-7 h-7 rounded-full"
            style={{
              background: "oklch(0.72 0.18 145 / 0.2)",
              border: "1px solid oklch(0.72 0.18 145 / 0.4)",
            }}
          >
            <CheckCircle2
              className="w-4 h-4"
              style={{ color: "oklch(0.72 0.18 145)" }}
            />
          </div>
          <div>
            <h2
              className="text-base font-semibold"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Scan Results
            </h2>
            <p className="text-xs text-muted-foreground">
              {activeResult.entities.length} entities detected across{" "}
              {entityTypes.length} type{entityTypes.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Navigation for multi-file */}
        {results.length > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-7 h-7 p-0"
              onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
              disabled={activeIndex === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground font-mono">
              {activeIndex + 1} / {results.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="w-7 h-7 p-0"
              onClick={() =>
                setActiveIndex((i) => Math.min(results.length - 1, i + 1))
              }
              disabled={activeIndex === results.length - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* File selector for multi-file */}
      {results.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {results.map((r, i) => (
            <button
              type="button"
              key={r.filename}
              onClick={() => setActiveIndex(i)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all"
              style={{
                background:
                  i === activeIndex
                    ? "oklch(0.72 0.16 187 / 0.15)"
                    : "oklch(0.17 0.022 255)",
                border:
                  i === activeIndex
                    ? "1px solid oklch(0.72 0.16 187 / 0.5)"
                    : "1px solid oklch(0.28 0.022 255)",
                color:
                  i === activeIndex
                    ? "oklch(0.72 0.16 187)"
                    : "oklch(0.55 0.01 250)",
              }}
            >
              <FileText className="w-3 h-3" />
              {r.filename}
            </button>
          ))}
        </div>
      )}

      {/* Three panels */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        >
          <HighlightedPanel result={activeResult} />
          <JsonPanel result={activeResult} />
          <MaskPanel result={activeResult} />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Highlighted Text Panel ─── */
interface Segment {
  text: string;
  type?: PiiType;
  pos: number;
}

function buildSegments(result: ScanResult): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;
  const sortedEntities = [...result.entities].sort((a, b) => a.start - b.start);

  for (const entity of sortedEntities) {
    if (entity.start > lastIndex) {
      segments.push({
        text: result.originalText.slice(lastIndex, entity.start),
        pos: lastIndex,
      });
    }
    segments.push({ text: entity.value, type: entity.type, pos: entity.start });
    lastIndex = entity.end;
  }
  if (lastIndex < result.originalText.length) {
    segments.push({
      text: result.originalText.slice(lastIndex),
      pos: lastIndex,
    });
  }
  return segments;
}

function HighlightedPanel({ result }: { result: ScanResult }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(result.originalText);
    setCopied(true);
    toast.success("Text copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }, [result.originalText]);

  const entityTypes = [
    ...new Set(result.entities.map((e) => e.type)),
  ] as PiiType[];

  const segments = buildSegments(result);

  return (
    <div
      data-ocid="results.highlighted_text.panel"
      className="flex flex-col rounded-lg overflow-hidden"
      style={{
        border: "1px solid oklch(0.28 0.022 255)",
        background: "oklch(0.17 0.022 255)",
      }}
    >
      <div
        className="flex items-center justify-between px-3 py-2.5 border-b"
        style={{ borderColor: "oklch(0.28 0.022 255)" }}
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Highlighted Text
        </span>
        <Button
          data-ocid="results.copy_button"
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs gap-1"
          onClick={handleCopy}
        >
          {copied ? (
            <CheckCircle2
              className="w-3 h-3"
              style={{ color: "oklch(0.72 0.18 145)" }}
            />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          Copy
        </Button>
      </div>

      <ScrollArea className="flex-1 h-[280px]">
        <div className="p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words">
          {result.entities.length === 0 ? (
            <p className="text-muted-foreground italic">
              No PII detected in this text.
            </p>
          ) : (
            segments.map((seg) =>
              seg.type ? (
                <mark
                  key={`mark-${seg.pos}`}
                  title={PII_LABELS[seg.type]}
                  style={{
                    background: PII_HIGHLIGHT_STYLES[seg.type].bg,
                    color: PII_HIGHLIGHT_STYLES[seg.type].text,
                    borderRadius: "3px",
                    padding: "1px 3px",
                    cursor: "help",
                  }}
                >
                  {seg.text}
                </mark>
              ) : (
                <span key={`text-${seg.pos}`}>{seg.text}</span>
              ),
            )
          )}
        </div>
      </ScrollArea>

      {/* Legend */}
      {entityTypes.length > 0 && (
        <div
          className="px-3 py-2 border-t flex flex-wrap gap-1.5"
          style={{ borderColor: "oklch(0.28 0.022 255)" }}
        >
          {entityTypes.map((type) => (
            <span
              key={type}
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                background: PII_HIGHLIGHT_STYLES[type].bg,
                color: PII_HIGHLIGHT_STYLES[type].text,
              }}
            >
              {PII_LABELS[type]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── JSON Output Panel ─── */
function JsonPanel({ result }: { result: ScanResult }) {
  const [copied, setCopied] = useState(false);

  const jsonOutput = JSON.stringify(
    result.entities.map((e) => ({
      type: e.type,
      value: e.value,
      start: e.start,
      end: e.end,
      redacted: e.redacted,
    })),
    null,
    2,
  );

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(jsonOutput);
    setCopied(true);
    toast.success("JSON copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }, [jsonOutput]);

  return (
    <div
      data-ocid="results.json_output.panel"
      className="flex flex-col rounded-lg overflow-hidden"
      style={{
        border: "1px solid oklch(0.28 0.022 255)",
        background: "oklch(0.17 0.022 255)",
      }}
    >
      <div
        className="flex items-center justify-between px-3 py-2.5 border-b"
        style={{ borderColor: "oklch(0.28 0.022 255)" }}
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          JSON Output
        </span>
        <Button
          data-ocid="results.copy_json_button"
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs gap-1"
          onClick={handleCopy}
        >
          {copied ? (
            <CheckCircle2
              className="w-3 h-3"
              style={{ color: "oklch(0.72 0.18 145)" }}
            />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          Copy JSON
        </Button>
      </div>

      <ScrollArea className="flex-1 h-[280px]">
        <pre
          className="p-3 text-xs leading-relaxed"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: "oklch(0.75 0.08 250)",
          }}
        >
          <JsonHighlight json={jsonOutput} />
        </pre>
      </ScrollArea>

      <div
        className="px-3 py-2 border-t"
        style={{ borderColor: "oklch(0.28 0.022 255)" }}
      >
        <p className="text-xs text-muted-foreground">
          <span className="font-mono" style={{ color: "oklch(0.72 0.16 187)" }}>
            {result.entities.length}
          </span>{" "}
          entit{result.entities.length === 1 ? "y" : "ies"} detected
        </p>
      </div>
    </div>
  );
}

/** Minimal JSON syntax highlighter using line-by-line tokenization */
function JsonHighlight({ json }: { json: string }) {
  const lines = json.split("\n");
  return (
    <>
      {lines.map((line, lineIdx) => {
        const parts = line.split(
          /("(?:type|value|start|end|redacted)":)|"[^"]+"/g,
        );
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: static line-indexed rendering
          <div key={lineIdx}>
            {parts.map((part, partIdx) => {
              if (/^"(?:type|value|start|end|redacted)":$/.test(part)) {
                return (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static token-indexed rendering
                  <span key={partIdx} style={{ color: "oklch(0.72 0.16 187)" }}>
                    {part}
                  </span>
                );
              }
              if (/^"[^"]+"$/.test(part)) {
                return (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static token-indexed rendering
                  <span key={partIdx} style={{ color: "oklch(0.78 0.17 70)" }}>
                    {part}
                  </span>
                );
              }
              // biome-ignore lint/suspicious/noArrayIndexKey: static token-indexed rendering
              return <span key={partIdx}>{part}</span>;
            })}
          </div>
        );
      })}
    </>
  );
}

/* ─── Mask & Download Panel ─── */
function MaskPanel({ result }: { result: ScanResult }) {
  const entityTypes = [
    ...new Set(result.entities.map((e) => e.type)),
  ] as PiiType[];
  const [selectedTypes, setSelectedTypes] = useState<Set<PiiType>>(
    new Set(entityTypes),
  );

  const maskedPreview = maskEntities(
    result.originalText,
    result.entities,
    Array.from(selectedTypes),
  );

  const toggleType = (type: PiiType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const selectAll = () => setSelectedTypes(new Set(entityTypes));
  const deselectAll = () => setSelectedTypes(new Set());

  const handleDownload = () => {
    const blob = new Blob([maskedPreview], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `redacted_${result.filename.replace(/\.[^.]+$/, "")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Redacted file downloaded");
  };

  return (
    <div
      data-ocid="results.mask.panel"
      className="flex flex-col rounded-lg overflow-hidden"
      style={{
        border: "1px solid oklch(0.28 0.022 255)",
        background: "oklch(0.17 0.022 255)",
      }}
    >
      <div
        className="flex items-center justify-between px-3 py-2.5 border-b"
        style={{ borderColor: "oklch(0.28 0.022 255)" }}
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Mask & Download
        </span>
        <div className="flex items-center gap-1">
          <Button
            data-ocid="mask.select_all.button"
            variant="ghost"
            size="sm"
            className="h-5 px-1.5 text-xs"
            onClick={selectAll}
            disabled={entityTypes.length === 0}
          >
            All
          </Button>
          <span className="text-muted-foreground text-xs">/</span>
          <Button
            data-ocid="mask.deselect_all.button"
            variant="ghost"
            size="sm"
            className="h-5 px-1.5 text-xs"
            onClick={deselectAll}
            disabled={entityTypes.length === 0}
          >
            None
          </Button>
        </div>
      </div>

      {/* Type checkboxes */}
      <div
        className="px-3 py-2 space-y-1.5 border-b"
        style={{ borderColor: "oklch(0.28 0.022 255)" }}
      >
        {entityTypes.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-1">
            No PII types detected.
          </p>
        ) : (
          entityTypes.map((type) => {
            const count = result.entities.filter((e) => e.type === type).length;
            return (
              <div key={type} className="flex items-center gap-2">
                <Checkbox
                  id={`mask-${type}`}
                  checked={selectedTypes.has(type)}
                  onCheckedChange={() => toggleType(type)}
                  style={{
                    borderColor: PII_HIGHLIGHT_STYLES[type].badge,
                  }}
                />
                <label
                  htmlFor={`mask-${type}`}
                  className="flex items-center gap-2 flex-1 text-xs cursor-pointer"
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: PII_HIGHLIGHT_STYLES[type].badge }}
                  />
                  <span>{PII_LABELS[type]}</span>
                  <Badge
                    variant="secondary"
                    className="ml-auto text-xs px-1.5 py-0 h-4"
                  >
                    {count}
                  </Badge>
                </label>
              </div>
            );
          })
        )}
      </div>

      {/* Masked preview */}
      <ScrollArea className="flex-1 h-[140px]">
        <div
          className="p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words"
          style={{ color: "oklch(0.65 0.01 250)" }}
        >
          {maskedPreview || (
            <span className="italic text-muted-foreground">
              No text to display.
            </span>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div
        className="px-3 py-2.5 border-t flex items-center justify-between gap-2"
        style={{ borderColor: "oklch(0.28 0.022 255)" }}
      >
        <p className="text-xs text-muted-foreground">
          <span className="font-mono" style={{ color: "oklch(0.78 0.17 70)" }}>
            {selectedTypes.size}
          </span>
          /{entityTypes.length} types selected
        </p>
        <Button
          data-ocid="results.download_button"
          size="sm"
          className="gap-1.5 text-xs font-semibold"
          onClick={handleDownload}
          style={{
            background: "oklch(0.72 0.16 187)",
            color: "oklch(0.11 0.018 255)",
          }}
        >
          <Download className="w-3.5 h-3.5" />
          Download .txt
        </Button>
      </div>
    </div>
  );
}
