// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
    const token = await getToken({ req: request });
    const url = request.nextUrl;

    if (!token) {
        if (
            url.pathname.startsWith('/dashboard') ||
            url.pathname.startsWith('/profile')
        ) {
            return NextResponse.redirect(new URL('/sign-in', request.url));
        }
    }

    if (token && url.pathname === '/dashboard') {
        return NextResponse.next();
    }

    if (token &&
        (
            url.pathname.startsWith('/sign-in') ||
            url.pathname.startsWith('/sign-up') ||
            url.pathname.startsWith('/verify') ||
            url.pathname === '/'
        )
    ) {
        console.log('Redirecting to /dashboard');
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: [
        '/sign-in',
        '/sign-up',
        '/',
        '/dashboard/:path*',
        '/verify/:path*',
        '/profile/:path*'
    ]
};
