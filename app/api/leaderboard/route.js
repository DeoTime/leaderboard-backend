import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import { SpeedInsights } from "@vercel/speed-insights/next"

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
    scores = scores.map((item, index) => {
      // Redis returns [member1, score1, member2, score2, ...]
      if (index % 2 === 0) {
        const userData = JSON.parse(item);
        return {
          username: userData.username,
          score: parseInt(scores[index + 1]),
          timestamp: userData.timestamp,
          avatarUrl: userData.avatarUrl || null
        };
      }
      return null;
    }).filter(Boolean); // Remove null entries
    
    // Filter for weekly scores if needed
    if (timeFrame === 'weekly') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      scores = scores.filter(entry => {
        return new Date(entry.timestamp) >= oneWeekAgo;
      });
    }
    
    // Return the formatted leaderboard
    return NextResponse.json({
      leaderboard: {
        title: "Math Quiz Leaderboard",
        lastUpdated: new Date().toISOString(),
        contributors: scores
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}