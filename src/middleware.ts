import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // L'utilisateur est authentifié ici
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Routes publiques (pas besoin d'auth)
        const publicRoutes = [
          '/login',
          '/register',
          '/forgot-password',
          '/book',
          '/api/auth',
          '/api/bookings/public',
        ];

        const isPublicRoute = publicRoutes.some((route) =>
          pathname.startsWith(route)
        );

        if (isPublicRoute) return true;

        // Routes API publiques
        if (pathname.startsWith('/api/auth')) return true;

        // Toutes les autres routes nécessitent une authentification
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, manifest, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)',
  ],
};
