# Production-Ready Multi-Provider AI Conversation Extraction System

An industrial-grade, multi-provider conversation extraction architecture that converts public AI conversation links into complete, lossless, normalized transcripts without fragile bot-evasion exploits.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed during interactive clarification and govern the implementation:

- **Confirmed Decision 1 (Browser-Extension Connector Package)**: Delivered as a clean **Manifest V3 Extension package** (`manifest.json`, background service worker, in-tab content script) communicating with Napo Extractor via a secure `window.postMessage` bridge. It opens the conversation in a background tab using the user's existing authorized session, sanitizes the rendered DOM locally, and sends only normalized data back to the web application.
- **Confirmed Decision 2 (Gemini URL Context Connector)**: Implemented server-side using the modern `@google/genai` TypeScript SDK (`gemini-3.8-flash`) with strict structured JSON schema (`responseSchema`). The model is strictly instructed not to summarize, rewrite, infer, or complete content.
- **Confirmed Decision 3 (Connector Priority Hierarchy)**:
  1. *Provider-specific public structured-data connector* (e.g. Claude public snapshot API, ChatGPT React Flight payloads)
  2. *Direct public-page fetch and embedded-data parser* (`__NEXT_DATA__`, `<script>` blobs)
  3. *Gemini 3.8 Flash URL Context* as an opportunistic public-page retrieval attempt
  4. *User-authorized Browser-Extension connector* (background tab rendering)
  5. *Manual Paste* as the deterministic final fallback
- **Confirmed Decision 4 (Sample Link Verification)**: Incorporates the newly provided verified Claude sample link: `https://claude.ai/share/767b0a62-e721-49bd-85b0-2e0676166874` to build and test the Claude Snapshot & DOM extractor.

---

## 1. Overview & Core Concept

- **Primary Goal**: A user pastes a single public AI conversation link (ChatGPT, Claude, Gemini, Grok, Meta AI, Perplexity) and receives an accurate, complete, lossless transcript formatted in Markdown, JSON, TXT, HTML, or PDF with minimal friction.
- **Ethical & Secure Boundary**: Zero bot-evasion bypasses (no headless-browser stealth evasions, no CAPTCHA solvers, no proxy rotation, no cookie theft, no TLS fingerprint spoofing). When automated direct fetching is blocked, the app immediately transitions to the recovery state machine.
- **Normalized Schema Target**:
  ```json
  {
    "extractionStatus": "complete",
    "platform": "claude",
    "sourceUrl": "https://claude.ai/share/767b0a62-e721-49bd-85b0-2e0676166874",
    "shareId": "767b0a62-e721-49bd-85b0-2e0676166874",
    "title": "Conversation Title",
    "model": null,
    "updatedAt": null,
    "messages": [
      {
        "id": "msg-1",
        "role": "user",
        "author": "User",
        "content": "...",
        "format": "markdown",
        "createdAt": null,
        "citations": [],
        "attachments": [],
        "artifacts": []
      }
    ],
    "warnings": [],
    "parserVersion": "2.0.0"
  }
  ```

---

## 2. User Experience & Recovery State Machine

### Clean State Machine Transitions

Instead of abrupt terminal errors or dead-end "bot-protection" alerts, the system guides users through a progressive recovery state machine:

```
[Paste URL]
    │
    ▼
[Detecting Provider] ──> [Connecting] ──> [Retrieving Conversation]
                                                │
                                                ├─► Success ──► [Parsing Messages] ──► [Validating] ──► [Ready / Partial]
                                                │
                                                └─► Blocked / Dynamic Shell
                                                          │
                                                          ▼
                                            [Recovery State Dialog]
                                            "This conversation needs to be opened
                                             through your browser. We'll continue
                                             automatically after it loads."
                                              ├── Primary: "Open and extract" (Extension)
                                              ├── Secondary: "Paste conversation"
                                              └── Tertiary: "Cancel"
```

