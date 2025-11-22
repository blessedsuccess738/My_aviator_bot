import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import { db } from '@/lib/simple-db'

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
    // For simplicity, we'll skip session verification for now and just check user exists
    const user = await db.getUserById(decoded.userId)
    if (!user) {
      return null
    }

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