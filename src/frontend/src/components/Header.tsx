import { Shield, Zap } from "lucide-react";
import { motion } from "motion/react";

interface HeaderProps {
  totalScans: number;
  totalEntities: number;
  totalFiles: number;
}

export function Header({ totalScans, totalEntities, totalFiles }: HeaderProps) {
  return (
    <header
      data-ocid="header.section"
      className="relative overflow-hidden border-b border-border"
    >
      {/* Grid background */}
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />

      {/* Teal glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at top, oklch(0.72 0.16 187 / 0.15) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Logo row */}
        <div className="flex items-center justify-between py-5">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div
              className="relative flex items-center justify-center w-10 h-10 rounded-lg"
              style={{
                background: "oklch(0.72 0.16 187 / 0.15)",
                border: "1px solid oklch(0.72 0.16 187 / 0.4)",
                boxShadow: "0 0 16px oklch(0.72 0.16 187 / 0.2)",
              }}
            >
              <Shield
                className="w-5 h-5"
                style={{ color: "oklch(0.72 0.16 187)" }}
              />
            </div>
            <div>
              <h1
                className="text-xl font-bold tracking-tight leading-none"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                AI Privacy{" "}
                <span style={{ color: "oklch(0.72 0.16 187)" }}>
                  PII Detector
                </span>
              </h1>
              <p
                className="text-xs mt-0.5"
                style={{ color: "oklch(0.55 0.01 250)" }}
              >
                Detect and redact sensitive information from text and files
              </p>
            </div>
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: "oklch(0.72 0.16 187 / 0.1)",
              border: "1px solid oklch(0.72 0.16 187 / 0.3)",
              color: "oklch(0.72 0.16 187)",
            }}
          >
            <Zap className="w-3 h-3" />
            In-browser processing
          </motion.div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center gap-6 pb-4"
        >
          <StatItem label="Total Scans" value={totalScans} />
          <div className="w-px h-5 bg-border" />
          <StatItem label="Entities Found" value={totalEntities} accent />
          <div className="w-px h-5 bg-border" />
          <StatItem label="Files Processed" value={totalFiles} />
        </motion.div>
      </div>
    </header>
  );
}

function StatItem({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="text-lg font-bold font-mono"
        style={{
          color: accent ? "oklch(0.78 0.17 70)" : "oklch(0.72 0.16 187)",
        }}
      >
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
