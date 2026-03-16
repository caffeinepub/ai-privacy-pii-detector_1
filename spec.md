# AI Privacy / PII Detector

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Motoko backend with three public functions: scanText, scanFiles, maskData
- PII detection engine using regex patterns for 13 PII types
- React frontend dashboard with full scanning workflow
- Text paste input with scan button
- Drag-and-drop + click-to-upload file area (multi-file)
- File preview list with file name, size, type, and remove option
- Progress indicator during scanning
- Results panel with highlighted PII in scanned text
- Structured JSON output panel showing all detected entities
- Mask/redact toggle per entity type or all at once
- Download redacted output as .txt file
- Unsupported format notice for PDF and DOCX

### Modify
N/A

### Remove
N/A

## Implementation Plan

### Backend (Motoko)
- Define `PiiEntity` type: { label: Text; value: Text; start: Nat; end: Nat; masked: Text }
- Define `ScanResult` type: { original: Text; entities: [PiiEntity]; masked: Text }
- `scanText(text: Text) -> async ScanResult`
  - Run all 13 regex-style detection passes (implemented as Motoko pattern matching + text scanning helpers)
  - Return matched entities with positions and masked variants
- `scanFiles(files: [(Text, Text)]) -> async [ScanResult]`
  - Accept array of (filename, content) pairs
  - Run scanText on each file's content
  - Return per-file results
- `maskData(text: Text, entities: [PiiEntity]) -> async Text`
  - Replace entity spans with [REDACTED:LABEL] placeholders

### PII Detection Rules
- Email: standard RFC-like regex
- Phone: Indian/international formats with country codes
- Aadhaar: 12-digit pattern `\d{4}[- ]?\d{4}[- ]?\d{4}`
- PAN: `[A-Z]{5}[0-9]{4}[A-Z]`
- Passport: `[A-Z][1-9][0-9]{6}` (Indian format)
- Credit card: 16-digit Luhn-style groupings
- Bank account: 9-18 digit numeric strings in context
- IP address: IPv4 and IPv6
- API key: common prefixes (sk-, pk-, Bearer, token=, api_key)
- Secret token: hex/base64 strings >20 chars in key=value context
- Password: password/passwd/pwd= patterns in text
- Location: city/state/country keywords and address patterns
- Name: capitalized word pairs (heuristic)

### Frontend
- Dashboard layout: sidebar nav + main content area
- Three tabs/modes: Scan Text, Scan Files, Results
- ScanTextTab: textarea, scan button, loading spinner
- ScanFilesTab: dropzone (drag-and-drop + file picker), file list, scan button
- ResultsPanel: highlighted text view, JSON accordion, mask controls, download button
- File format guard: show notice for .pdf and .docx uploads
- All state managed locally in React
- Backend calls via generated bindings
