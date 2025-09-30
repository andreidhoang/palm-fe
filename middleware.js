import { NextResponse } from 'next/server'

// Check if Clerk is properly configured
const isClerkConfigured = () => {
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const secretKey = process.env.CLERK_SECRET_KEY;
    return !!(publishableKey && secretKey && publishableKey.startsWith('pk_'));
}

export default async function middleware(req) {
    // If Clerk is not configured, allow all requests to pass through
    if (!isClerkConfigured()) {
        if (req.nextUrl.pathname === '/') {
            console.warn('Clerk is not properly configured. Authentication is disabled.');
        }
        return NextResponse.next();
    }

    // Only load clerkMiddleware if Clerk is properly configured
    try {
        const { clerkMiddleware, createRouteMatcher } = await import('@clerk/nextjs/server');
        
        const isPublicRoute = createRouteMatcher([
            '/sign-in(.*)',
            '/sign-up(.*)',
            '/',
            '/api/inngest'
        ]);

        return clerkMiddleware(async (auth, req) => {
            if (!isPublicRoute(req)) {
                try {
                    await auth.protect()
                } catch (error) {
                    console.error('Clerk auth error:', error.message);
                    return NextResponse.next();
                }
            }
        })(req);
    } catch (error) {
        console.error('Error loading Clerk middleware:', error.message);
        return NextResponse.next();
    }
}

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
}