# Perplexity API Response Data Models

## 1. Raw Perplexity API Streaming Response

### SSE (Server-Sent Events) Format
The Perplexity API streams data in chunks using SSE protocol:

```
data: {"id": "...", "choices": [{"delta": {"content": "AI"}}]}
data: {"id": "...", "choices": [{"delta": {"content": " stands"}}]}
data: [DONE]
```

### Streaming Chunk Structure
```typescript
{
  id: string,                          // Unique response ID
  model: string,                       // "sonar", "sonar-pro", etc.
  object: "chat.completion.chunk",
  created: number,                     // Unix timestamp
  choices: [
    {
      index: number,
      delta: {
        role?: "assistant",
        content?: string               // Incremental content
      },
      finish_reason?: "stop" | null    // "stop" on final chunk
    }
  ]
}
```

### Final Message Structure (when finish_reason = "stop")
```typescript
{
  id: string,
  model: string,
  object: "chat.completion.chunk",
  created: number,
  choices: [
    {
      index: number,
      message: {
        role: "assistant",
        content: string,                // Full accumulated text
        citations?: string[],           // Array of URLs
        images?: string[]               // Array of image URLs
      },
      finish_reason: "stop"
    }
  ],
  usage: {
    prompt_tokens: number,
    completion_tokens: number,
    total_tokens: number
  }
}
```

## 2. Our API Route Transformed Response

### `/api/perplexity-search` SSE Events

Our API route transforms Perplexity's response into custom SSE events:

#### Event 1: Content Chunks (streamed in real-time)
```typescript
{
  type: "content",
  text: string                         // Incremental content chunk
}
```

#### Event 2: Citations (sent after streaming completes)
```typescript
{
  type: "citations",
  citations: string[]                  // Raw URLs from Perplexity
}

// Example:
{
  type: "citations",
  citations: [
    "https://en.wikipedia.org/wiki/Artificial_intelligence",
    "https://www.ibm.com/topics/artificial-intelligence",
    "https://www.technologyreview.com/ai/"
  ]
}
```

#### Event 3: Images (sent after streaming completes)
```typescript
{
  type: "images",
  images: string[]                     // Array of image URLs
}

// Example:
{
  type: "images",
  images: [
    "https://example.com/ai-brain.jpg",
    "https://example.com/neural-network.png"
  ]
}
```

#### Event 4: Done (final event)
```typescript
{
  type: "done",
  fullText: string,                    // Complete accumulated text
  citations: string[],                 // All citations
  images: string[],                    // All images
  recordId: number                     // Database record ID
}
```

#### Event 5: Error (if something goes wrong)
```typescript
{
  type: "error",
  error: string                        // Error message
}
```

## 3. Frontend Data Models

### Transformed Citations for UI Components
Our frontend transforms raw URL citations into rich objects:

```typescript
{
  url: string,                         // Original URL
  title: string,                       // Citation title or URL
  long_name: string,                   // Domain name or title
  img: string                          // Favicon URL
}

// Example:
{
  url: "https://en.wikipedia.org/wiki/Artificial_intelligence",
  title: "Artificial intelligence - Wikipedia",
  long_name: "en.wikipedia.org",
  img: "https://www.google.com/s2/favicons?domain=en.wikipedia.org&sz=128"
}
```

### Transformed Images for UI Components
```typescript
{
  original: string,                    // Image URL
  title: string                        // Image description or "Image"
}

// Example:
{
  original: "https://example.com/ai-brain.jpg",
  title: "AI Brain Illustration"
}
```

### Complete Chat Object (stored in state)
```typescript
{
  id: number,                          // Database ID
  libId: string,                       // Library UUID
  aiResp: string,                      // AI response with citations [1][2]
  searchResult: Array<{                // Formatted citations
    url: string,
    title: string,
    long_name: string,
    img: string
  }>,
  images: Array<{                      // Formatted images
    original: string,
    title: string
  }>,
  citations: string[],                 // Raw citation URLs
  userSearchInput: string,             // User's query
  userEmail: string,                   // User email
  created_at: string                   // ISO timestamp
}
```

## 4. Database Schema (Supabase)

### Chats Table
```sql
CREATE TABLE "Chats" (
  id SERIAL PRIMARY KEY,
  "libId" VARCHAR NOT NULL,            -- Foreign key to Library
  "aiResp" TEXT,                       -- AI answer with [1][2] citations
  "searchResult" JSONB,                -- Array of citation objects
  "images" JSONB,                      -- Array of image objects
  "userSearchInput" VARCHAR,           -- User's search query
  "userEmail" VARCHAR,                 -- User's email
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Library Table
```sql
CREATE TABLE "Library" (
  id SERIAL PRIMARY KEY,
  "libId" VARCHAR UNIQUE NOT NULL,     -- UUID
  "searchInput" VARCHAR,               -- User's query
  "userEmail" VARCHAR,                 -- User's email
  type VARCHAR,                        -- "search" or "research"
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 5. Citation Format in AI Response

The AI response text includes inline citations that link to the sources:

```markdown
Artificial Intelligence (AI) refers to computer systems designed to perform tasks 
that typically require human intelligence[1]. These systems can learn from 
experience, adjust to new inputs, and perform human-like tasks[2].

Machine learning is a subset of AI that enables systems to automatically learn 
and improve from experience without being explicitly programmed[3].
```

Where:
- `[1]` links to `searchResult[0].url`
- `[2]` links to `searchResult[1].url`
- `[3]` links to `searchResult[2].url`

## 6. Data Flow Diagram

```
User Query
    ↓
Frontend (DisplayResult.jsx)
    ↓ POST {searchInput, recordId}
API Route (/api/perplexity-search)
    ↓ Stream request
Perplexity API (sonar model)
    ↓ SSE chunks
API Route (transforms & re-streams)
    ↓ Custom SSE events
Frontend (receives & displays)
    ↓ Updates React state
UI Components (AnswerDisplay, SourceListTab, ImageListTab)
    ↓ Save to database
Supabase (Chats table)
```

## 7. Key Implementation Details

### Race Condition Prevention
```typescript
// Capture search input BEFORE clearing state
const searchQuery = userInput ?? searchInputRecord?.searchInput;

// Validation
if (!searchQuery) {
  console.error('No search input provided');
  return;
}

// Use captured value (not cleared state)
await StreamPerplexitySearch(searchQuery, data[0].id);
```

### Server-Side Validation
```typescript
// API route validates before calling Perplexity
if (!searchInput || typeof searchInput !== 'string' || searchInput.trim() === '') {
  return NextResponse.json(
    { error: 'Search input is required and must be a non-empty string' },
    { status: 400 }
  );
}
```

### Citation Rendering
Citations are rendered as clickable superscript numbers using regex:
```typescript
// Transforms [1] into clickable superscript
text.replace(/\[(\d+)\]/g, (match, number) => 
  `<sup class="citation">[${number}]</sup>`
)
```
