import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Initialize Redis client
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    // Test Redis connection
    await redis.set('test-key', 'Hello from Redis!');
    const value = await redis.get('test-key');
    
    // Add a test score
    const testScore = {
      username: "TestUser",
      timestamp: new Date().toISOString()
    };
    
    await redis.zadd('scores', {
      score: 500,
      member: JSON.stringify(testScore)
    });
    
    return NextResponse.json({
      success: true,
      message: 'Redis connection successful',
      testValue: value,
      scoreAdded: true
    });
  } catch (error) {
    console.error('Redis test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}