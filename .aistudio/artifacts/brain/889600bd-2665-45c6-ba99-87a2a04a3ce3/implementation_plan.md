# Plain English Text Extraction & HTML Shell Guard

Ensure public AI conversation links (specifically modern ChatGPT share links using React Router streaming) extract all real dialogue turns as pure plain English text, eliminating all raw HTML source code, metadata, internal tool tokens, and application shells.

## User Review & Critical Decisions

> [!IMPORTANT]
> The issue shown in your screenshot occurred because modern ChatGPT share pages transitioned to React Router stream payloads (`window.__reactRouterContext.streamController.enqueue`). The previous parser did not recognize this new format, causing the orchestrator to fall back to treating the raw HTML document as text and wrapping it in a `User:` label.
>
> We will fix this by implementing native React Router devalue stream parsing, stripping all internal AI tool tokens (`\uE200...\uE201`), and enforcing a strict guard that prevents any HTML document from ever falling back into conversation text.

- **Confirmed Decision 1**: Add native modern ChatGPT React Router / Remix stream payload extractor (`linear_conversation` devalue traversal).
- **Confirmed Decision 2**: Strict HTML shell guard: If input is an HTML document (`<!DOCTYPE html>` or `<html>`) and does not resolve into valid conversation turns, immediately return the required empty shell recovery notice instead of dumping raw HTML into a message.
- **Confirmed Decision 3**: Deep token sanitization: Automatically strip internal ChatGPT/Claude tool call markers (e.g. `\uE200genui\uE202...`, redacted plugin markers, and JSON payloads), yielding 100% human-readable plain English dialogue.

---

### 1. Overview & Core Concept

- **What It Does**:
  - Connects to modern ChatGPT public links (like `https://chatgpt.com/share/6ae9a821-7990-83ee-b2ea-ee3a1d8d5540`) and unpacks the 24+ conversation turns directly from the React Router state stream.
  - Cleans every turn so it contains strictly natural English conversation.
  - Guards against unrendered shells: if a user pastes raw HTML that cannot be parsed into real dialogue, the app rejects it with an explanatory recovery prompt rather than displaying or downloading source code.
- **Target Persona**: Knowledge workers, researchers, and writers who need clean dialogue transcripts without code clutter or leaked metadata.
- **Key Value**: 100% human-readable dialogue output with zero raw HTML, zero JSON, and zero internal plugin code.

---

### 2. User Experience & Visual Design

- **Extraction View**:
  - Displays user and assistant turns with clean, legible typography and high contrast.
  - Messages display pure conversational prose. Internal tool calls, plugin outputs, citations JSON, and raw source tags are completely excluded.
- **Empty Shell Recovery**:
  - When an unrendered HTML capture or empty shell is provided, the UI clearly shows:
    > "No conversation content was found. This appears to be an application shell captured before the conversation was rendered. Copy the visible conversation text or use the local page extractor."
- **Download Action**:
  - Generates `.md` and `.txt` files containing strictly:
    ```markdown
    User:
    [Plain English inquiry]

    Assistant:
    [Plain English reply]
    ```

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: React Router Stream Unpacking (`window.__reactRouterContext`)**
  - *Chosen Approach*: Decode the Turbo/devalue serialization array in memory to locate `linear_conversation` and dereference message nodes.
  - *Why*: Modern ChatGPT share URLs serve their data exclusively through this stream; this extracts all conversation messages without needing headless browsers or proxies.
- **Decision 2: Elimination of HTML-as-Text Fallback**
  - *Chosen Approach*: In `orchestrateParse` and `parseStreamText`, inspect input for `<!DOCTYPE`, `<html`, `<head`, or `<script`. If present and DOM/Flight/Router parsers find no messages, fail gracefully with the empty shell error rather than putting the HTML into `User:`.
  - *Why*: Prevents the exact bug where the user sees raw HTML tags inside `User:`.
- **Decision 3: Sanitization of Internal Tool Markup**
  - *Chosen Approach*: Strip Unicode private-use tokens (`\uE200` to `\uE203`) and plugin JSON blobs emitted during web search or code interpreter calls.
  - *Why*: Guarantees that only actual English conversation reaches the user and the exported file.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Input (URL or Paste)                     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Parser Orchestration Pipeline               │
│                                                             │
│  1. Check Is Empty Shell? ──(Yes)──> Return Recovery Error  │
│  2. Strategy A: Claude / ChatGPT JSON Snapshot              │
│  3. Strategy B: HTML / Stream Parsers                       │
│     ├── ChatGPT React Router devalue stream [NEW]           │
│     ├── ChatGPT React Flight stream                         │
│     ├── ChatGPT __NEXT_DATA__ payload                       │
│     └── Standard DOM turn extraction                        │
│  4. Strategy C: Stream Text (PLAIN TEXT ONLY)               │
│     └── (Rejects any HTML documents with tags)              │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Plain English Normalizer                   │
│  - Strip Unicode tool tokens (\uE200...\uE203)              │
│  - Strip plugin redaction and JSON metadata blobs           │
│  - Format: User: ... / Assistant: ...                       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│         Verified Output & Download (.md, .txt)              │
└─────────────────────────────────────────────────────────────┘
```

- **Verification Strategy**:
  - Test with live ChatGPT link `https://chatgpt.com/share/6ae9a821-7990-83ee-b2ea-ee3a1d8d5540` to confirm 24 dialogue turns are extracted as pure plain English.
  - Test with raw unrendered HTML to confirm the recovery notice is shown instead of HTML source code.
  - Run `lint_applet` and `compile_applet`.
