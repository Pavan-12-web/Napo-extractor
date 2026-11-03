/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TestFixture {
  id: string;
  title: string;
  description: string;
  category: 'core' | 'formats' | 'edge_cases' | 'security';
  rawPayload: string;
  expectedStatus: 'complete' | 'partial' | 'error';
  expectedRoleSequence?: ('user' | 'assistant')[];
}

export const ACCEPTANCE_FIXTURES: TestFixture[] = [
  {
    id: 'short-two-message',
    title: '1. Plain Two-Message Conversation',
    description: 'Basic question and response turn with clean user and assistant roles.',
    category: 'core',
    rawPayload: `User:
What is the core difference between optimistic and pessimistic locking?

Assistant:
Optimistic locking assumes conflicts are rare and verifies data versions at commit time, whereas pessimistic locking locks rows immediately upon reading to prevent concurrent writes.`,
    expectedStatus: 'complete',
    expectedRoleSequence: ['user', 'assistant'],
  },

  {
    id: 'multi-turn-long',
    title: '2. Long Multi-Turn Conversation',
    description: 'A 6-turn progressive technical discussion verifying message order stability.',
    category: 'core',
    rawPayload: `User:
Explain distributed transactions.

Assistant:
Distributed transactions execute across multiple network databases while maintaining ACID properties.

User:
How does Two-Phase Commit (2PC) achieve this?

Assistant:
2PC separates execution into a Prepare phase (voting) and a Commit phase (write).

User:
What is the primary drawback of 2PC?

Assistant:
The coordinator is a single point of failure and nodes remain blocked during network partitions.`,
    expectedStatus: 'complete',
    expectedRoleSequence: ['user', 'assistant', 'user', 'assistant', 'user', 'assistant'],
  },

  {
    id: 'chatgpt-react-flight',
    title: '3. ChatGPT React Flight Data',
    description: 'Modern Next.js React Flight streaming chunk payload.',
    category: 'formats',
    rawPayload: `<script>self.__next_f.push([1,"{\\"mapping\\":{\\"node-1\\":{\\"message\\":{\\"id\\":\\"m1\\",\\"author\\":{\\"role\\":\\"user\\"},\\"content\\":{\\"parts\\":[\\"Show me an example of Raft consensus.\\"]}}},\\"node-2\\":{\\"message\\":{\\"id\\":\\"m2\\",\\"author\\":{\\"role\\":\\"assistant\\"},\\"content\\":{\\"parts\\":[\\"Raft uses a leader to coordinate append-entries.\\"]}}}}"])</script>`,
    expectedStatus: 'complete',
    expectedRoleSequence: ['user', 'assistant'],
  },

  {
    id: 'chatgpt-legacy-next',
    title: '4. Legacy ChatGPT __NEXT_DATA__',
    description: 'Classic Next.js serverProps payload with title and message tree.',
    category: 'formats',
    rawPayload: `<script id="__NEXT_DATA__" type="application/json">
{
  "props": {
    "pageProps": {
      "sharedConversation": {
        "title": "Quantum Computing Basics",
        "mapping": {
          "1": { "message": { "author": { "role": "user" }, "content": { "parts": ["What is a qubit?"] } } },
          "2": { "message": { "author": { "role": "assistant" }, "content": { "parts": ["A qubit exists in a superposition of |0> and |1> states."] } } }
        }
      }
    }
  }
}
</script>`,
    expectedStatus: 'complete',
    expectedRoleSequence: ['user', 'assistant'],
  },

  {
    id: 'claude-snapshot-json',
    title: '5. Claude Chat-Snapshot JSON (Live Sample)',
    description: 'Structured JSON snapshot format from claude.ai/share/767b0a62-e721-49bd-85b0-2e0676166874.',
    category: 'formats',
    rawPayload: `{
  "uuid": "767b0a62-e721-49bd-85b0-2e0676166874",
  "name": "Distributed Systems Analysis",
  "chat_messages": [
    {
      "uuid": "msg-1",
      "sender": "human",
      "text": "How do vector clocks differ from Lamport timestamps?"
    },
    {
      "uuid": "msg-2",
      "sender": "assistant",
      "text": "Lamport timestamps establish a total causal order, while vector clocks detect causal concurrency between distributed events."
    }
  ]
}`,
    expectedStatus: 'complete',
    expectedRoleSequence: ['user', 'assistant'],
  },

  {
    id: 'claude-empty-shell',
    title: '6. Claude Application-Shell HTML (Empty Shell Test)',
    description: 'Client SPA shell with JavaScript and empty root, testing empty shell detection.',
    category: 'edge_cases',
    rawPayload: `<!DOCTYPE html>
<html>
<head>
  <title>Claude</title>
  <script src="/static/chunks/main.js"></script>
</head>
<body>
  <div id="root"></div>
</body>
</html>`,
    expectedStatus: 'error',
  },

  {
    id: 'code-containing-html',
    title: '7. Code Blocks Containing HTML',
    description: 'Fenced code blocks containing raw HTML, XML, and tags without breaking page rendering.',
    category: 'formats',
    rawPayload: `User:
Show me a simple HTML component.

Assistant:
Here is the code:

\`\`\`html
<div class="user-card">
  <h2>John Doe</h2>
  <script>console.log("embedded script");</script>
</div>
\`\`\`

Notice the tags are properly enclosed in markdown code fences.`,
    expectedStatus: 'complete',
  },

  {
    id: 'nested-lists-headings',
    title: '8. Markdown Headings & Nested Lists',
    description: 'Multi-level ordered and unordered lists under H1-H4 headings.',
    category: 'formats',
    rawPayload: `User:
List the layers of the OSI model.

Assistant:
# The OSI Reference Model

## Upper Layers
1. Application Layer
   - HTTP/HTTPS
   - DNS
2. Presentation Layer
   - TLS/SSL encryption
3. Session Layer

## Lower Layers
- Transport (TCP, UDP)
- Network (IP, ICMP)
- Data Link & Physical`,
    expectedStatus: 'complete',
  },

  {
    id: 'tables-blockquotes',
    title: '9. Markdown Tables & Blockquotes',
    description: 'Pipe-aligned markdown tables and quoted references.',
    category: 'formats',
    rawPayload: `User:
Compare SQL and NoSQL.

Assistant:
> "Data modeling begins with query patterns rather than entities in distributed systems."

| Category | SQL | NoSQL |
| --- | --- | --- |
| Schema | Rigid | Flexible |
| Scaling | Vertical | Horizontal |
| ACID | Strong | Tunable |`,
    expectedStatus: 'complete',
  },

  {
    id: 'unicode-rtl',
    title: '10. Unicode & RTL Text (Arabic / Hebrew)',
    description: 'Right-to-Left Arabic and Hebrew mixed with English, verifying directional stability.',
    category: 'formats',
    rawPayload: `User:
ترجم هذه العبارة إلى الإنجليزية: مرحباً بك في العالم الرقمي.

Assistant:
الترجمة الدقيقة هي:
"Welcome to the digital world."

וגם בעברית:
שלום וברוכים הבאים לעולם הדיגיטלי.`,
    expectedStatus: 'complete',
  },

  {
    id: 'citations-references',
    title: '11. Citations & Footnotes',
    description: 'Source citations with superscript brackets and URLs.',
    category: 'formats',
    rawPayload: `User:
What is the latest James Webb Space Telescope discovery?

Assistant:
JWST observed the most distant galaxy candidate identified to date [1], confirming early star cluster formation within 300 million years of the Big Bang [2].

Citations:
[1] https://nasa.gov/jwst-deep-field
[2] https://esa.int/science/jwst-cosmic-dawn`,
    expectedStatus: 'complete',
  },

  {
    id: 'artifacts-source',
    title: '12. Claude Artifact Source Code',
    description: 'Interactive artifact source extracted cleanly as static code.',
    category: 'formats',
    rawPayload: `User:
Create a React counter component.

Assistant:
Here is the component artifact:

<antArtifact identifier="counter-component" type="application/vnd.ant.react" title="Counter.tsx">
import React, { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>;
}
</antArtifact>`,
    expectedStatus: 'complete',
  },

  {
    id: 'images-attachments',
    title: '13. Images & Attachment References',
    description: 'Simulated prompt with image references, testing honest platform limitations.',
    category: 'edge_cases',
    rawPayload: `<div class="conversation">
  <div class="user-query">
    <img src="https://example.com/uploaded_chart.png" alt="Sales Chart" />
    <p>Analyze this quarter sales chart.</p>
  </div>
  <div class="model-response">
    <p>The chart indicates a 14% growth in Q3 recurring revenue.</p>
  </div>
</div>`,
    expectedStatus: 'partial',
  },

  {
    id: 'malicious-html-xss',
    title: '14. Malicious HTML & Script Injection',
    description: 'Attacker payload with <script> and onerror= handlers, verifying strict sanitization.',
    category: 'security',
    rawPayload: `<div class="chat-turn">
  <script>window.__xss_leaked = true;</script>
  <img src="invalid-image" onerror="alert('xss')" />
  <p>User: Legitimate prompt message.</p>
  <a href="javascript:alert(1)">Click for bonus</a>
  <p>Assistant: Safe response with sanitized markdown.</p>
</div>`,
    expectedStatus: 'complete',
  },

  {
    id: 'expired-private-link',
    title: '15. Expired or Private Share Link',
    description: 'Simulates a 404 deleted or private share link response.',
    category: 'edge_cases',
    rawPayload: `<!DOCTYPE html><html><body><h1>404 Not Found</h1><p>This shared conversation has been deleted or set to private.</p></body></html>`,
    expectedStatus: 'error',
  },

  {
    id: 'live-claude-sample',
    title: '16. Live Claude Link Test URL',
    description: 'Tests URL resolution for https://claude.ai/share/767b0a62-e721-49bd-85b0-2e0676166874',
    category: 'core',
    rawPayload: `https://claude.ai/share/767b0a62-e721-49bd-85b0-2e0676166874`,
    expectedStatus: 'complete',
  },
];
