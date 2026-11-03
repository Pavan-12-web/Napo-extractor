# Plain English Conversation Extractor & Gemini API Removal Plan

Remove all extraneous metadata, schema wrappers, and technical diagnostics from extracted outputs and downloaded files, ensuring the user receives exclusively the plain English dialogue context with clean speaker labels (`User` and `Assistant`), and completely remove all Gemini API integrations.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed during clarification and govern the implementation:

- **Confirmed Decision 1 (Plain English Formatting)**: The extracted content and downloaded file strictly contain only the plain English conversation dialogue formatted with clean speaker labels:
  ```markdown
  User:
  [Plain English user inquiry]

  Assistant:
  [Plain English assistant response]
  ```
  Zero metadata: no conversation IDs, share URLs, timestamps, parser versions, schema JSON keys, citation metadata, or system notes.
- **Confirmed Decision 2 (Primary Download Format)**: The primary one-click download action outputs a clean Markdown (`.md`) file containing purely the conversational text (with Plain Text `.txt` also available as an alternative).
- **Confirmed Decision 3 (Complete Gemini API Removal)**:
  - Delete `src/server/geminiUrlContext.ts`.
  - Remove all `@google/genai` imports and calls from `src/server/fetchShare.ts`.
  - Remove `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API` from `metadata.json`.
  - The extraction pipeline becomes 100% deterministic, local-first, and rule-based with zero external LLM API dependencies.

---

## 1. Overview & Core Concept

- **What It Does**: Streamlines Napo Extractor so that when a link or conversation is provided, the output is stripped of all technical metadata, diagnostics, and wrappers. Both the on-screen reading view and the downloaded export contain purely the readable plain English dialogue context.
- **Strict Plain English Context Guarantee**:
  - NO JSON schema wrappers or `{ "messages": ... }` objects in standard view or default download.
  - NO timestamps, token counts, message IDs, or share IDs.
  - NO crawler metrics, parser versions, or connector telemetry.
  - ONLY the actual words spoken by the user and assistant, with clean readable paragraph spacing and formatting.

---

## 2. User Experience & Visual Design

### Clean, Distraction-Free Flow

1. **Input**: User pastes a link or conversation text into the clean input canvas.
2. **Extraction**: Deterministic parser extracts conversation turns without external AI calls.
3. **Pristine Plain English View**:
   - Leads directly with the readable plain English dialogue.
   - Clean speaker headers: `User` and `Assistant`.
   - Prominent **"Download Plain Text / Markdown"** button.
   - One-click **"Copy Plain Text"** button.
4. **Downloaded File Content**:
   The downloaded `.md` or `.txt` file contains exclusively:
   ```markdown
   User:
   How does optimistic locking work in database systems?

   Assistant:
   Optimistic locking assumes that multiple transactions can complete without affecting each other. Each transaction reads data without taking locks, but checks whether another transaction modified the data before committing changes.
   ```
   No headers, no footers, no tracking tags, no metadata.

---

## 3. Key Product Decisions & Code Changes

### Step 1: Remove Gemini API Integration
- Remove `geminiUrlContext.ts` and all references from `server.ts` and `fetchShare.ts`.
- Clean up `metadata.json`: change `"majorCapabilities": ["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]` to `"majorCapabilities": []`.
- Uninstall / remove unused `@google/genai` references.

### Step 2: Enforce Plain English Output & Export
- Update `src/lib/exportLayer.ts` and `src/components/NormalizedConversationView.tsx` so the downloaded file:
  - Does NOT include JSON schema strings.
  - Does NOT include warning boxes or metadata footers.
  - Outputs only `User:\n...\n\nAssistant:\n...`.
- Streamline the UI so the primary display is the clean conversation text and the rule-based summary, without technical metadata cards.

---

## 4. Technical Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│               STREAMLINED PLAIN ENGLISH EXTRACTION PIPELINE            │
├────────────────────────────────────────────────────────────────────────┤
│  [ Input: URL / Paste ]                                                │
│         │                                                              │
│         ▼                                                              │
│  [ 100% Deterministic Local / Direct Parsers (No Gemini API) ]         │
│  - ChatGPT React Flight & __NEXT_DATA__ in-memory parser               │
│  - Claude Snapshot & DOM in-memory parser                              │
│  - Gemini / Perplexity / Grok / Meta AI clean DOM parsers              │
│         │                                                              │
│         ▼                                                              │
│  [ Metadata Stripper & Plain Text Sanitizer ]                          │
│  - Strip all IDs, timestamps, models, headers, footers, chrome         │
│  - Retain strictly User & Assistant dialogue                           │
│         │                                                              │
│         ▼                                                              │
│  [ User View & Download File ]                                         │
│  - User: [Plain English text]                                          │
│  - Assistant: [Plain English text]                                     │
│  - Download: Pure clean .md / .txt file (zero metadata)                │
└────────────────────────────────────────────────────────────────────────┘
```