### Display & Export Workflow
1. **Rule-Based Content Summary**: Turns count, opening inquiry, frequent keywords, detected languages, headings, and concluding statements.
2. **Normalized Conversation Preview**: User and Assistant dialogue turns, preserved Markdown code blocks with syntax tags, tables, nested lists, blockquotes, and Artifact source code tabs.
3. **Lossless Multi-Format Export**: One-click Copy, Markdown (`.md`), Lossless JSON (`.json`), Plain Text (`.txt`), Self-contained HTML (`.html`), and Unicode/RTL-compliant PDF (`.pdf`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: ChatPeek-Inspired Separation of Concerns**
  - *Chosen Approach*: Refactor ChatGPT extraction concepts from `vl3c/ChatPeek` into a strictly modular, in-memory parser. Parsing is decoupled from network fetching. No writing to local disk, no automatic asset downloading, and strict hostname allowlisting.
  - *Why*: Commercial-friendly, safe against SSRF, completely memory-bound.
- **Decision 2: Claude Public Snapshot Endpoint (`/api/chat_snapshots/<uuid>`)**
  - *Chosen Approach*: When a `claude.ai/share/<uuid>` link is passed, extract the UUID and query Claude's snapshot API first. If blocked or empty, fallback to Gemini URL context or extension background DOM rendering.
  - *Why*: Claude share page HTML is an empty client shell; snapshot JSON contains the raw structured dialogue and Artifacts.
- **Decision 3: Manifest V3 Extension & Bridge**
  - *Chosen Approach*: Manifest V3 background worker that opens a background tab to the authorized URL, executes a local DOM extractor content script, and posts the normalized JSON to the web app via `window.postMessage`.
  - *Why*: Zero credential or cookie leakage to server; 100% compliant with browser security boundaries.

---

## 4. Technical Architecture & Component Structure

```
┌────────────────────────────────────────────────────────────────────────┐
│               NAPO EXTRACTOR MULTI-PROVIDER ARCHITECTURE               │
├────────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │                  PROVIDER CAPABILITY REGISTRY                      │ │
│ │  ChatGPT  ·  Claude  ·  Gemini  ·  Grok  ·  Meta AI  ·  Perplexity  │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                   │                                    │
│                                   ▼                                    │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │                    5-TIER CONNECTOR PIPELINE                       │ │
│ │  1. Public Structured Snapshot (Claude Snapshot, React Flight)     │ │
│ │  2. Direct Public Page Fetch + Embedded Parser (__NEXT_DATA__)     │ │
│ │  3. Gemini 3.8 Flash URL Context (Server-Side Structured JSON)     │ │
│ │  4. User-Authorized Browser Extension (MV3 postMessage Bridge)     │ │
│ │  5. Client-Side Smart Paste Canvas (HTML / MD / JSON / Text)       │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                   │                                    │
│                                   ▼                                    │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │                  NORMALIZATION & VALIDATION LAYER                  │ │
│ │  - Schema Normalizer ({ extractionStatus, messages, warnings })    │ │
│ │  - Empty Shell Guard ("No conversation content was found...")      │ │
│ │  - Lossless Preservation (Lists, Code, Tables, RTL, Artifacts)     │ │
│ │  - Privacy Audit (No JWTs, keys, passwords, personal emails)       │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                   │                                    │
│                                   ▼                                    │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │                      EXPORT & RECOVERY VIEWS                       │ │
│ │  - Rule-Based Content Summary                                      │ │
│ │  - Clean Conversation Dialogue                                     │ │
│ │  - 1-Click Download Bar (.md, .json, .txt, .html, .pdf)            │ │
│ │  - Recovery Dialog ("Open and extract" / "Paste conversation")     │ │
│ │  - Interactive Acceptance Test Lab (16 Verification Scenarios)     │ │
│ └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### Provider Registry Specification
Each provider implements:
- `id`: `chatgpt` | `claude` | `gemini` | `grok` | `meta` | `perplexity`
- `urlPatterns`: regex validation for share endpoints
- `capabilities`: `{ directFetch, structuredData, browserExtension, geminiContext }`
- `limitations`: Platform-specific warnings (Claude artifact interactivity, Gemini image context, Perplexity citations, Meta AI blocked URL)
- `parserVersion`: versioned parser string (e.g. `2.1.0`)

### Acceptance Test Lab Fixtures (16 Test Scenarios)
1. `short-two-message`: Basic prompt & response
2. `multi-turn-long`: 8-turn technical discussion
3. `chatgpt-react-flight`: Simulated ChatGPT React Flight payload
4. `chatgpt-legacy-next`: Legacy ChatGPT `__NEXT_DATA__` structure
5. `claude-snapshot-json`: Real Claude Snapshot JSON structure with Artifacts
6. `claude-empty-shell`: Claude HTML application shell triggering empty-shell recovery
7. `code-containing-html`: Nested HTML and TypeScript inside code fences
8. `nested-lists-headings`: Multi-level ordered/unordered lists
9. `tables-blockquotes`: Markdown tables with pipe alignment and quotes
10. `unicode-rtl`: Arabic & Hebrew mixed with English
11. `citations-references`: Markdown citation footnotes `[^1]`
12. `artifacts-source`: Claude Artifact code blocks with copy/preview tabs
13. `images-attachments`: Simulated attachments with platform warning
14. `bot-challenge-recovery`: 403 challenge triggering "This conversation needs to be opened through your browser"
15. `malicious-html-xss`: `<script>alert(1)</script>` verifying strict sanitization
16. `live-claude-sample`: Live verified URL `https://claude.ai/share/767b0a62-e721-49bd-85b0-2e0676166874`
