import { NextResponse } from 'next/server'

// Check if Clerk is properly configured
const isClerkConfigured = () => {
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const secretKey = process.env.CLERK_SECRET_KEY;
    return !!(publishableKey && secretKey && publishableKey.startsWith('pk_'));
}

export default async function middleware(req) {
    // If Clerk is not configured, handle based on environment
    if (!isClerkConfigured()) {
        const pathname = req.nextUrl.pathname;
        const isPublicPath = pathname === '/' || 
                            pathname.startsWith('/sign-in') || 
                            pathname.startsWith('/sign-up') ||
                            pathname.startsWith('/api/inngest');
        
        // In production, fail closed: only allow public routes
        if (process.env.NODE_ENV === 'production') {
            if (isPublicPath) {
                console.warn('Clerk is not configured in production. Public route allowed.');
                return NextResponse.next();
            }
            return new NextResponse('Authentication is not configured', { status: 503 });
        }
        
        // In development, allow all requests with a warning
        if (pathname === '/') {
            console.warn('Clerk is not configured. Authentication is disabled in development.');
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
                    // In development, allow requests to pass through for testing
                    // In production, redirect to sign-in
                    if (process.env.NODE_ENV === 'production') {
                        return NextResponse.redirect(new URL('/sign-in', req.url));
                    }
                    console.warn('Development mode: allowing request despite auth error');
                    return NextResponse.next();
                }
            }
        })(req);
    } catch (error) {
        console.error('Error loading Clerk middleware:', error.message);
        // If Clerk is configured but fails to load, fail closed in production
        if (process.env.NODE_ENV === 'production') {
            // Avoid redirect loops: allow auth pages to load
            const pathname = req.nextUrl.pathname;
            if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up') || pathname === '/') {
                return NextResponse.next();
            }
            // For protected routes, return 503 Service Unavailable
            return new NextResponse('Authentication service is temporarily unavailable', { status: 503 });
        }
        console.warn('Development mode: allowing request despite Clerk import failure');
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