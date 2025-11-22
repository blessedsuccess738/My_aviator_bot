import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/simple-db'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let { email, password } = body

    // Basic validation before Zod
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Zod validation
    try {
      ({ email, password } = registerSchema.parse(body))
    } catch (validationError: any) {
      return NextResponse.json(
        { success: false, error: validationError.errors?.[0]?.message || 'Invalid input data' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user
    const user = await db.createUser({
      email,
      passwordHash,
      subscriptionTier: 'free',
    })

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        subscriptionTier: user.subscriptionTier
      },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    )

    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    )

    // Store session
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12)
    await db.createSession({
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    })

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          subscriptionTier: user.subscriptionTier,
          createdAt: user.createdAt,
        },
        token,
        refreshToken,
      }
    })

  } catch (error: any) {
    console.error('Registration error:', error)

    // Handle specific errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'User already exists' },
        { status: 400 }
      )
    }

    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Registration failed' },
      { status: 500 }
    )
  }
}