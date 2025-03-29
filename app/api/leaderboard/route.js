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
    let scores = [];
    
    try {
      // Use different keys based on timeFrame
      const redisKey = timeFrame === 'weekly' ? 'weekly_scores' : 'scores';
      scores = await redis.zrange(redisKey, 0, -1, { withScores: true, rev: true });
      
      // If scores is undefined or not an array, initialize it as an empty array
      if (!scores || !Array.isArray(scores)) {
        console.log('No scores found or invalid response from Redis');
        scores = [];
      }
    } catch (redisError) {
      console.error('Redis error:', redisError);
      scores = [];
    }
    
    // Convert the scores to a more usable format
    let contributors = [];
    
    // Only process if we have scores and they're in the expected format
    if (scores.length > 0) {
      for (let i = 0; i < scores.length; i += 2) {
        try {
          // Handle both string and object formats
          let userData;
          if (typeof scores[i] === 'string') {
            try {
              userData = JSON.parse(scores[i]);
            } catch (e) {
              // If it's not valid JSON, use it as a username
              userData = { username: scores[i] };
            }
          } else {
            userData = scores[i];
          }
          
          contributors.push({
            username: userData.username || 'Anonymous',
            score: parseInt(scores[i + 1] || 0),
            date: userData.timestamp || new Date().toISOString(),
            avatarUrl: userData.avatarUrl || null
          });
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
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