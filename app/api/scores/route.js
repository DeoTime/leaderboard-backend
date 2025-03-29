import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function POST(request) {
  try {
    // Parse the request body
    const body = await request.json();

    // Validate the input
    if (!body.name || typeof body.name !== "string" || body.name.length > 50) {
      return NextResponse.json({ success: false, error: "Invalid name" }, { status: 400 });
    }

    if (isNaN(body.score) || body.score < 0) {
      return NextResponse.json({ success: false, error: "Invalid score" }, { status: 400 });
    }

    // Create a new score entry
    const userData = {
      username: body.name.trim(),
      timestamp: body.timestamp || new Date().toISOString()
    };

    // Add to Redis sorted set
    await redis.zadd('scores', {
      score: Math.floor(body.score),
      member: JSON.stringify(userData)
    });

    // If it's within the last week, also add to weekly scores
    const now = new Date();
    const timestamp = body.timestamp ? new Date(body.timestamp) : now;
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    if (timestamp >= oneWeekAgo) {
      await redis.zadd('weekly_scores', {
        score: Math.floor(body.score),
        member: JSON.stringify(userData)
      });
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Score submitted successfully",
    });
  } catch (error) {
    console.error("Error processing score submission:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Server error processing request",
        details: error.message
      },
      { status: 500 },
    );
  }
}