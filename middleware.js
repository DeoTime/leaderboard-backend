import { NextResponse } from 'next/server';

export function middleware(request) {
  // Get the origin from the request headers
  const origin = request.headers.get('origin') || '*';
  
  // Define the response
  const response = NextResponse.next();
  
  // Add CORS headers to the response
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  
  return response;
}

// Only apply this middleware to API routes
export const config = {
  matcher: '/api/:path*',
};