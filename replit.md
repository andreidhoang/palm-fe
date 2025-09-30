# Perplexity AI Clone

## Overview
A full-stack Next.js 15 application that clones Perplexity AI functionality. This project uses:
- **Frontend**: Next.js 15 with App Router and React 18
- **Authentication**: Clerk for user authentication
- **Database**: Supabase (PostgreSQL)
- **Background Jobs**: Inngest for async task processing
- **AI**: Google Gemini API for content generation
- **Search**: Brave Search API for web search functionality

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
- `BRAVE_API_KEY` - Brave Search API key
- `NEXT_PUBLIC_GEMINI_API_KEY` - Google Gemini API key

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
The application uses a Supabase `Chats` table with at minimum:
- `id` - Primary key
- `aiResp` - AI response text (markdown)
- Other fields for storing search queries and results

## Recent Changes
- 2025-09-30: Initial Replit setup, configured Next.js for Replit proxy, set up workflow
