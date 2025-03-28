import { NextResponse } from "next/server"
import { Redis } from "@upstash/redis"

// Initialize Redis client using environment variables
const redis = Redis.fromEnv()

export async function POST(request) {
  try {
    // Parse the request body
    const body = await request.json()
    const { name, score, timestamp } = body

    console.log("Received score submission:", { name, score, timestamp })

    // Validate required fields
    if (!name || score === undefined) {
      console.log("Missing required fields")
      return NextResponse.json(
        { success: false, error: "Name and score are required" },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        },
      )
    }

    // Sanitize name and validate score
    const sanitizedName = name.trim().substring(0, 50)
    const numericScore = Number.parseInt(String(score), 10)

    if (isNaN(numericScore) || numericScore < 0) {
      console.log("Invalid score value")
      return NextResponse.json(
        { success: false, error: "Score must be a positive number" },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        },
      )
    }

    // Check if user already exists and only update if new score is higher
    const existingData = await redis.hget("scores", sanitizedName)
    let shouldUpdate = true

    if (existingData) {
      try {
        const existingUser = typeof existingData === "string" ? JSON.parse(existingData) : existingData
        if (existingUser.score >= numericScore) {
          shouldUpdate = false
          console.log("Existing score is higher, not updating")
        }
      } catch (err) {
        console.error("Error parsing existing user data:", err)
        // Continue with update if we can't parse existing data
      }
    }

    if (shouldUpdate) {
      // Store the score in Redis
      const userData = {
        score: numericScore,
        timestamp: timestamp || new Date().toISOString(),
      }

      console.log(`Storing score for ${sanitizedName}:`, userData)

      await redis.hset("scores", {
        [sanitizedName]: JSON.stringify(userData),
      })

      console.log("Score saved successfully")
    }

    return NextResponse.json(
      {
        success: true,
        message: shouldUpdate ? "Score saved successfully" : "Existing score is higher",
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      },
    )
  } catch (error) {
    console.error("Error saving score:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save score",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
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
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    },
  )
}

