import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import { SpeedInsights } from "@vercel/speed-insights/next"

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// POST handler to add a new score
export async function POST(request) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate the input
    if (!body.name || typeof body.name !== 'string' || body.name.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Invalid name' },
        { status: 400 }
      );
    }
    
    if (isNaN(body.score) || body.score < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid score' },
        { status: 400 }
      );
    }
    
    // Create a user data object
    const userData = {
      username: body.name.trim(),
      timestamp: body.timestamp || new Date().toISOString(),
      avatarUrl: body.avatarUrl || null
    };
    
    // Store in Redis sorted set (scores as the key, score as the sort value)
    // This automatically maintains the leaderboard order
    await redis.zadd('scores', {
      score: Math.floor(body.score),
      member: JSON.stringify(userData)
    });
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Score submitted successfully' 
    });
    
  } catch (error) {
    console.error('Error processing score submission:', error);
    return NextResponse.json(
      { success: false, error: 'Server error processing request' },
      { status: 500 }
    );
  }
}