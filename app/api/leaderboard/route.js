import { NextResponse } from "next/server"
import { Redis } from "@upstash/redis"

// Initialize Redis client using environment variables
const redis = Redis.fromEnv()

export async function GET(request) {
  try {
    // Get the timeFrame from query parameters
    const { searchParams } = new URL(request.url)
    const timeFrame = searchParams.get("timeFrame") || "allTime"

    console.log(`Fetching leaderboard data for timeFrame: ${timeFrame}`)

    // Fetch all scores from Redis
    const allScores = (await redis.hgetall("scores")) || {}

    console.log(`Retrieved scores data:`, allScores)

    // If no scores exist yet, initialize with sample data
    if (!allScores || Object.keys(allScores).length === 0) {
      console.log("No scores found, returning sample data")

      // Sample data for testing
      const sampleData = {
        leaderboard: {
          contributors: [
            {
              username: "SampleUser1",
              score: 950,
              date: new Date().toISOString(),
              avatarUrl: null,
            },
            {
              username: "SampleUser2",
              score: 820,
              date: new Date().toISOString(),
              avatarUrl: null,
            },
            {
              username: "SampleUser3",
              score: 750,
              date: new Date().toISOString(),
              avatarUrl: null,
            },
          ],
        },
      }

      return NextResponse.json(sampleData, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      })
    }

    // Convert to array of objects
    const contributors = Object.entries(allScores).map(([username, data]) => {
      try {
        const userData = typeof data === "string" ? JSON.parse(data) : data
        return {
          username,
          score: Number(userData.score) || 0,
          date: userData.timestamp || new Date().toISOString(),
          avatarUrl: userData.avatarUrl || null,
        }
      } catch (err) {
        console.error(`Error parsing data for user ${username}:`, err)
        return {
          username,
          score: 0,
          date: new Date().toISOString(),
          avatarUrl: null,
        }
      }
    })

    // Filter for weekly scores if needed
    let filteredContributors = [...contributors]
    if (timeFrame === "weekly") {
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

      filteredContributors = contributors.filter((entry) => {
        if (!entry.date) return true
        return new Date(entry.date) >= oneWeekAgo
      })
    }

    // Sort by score (highest first)
    filteredContributors.sort((a, b) => b.score - a.score)

    console.log(`Returning ${filteredContributors.length} leaderboard entries`)

    // Return formatted response
    return NextResponse.json(
      {
        leaderboard: {
          contributors: filteredContributors,
        },
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      },
    )
  } catch (error) {
    console.error("Error fetching leaderboard data:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch leaderboard data",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : null,
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      },
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    },
  )
}

