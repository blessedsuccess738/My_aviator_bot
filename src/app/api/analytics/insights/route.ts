import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { verifyAuth, requirePremium } from '@/lib/auth'
import { InsightEngine } from '@/lib/insights'

const insightsSchema = z.object({
  windowSize: z.enum(['10', '20', '50']).transform(Number),
})

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
    const { windowSize } = insightsSchema.parse(body)

    // Check subscription limits
    if (user.subscriptionTier === 'free' && windowSize > 20) {
      return NextResponse.json(
        { success: false, error: 'Premium subscription required for 50-round insights' },
        { status: 403 }
      )
    }

    // Check if we have a cached insight
    const existingInsight = await prisma.insight.findFirst({
      where: {
        userId: user.userId,
        windowSize,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (existingInsight) {
      return NextResponse.json({
        success: true,
        data: {
          cached: true,
          windowSize,
          analysisData: existingInsight.analysisData,
          insightText: existingInsight.insightText,
          riskLevel: existingInsight.riskLevel,
          createdAt: existingInsight.createdAt,
        }
      })
    }

    // Generate new insight
    const analysis = await InsightEngine.generateAndStoreInsights(user.userId, windowSize)

    return NextResponse.json({
      success: true,
      data: {
        cached: false,
        windowSize,
        ...analysis,
      }
    })

  } catch (error: any) {
    console.error('Generate insights error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate insights' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const windowSize = searchParams.get('windowSize') ? parseInt(searchParams.get('windowSize')!) : undefined

    const where: any = {
      userId: user.userId,
      expiresAt: {
        gt: new Date()
      }
    }

    if (windowSize) {
      where.windowSize = windowSize
    }

    const insights = await prisma.insight.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    })

    return NextResponse.json({
      success: true,
      data: insights
    })

  } catch (error) {
    console.error('Get insights error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get insights' },
      { status: 500 }
    )
  }
}