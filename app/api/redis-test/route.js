import { NextResponse } from "next/server"
import { Redis } from "@upstash/redis"

export async function GET() {
  try {
    // Step 1: Check if environment variables are set
    const envCheck = {
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ? "✓ Set" : "✗ Not set",
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ? "✓ Set" : "✗ Not set",
      UPSTASH_REDIS_REST_URL_VALUE: process.env.UPSTASH_REDIS_REST_URL
        ? `${process.env.UPSTASH_REDIS_REST_URL.substring(0, 15)}...`
        : "Not available",
      UPSTASH_REDIS_REST_TOKEN_VALUE: process.env.UPSTASH_REDIS_REST_TOKEN
        ? `${process.env.UPSTASH_REDIS_REST_TOKEN.substring(0, 15)}...`
        : "Not available",
    }

    // Step 2: Try to create Redis client
    let redisClientCreated = false
    let redis

    try {
      redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
      redisClientCreated = true
    } catch (error) {
      return NextResponse.json(
        {
          status: "error",
          step: "Redis client creation",
          message: error.message,
          env_check: envCheck,
        },
        { status: 500 },
      )
    }

    // Step 3: Try a simple ping
    let pingResult
    try {
      pingResult = await redis.ping()
    } catch (error) {
      return NextResponse.json(
        {
          status: "error",
          step: "Redis ping",
          message: error.message,
          env_check: envCheck,
          redis_client_created: redisClientCreated,
        },
        { status: 500 },
      )
    }

    // Step 4: Try to set a simple key-value
    try {
      await redis.set("test-key", "test-value")
    } catch (error) {
      return NextResponse.json(
        {
          status: "error",
          step: "Redis set operation",
          message: error.message,
          env_check: envCheck,
          redis_client_created: redisClientCreated,
          ping_result: pingResult,
        },
        { status: 500 },
      )
    }

    // Step 5: Try to get the key we just set
    let getValue
    try {
      getValue = await redis.get("test-key")
    } catch (error) {
      return NextResponse.json(
        {
          status: "error",
          step: "Redis get operation",
          message: error.message,
          env_check: envCheck,
          redis_client_created: redisClientCreated,
          ping_result: pingResult,
        },
        { status: 500 },
      )
    }

    // If we made it here, everything is working
    return NextResponse.json({
      status: "success",
      message: "Redis connection is working properly",
      env_check: envCheck,
      redis_client_created: redisClientCreated,
      ping_result: pingResult,
      get_result: getValue,
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        step: "Unknown",
        message: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

