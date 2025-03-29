import { NextResponse } from 'next/server';

export function middleware(request) {
  // Get the response
  const response = NextResponse.next();
  
  // Add CORS headers to the response
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}

export const config = {
  matcher: '/api/:path*',
};