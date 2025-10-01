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
- 2025-10-01: **Integrated Perplexity Sonar API** - Replaced Tavily + Gemini architecture with unified Perplexity Sonar models
  - Single API call handles both search and AI answer generation
  - Real-time streaming with Server-Sent Events (SSE) for word-by-word display
  - In-line citations in format [1], [2] that link directly to sources
  - Custom citation rendering with clickable superscripts
  - Removed Inngest workflow (no longer needed with direct streaming)
  - Created `/api/perplexity-search` endpoint with robust SSE parsing and error handling
  - AbortController for proper request cancellation and cleanup
- 2025-10-01: Fixed duplicate answer sections - now displays only the most recent chat conversation
- 2025-10-01: Added graceful error handling for missing API keys and services
- 2025-09-30: Initial Replit setup, configured Next.js for Replit proxy, set up workflow
- 2025-09-30: Implemented comprehensive error handling across all layers (middleware, API routes, database)
- 2025-09-30: Created database schema with Users, Library, and Chats tables for full functionality
- 2025-09-30: Added production security: server-side API keys, fail-closed authentication, proper error responses
