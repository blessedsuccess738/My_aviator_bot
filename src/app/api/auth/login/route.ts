import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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
      ({ email, password } = loginSchema.parse(body))
    } catch (validationError: any) {
      return NextResponse.json(
        { success: false, error: validationError.errors?.[0]?.message || 'Invalid input data' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
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
    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: await bcrypt.hash(refreshToken, 12),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }
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

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    )
  }
}