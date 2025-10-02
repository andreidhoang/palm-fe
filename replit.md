# Perplexity AI Clone

## Overview
A full-stack Next.js 15 application that clones Perplexity AI functionality. This project uses:
- **Frontend**: Next.js 15 with App Router and React 18
- **Authentication**: Clerk for user authentication (optional - supports guest mode)
- **Database**: Supabase (PostgreSQL)
- **AI & Search**: Perplexity Sonar API for unified search and AI-generated answers with in-line citations
- **Streaming**: Real-time Server-Sent Events (SSE) for word-by-word answer display

## Project Structure
- `/app` - Next.js App Router pages and API routes
  - `/(auth)` - Authentication pages (sign-in, sign-up)
  - `/(routes)` - Main application pages (discover, library, search)
  - `/api` - Backend API routes
  - `/_components` - Shared app-level components
- `/components` - Reusable UI components (shadcn/ui)
- `/context` - React context providers
- `/services` - External service integrations (Supabase)
- `/lib` - Utility functions
- `/public` - Static assets

## Required Environment Variables
The application requires the following environment variables:

### Clerk Authentication
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key

### Supabase Database
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_KEY` - Supabase anon/public key

### External APIs
- `PERPLEXITY_API_KEY` - Perplexity API key for Sonar models (server-side, required)

## Development Setup
The project is configured to run on port 5000 with the command:
```bash
npm run dev -- -p 5000 -H 0.0.0.0
```

## Replit-Specific Configuration
- Development server listens on `0.0.0.0:5000` for Replit webview compatibility
- Webpack watch options are configured for the Replit environment (polling enabled)
- Next.js will show a warning about cross-origin requests in development mode, which is expected and safe for Replit's proxy environment

## Database Schema
The application uses three main Supabase tables:

### Users Table
- `id` - Serial primary key
- `name` - User's full name
- `email` - User's email (unique)
- `created_at` - Timestamp of user creation

### Library Table
- `id` - Serial primary key
- `libId` - Unique identifier for each search session
- `searchInput` - User's search query
- `userEmail` - Email of user who made the search
- `type` - Search type ('search' or 'research')
- `created_at` - Timestamp of search creation

### Chats Table
- `id` - Serial primary key
- `libId` - Foreign key to Library table
- `aiResp` - AI response text with in-line citations in markdown format (e.g., [1], [2])
- `searchResult` - JSONB array of citation sources from Perplexity API
- `userSearchInput` - The user's search query
- `userEmail` - Email of user who received the response
- `created_at` - Timestamp of response creation

## Recent Changes
- 2025-10-02: **Fixed duplicate message rendering bug**
  - Added React Strict Mode guard using useRef to prevent duplicate Chat record creation
  - Added database check to prevent duplicate Chats with same search query
  - Guard prevents GetSearchApiResult() from firing twice on initial page load
  - Guard resets when navigating to different searches (different libId)
  - Double-layer protection ensures single Perplexity API call per search
  - Fixed React markdown `ordered` attribute console error by filtering non-boolean props
- 2025-10-02: **Implemented conversation thread feature**
  - Changed display to show ALL conversation messages stacked vertically (previously only showed most recent)
  - Follow-up input box now works exactly like home page search box
  - Each question/answer pair displays with its own Answer/Images/Sources tabs
  - Added conversation counter showing "1 of 3", "2 of 3", etc. to track position in thread
  - Fixed "signal is aborted without reason" runtime error by wrapping abort() calls in try-catch
  - Users can now have multi-turn conversations with full context history visible
- 2025-10-02: **Fixed Sources and Images tabs rendering**
  - Added safety checks to SourceListTab component for empty/missing data
  - Sources now display with clickable links and hover effects
  - Images handled entirely in UI state (not persisted to database due to Supabase schema cache)
  - Both tabs show helpful "No sources/images available" messages when empty
- 2025-10-01: **Fixed answer display and streaming errors**
  - Fixed "No search input provided" error on initial page load by properly handling empty strings with `.trim()`
  - Changed validation from `??` operator to `(userInput && userInput.trim()) || fallback` to handle empty strings correctly
  - Added missing `userEmail` field to Chat record creation with `guest@example.com` fallback
  - Removed non-existent `images` field from database updates (Chats table only has `aiResp` and `searchResult`)
  - Added `GetSearchRecords()` call after database update to refresh UI state with new answer
  - Fixed "Controller is already closed" streaming error by wrapping final enqueue/close calls in try-catch
  - Removed all debug console.log statements, keeping only console.error/warn for error reporting
- 2025-10-01: **Fixed Perplexity API error** - Resolved "Bad Request" error caused by race condition
  - Fixed race condition where userInput was cleared before being passed to API
  - Added input validation to prevent empty search queries
  - Added server-side validation in API route to reject invalid requests
  - All streaming functionality now working correctly
- 2025-10-01: **Removed redundant APIs** - Cleaned up codebase by removing obsolete Tavily, Inngest, and Gemini integrations
  - Deleted `/api/brave-search-api`, `/api/llm-model`, `/api/inngest`, `/api/get-inngest-status`, `/api/llm-stream` routes
  - Removed `inngest/` directory and all Inngest workflow code
  - Uninstalled unused packages: `inngest`, `@google/generative-ai`
  - Updated middleware to remove obsolete route references
  - Perplexity Sonar API remains as the sole search and AI provider
- 2025-10-01: **Integrated Perplexity Sonar API** - Replaced Tavily + Gemini architecture with unified Perplexity Sonar models
  - Single API call handles both search and AI answer generation
  - Real-time streaming with Server-Sent Events (SSE) for word-by-word display
  - In-line citations in format [1], [2] that link directly to sources
  - Custom citation rendering with clickable superscripts
  - Created `/api/perplexity-search` endpoint with robust SSE parsing and error handling
  - AbortController for proper request cancellation and cleanup
- 2025-10-01: Fixed duplicate answer sections - now displays only the most recent chat conversation
- 2025-10-01: Fixed sources and images display - properly transformed Perplexity data structures to match UI components
- 2025-10-01: Added graceful error handling for missing API keys and services
- 2025-09-30: Initial Replit setup, configured Next.js for Replit proxy, set up workflow
- 2025-09-30: Implemented comprehensive error handling across all layers (middleware, API routes, database)
- 2025-09-30: Created database schema with Users, Library, and Chats tables for full functionality
- 2025-09-30: Added production security: server-side API keys, fail-closed authentication, proper error responses
