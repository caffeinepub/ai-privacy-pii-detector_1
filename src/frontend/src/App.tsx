import { Header } from "@/components/Header";
import { ResultsPanel } from "@/components/ResultsPanel";
import { ScanFilesTab } from "@/components/ScanFilesTab";
import { ScanTextTab } from "@/components/ScanTextTab";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ScanResult } from "@/lib/piiDetector";
import { AlignLeft, FileText } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

export default function App() {
  const [results, setResults] = useState<ScanResult[]>([]);
  const [totalScans, setTotalScans] = useState(0);
  const [totalEntities, setTotalEntities] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);

  const handleTextResult = (result: ScanResult) => {
    setResults([result]);
    setTotalScans((n) => n + 1);
    setTotalEntities((n) => n + result.entities.length);
  };

  const handleFileResults = (newResults: ScanResult[]) => {
    setResults(newResults);
    setTotalScans((n) => n + 1);
    setTotalEntities(
      (n) => n + newResults.reduce((sum, r) => sum + r.entities.length, 0),
    );
  };

  const handleFilesProcessed = (count: number) => {
    setTotalFiles((n) => n + count);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "oklch(0.17 0.022 255)",
            border: "1px solid oklch(0.28 0.022 255)",
            color: "oklch(0.94 0.008 250)",
          },
        }}
      />

      <Header
        totalScans={totalScans}
        totalEntities={totalEntities}
        totalFiles={totalFiles}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Tab switcher */}
        <Tabs defaultValue="text" className="w-full">
          <TabsList
            className="w-full max-w-xs mb-6 p-1 rounded-lg"
            style={{
              background: "oklch(0.17 0.022 255)",
              border: "1px solid oklch(0.28 0.022 255)",
            }}
          >
            <TabsTrigger
              value="text"
              data-ocid="tabs.scan_text.tab"
              className="flex-1 flex items-center gap-2 text-sm data-[state=active]:text-foreground"
              style={{
                ["--tw-ring-color" as string]: "oklch(0.72 0.16 187)",
              }}
            >
              <AlignLeft className="w-3.5 h-3.5" />
              Scan Text
            </TabsTrigger>
            <TabsTrigger
              value="files"
              data-ocid="tabs.scan_files.tab"
              className="flex-1 flex items-center gap-2 text-sm data-[state=active]:text-foreground"
            >
              <FileText className="w-3.5 h-3.5" />
              Scan Files
            </TabsTrigger>
          </TabsList>

          <div
            className="rounded-xl p-6 sm:p-8"
            style={{
              background: "oklch(0.17 0.022 255)",
              border: "1px solid oklch(0.28 0.022 255)",
            }}
          >
            <TabsContent value="text" className="mt-0">
              <ScanTextTab onResult={handleTextResult} />
            </TabsContent>

            <TabsContent value="files" className="mt-0">
              <ScanFilesTab
                onResults={handleFileResults}
                onFilesProcessed={handleFilesProcessed}
              />
            </TabsContent>
          </div>
        </Tabs>

        {/* Results */}
        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="rounded-xl p-6 sm:p-8"
                style={{
                  background: "oklch(0.17 0.022 255)",
                  border: "1px solid oklch(0.28 0.022 255)",
                }}
              >
                <ResultsPanel results={results} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        <AnimatePresence>
          {results.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              data-ocid="scan.error_state"
              className="rounded-xl p-8 text-center"
              style={{
                background: "oklch(0.15 0.016 255)",
                border: "1px dashed oklch(0.28 0.022 255)",
              }}
            >
              <div
                className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
                style={{
                  background: "oklch(0.72 0.16 187 / 0.1)",
                  border: "1px solid oklch(0.72 0.16 187 / 0.2)",
                }}
              >
                <AlignLeft
                  className="w-5 h-5"
                  style={{ color: "oklch(0.72 0.16 187)" }}
                />
              </div>
              <p
                className="text-sm font-medium mb-1"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                No results yet
              </p>
              <p className="text-xs text-muted-foreground">
                Paste text or upload files above to start detecting PII
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer
        className="border-t py-4 text-center text-xs text-muted-foreground"
        style={{ borderColor: "oklch(0.28 0.022 255)" }}
      >
        © {new Date().getFullYear()}. Built with{" "}
        <span style={{ color: "oklch(0.65 0.22 27)" }}>♥</span> using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
          style={{ color: "oklch(0.72 0.16 187)" }}
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
