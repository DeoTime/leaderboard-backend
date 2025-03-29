import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// GET handler to retrieve leaderboard data
export async function GET(request) {
  try {
    // Get the time frame from the URL query parameters
    const { searchParams } = new URL(request.url);
    const timeFrame = searchParams.get('timeFrame') || 'allTime';
    
    // Get all scores from Redis
    let scores = await redis.zrange('scores', 0, -1, { withScores: true, rev: true });
    
    // Convert the scores to a more usable format
    let contributors = [];
    
    for (let i = 0; i < scores.length; i += 2) {
      try {
        const userData = JSON.parse(scores[i]);
        contributors.push({
          username: userData.username,
          score: parseInt(scores[i + 1]),
          timestamp: userData.timestamp,
          avatarUrl: userData.avatarUrl || null
        });
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    
    // Return the formatted leaderboard
    return NextResponse.json({
      leaderboard: {
        title: "Math Quiz Leaderboard",
        lastUpdated: new Date().toISOString(),
        contributors: contributors
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { 
        leaderboard: {
          title: "Math Quiz Leaderboard",
          lastUpdated: new Date().toISOString(),
          contributors: []
        }
      },
      { status: 200 }
    );
  }
}