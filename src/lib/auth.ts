import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

export interface AuthUser {
  userId: string
  email: string
  subscriptionTier: string
}

export async function verifyAuth(request: NextRequest): Promise<AuthUser | null> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    // Verify session exists and is valid
    const session = await prisma.session.findFirst({
      where: {
        userId: decoded.userId,
        expiresAt: {
          gt: new Date()
        }
      }
    })

    if (!session) {
      return null
    }

    // Update last used
    await prisma.session.update({
      where: { id: session.id },
      data: { lastUsed: new Date() }
    })

    return {
      userId: decoded.userId,
      email: decoded.email,
      subscriptionTier: decoded.subscriptionTier
    }
  } catch (error) {
    console.error('Auth verification error:', error)
    return null
  }
}

export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await verifyAuth(request)
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

export async function requirePremium(request: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(request)
  if (user.subscriptionTier !== 'premium') {
    throw new Error('Premium subscription required')
  }
  return user
}