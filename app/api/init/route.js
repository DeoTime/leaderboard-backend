import { NextResponse } from "next/server"
import { Redis } from "@upstash/redis"

// Initialize Redis client using environment variables
const redis = Redis.fromEnv()

export async function GET() {
  try {
    // Check if scores already exist
    const existingScores = await redis.hgetall("scores")

    if (existingScores && Object.keys(existingScores).length > 0) {
      return NextResponse.json({
        status: "skipped",
        message: "Scores already exist in the database",
        existing_data: existingScores,
      })
    }

    // Sample data to initialize the leaderboard
    const sampleScores = {
      MathWizard: JSON.stringify({
        score: 950,
        timestamp: new Date().toISOString(),
      }),
      NumberNinja: JSON.stringify({
        score: 820,
        timestamp: new Date().toISOString(),
      }),
      AlgebraAce: JSON.stringify({
        score: 750,
        timestamp: new Date().toISOString(),
      }),
      CalculusKing: JSON.stringify({
        score: 680,
        timestamp: new Date().toISOString(),
      }),
      GeometryGuru: JSON.stringify({
        score: 610,
        timestamp: new Date().toISOString(),
      }),
    }

    // Store sample data in Redis
    await redis.hset("scores", sampleScores)

    return NextResponse.json({
      status: "success",
      message: "Sample data initialized successfully",
      data: sampleScores,
    })
  } catch (error) {
    console.error("Error initializing sample data:", error)
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : null,
      },
      { status: 500 },
    )
  }
}

