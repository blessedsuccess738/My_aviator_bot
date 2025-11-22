import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userDetails = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
        subscriptionExpiresAt: true,
        createdAt: true,
        lastLogin: true,
        emailVerified: true,
        _count: {
          select: {
            casinoLinks: true,
            crashRounds: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: userDetails
    })

  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get user info' },
      { status: 500 }
    )
  }
}