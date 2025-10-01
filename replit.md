# Perplexity AI Clone

## Overview
A full-stack Next.js 15 application that clones Perplexity AI functionality. This project uses:
- **Frontend**: Next.js 15 with App Router and React 18
- **Authentication**: Clerk for user authentication (optional - supports guest mode)
- **Database**: Supabase (PostgreSQL)
- **Background Jobs**: Inngest for async task processing
- **AI**: Google Gemini API for content generation
- **Search**: Tavily API for AI-optimized web search (better than traditional search APIs for LLM applications)

## Project Structure
- `/app` - Next.js App Router pages and API routes
  - `/(auth)` - Authentication pages (sign-in, sign-up)
  - `/(routes)` - Main application pages (discover, library, search)
  - `/api` - Backend API routes
  - `/_components` - Shared app-level components
- `/components` - Reusable UI components (shadcn/ui)
- `/context` - React context providers
- `/inngest` - Inngest background job functions
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
- `BRAVE_API_KEY` - Brave Search API key (server-side)
- `GEMINI_API_KEY` - Google Gemini API key (server-side, production)
- `NEXT_PUBLIC_GEMINI_API_KEY` - Google Gemini API key (client-side, development fallback)

### Inngest
- `INNGEST_EVENT_KEY` - (Optional) Inngest event key for production
- `INNGEST_SIGNING_KEY` - (Optional) Inngest signing key for production

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
- `aiResp` - AI response text (markdown format)
- `userEmail` - Email of user who received the response
- `created_at` - Timestamp of response creation

## Recent Changes
- 2025-10-01: **Implemented real-time streaming AI responses** - Replaced background job processing with Server-Sent Events (SSE) streaming for word-by-word answer display like Perplexity
  - Created `/api/llm-stream` endpoint using Google Gemini's streaming API
  - Robust SSE parsing with proper buffering and error handling
  - AbortController for request cancellation (prevents memory leaks)
  - Fixed duplicate answer sections - now displays only the most recent chat
- 2025-10-01: Replaced Brave Search API with Tavily API for better AI-optimized search results
- 2025-10-01: Set up Inngest Dev Server workflow for local AI response generation (now optional, streaming is primary method)
- 2025-10-01: Added graceful error handling for missing API keys and services
- 2025-09-30: Initial Replit setup, configured Next.js for Replit proxy, set up workflow
- 2025-09-30: Implemented comprehensive error handling across all layers (middleware, API routes, database, background jobs)
- 2025-09-30: Created database schema with Users, Library, and Chats tables for full functionality
- 2025-09-30: Added production security: server-side API keys, fail-closed authentication, proper error responses
