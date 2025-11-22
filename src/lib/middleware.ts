import { NextRequest } from 'next/server'
import { verifyToken } from './jwt'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string
    email: string
  }
}

export async function authenticate(request: NextRequest): Promise<{ user: { userId: string; email: string } } | null> {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)

    return {
      user: {
        userId: payload.userId,
        email: payload.email
      }
    }
  } catch (error) {
    return null
  }
}