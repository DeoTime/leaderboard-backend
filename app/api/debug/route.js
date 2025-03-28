import { NextResponse } from "next/server"
import { Redis } from "@upstash/redis"

// Initialize Redis client using environment variables
const redis = Redis.fromEnv()

export async function GET() {
  try {
    // Test Redis connection
    const pingResult = await redis.ping()

    // Get all keys to understand what data we have
    const keys = await redis.keys("*")

    // Get the scores data if it exists
    let scoresData = null
    if (keys.includes("scores")) {
      scoresData = await redis.hgetall("scores")
    }

    // Return diagnostic information
    return NextResponse.json(
      {
        status: "ok",
        redis_connection: pingResult === "PONG" ? "successful" : "failed",
        available_keys: keys,
        scores_data: scoresData,
        environment: {
          redis_url_set: !!process.env.UPSTASH_REDIS_REST_URL,
          redis_token_set: !!process.env.UPSTASH_REDIS_REST_TOKEN,
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
    console.error("Diagnostic error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : null,
        environment: {
          redis_url_set: !!process.env.UPSTASH_REDIS_REST_URL,
          redis_token_set: !!process.env.UPSTASH_REDIS_REST_TOKEN,
          node_env: process.env.NODE_ENV,
        },
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

