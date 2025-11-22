import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { v4 as uuidv4 } from 'uuid'

const createLinkSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  fetchFrequency: z.number().min(1).max(1440).default(60), // minutes
})

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const links = await prisma.casinoLink.findMany({
      where: { userId: user.userId },
      include: {
        _count: {
          select: {
            crashRounds: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: links
    })

  } catch (error) {
    console.error('Get links error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get links' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, url, fetchFrequency } = createLinkSchema.parse(body)

    // Check subscription limits
    const linkCount = await prisma.casinoLink.count({
      where: { userId: user.userId }
    })

    if (user.subscriptionTier === 'free' && linkCount >= 1) {
      return NextResponse.json(
        { success: false, error: 'Free tier limited to 1 casino link' },
        { status: 403 }
      )
    }

    if (user.subscriptionTier === 'premium' && linkCount >= 10) {
      return NextResponse.json(
        { success: false, error: 'Premium tier limited to 10 casino links' },
        { status: 403 }
      )
    }

    const link = await prisma.casinoLink.create({
      data: {
        userId: user.userId,
        name,
        url,
        fetchFrequency,
      }
    })

    return NextResponse.json({
      success: true,
      data: link
    })

  } catch (error) {
    console.error('Create link error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create link' },
      { status: 500 }
    )
  }
}