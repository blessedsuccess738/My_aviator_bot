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

    // Get basic statistics
    const [totalRounds, totalLinks, latestInsight] = await Promise.all([
      prisma.crashRound.count({
        where: {
          sourceLink: {
            userId: user.userId
          }
        }
      }),
      prisma.casinoLink.count({
        where: {
          userId: user.userId
        }
      }),
      prisma.insight.findFirst({
        where: {
          userId: user.userId,
          expiresAt: {
            gt: new Date()
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    ])

    // Get average multiplier for recent rounds
    const recentRounds = await prisma.crashRound.findMany({
      where: {
        sourceLink: {
          userId: user.userId
        }
      },
      orderBy: {
        crashTimestamp: 'desc'
      },
      take: 100,
      select: {
        multiplier: true
      }
    })

    let avgMultiplier = 0
    let minMultiplier = 0
    let maxMultiplier = 0

    if (recentRounds.length > 0) {
      const multipliers = recentRounds.map(r => parseFloat(r.multiplier.toString()))
      avgMultiplier = multipliers.reduce((sum, m) => sum + m, 0) / multipliers.length
      minMultiplier = Math.min(...multipliers)
      maxMultiplier = Math.max(...multipliers)
    }

    // Get last 24 hours activity
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const roundsLast24Hours = await prisma.crashRound.count({
      where: {
        sourceLink: {
          userId: user.userId
        },
        crashTimestamp: {
          gte: last24Hours
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        totalRounds,
        totalLinks,
        avgMultiplier,
        minMultiplier,
        maxMultiplier,
        roundsLast24Hours,
        latestInsight: latestInsight ? {
          riskLevel: latestInsight.riskLevel,
          createdAt: latestInsight.createdAt,
          windowSize: latestInsight.windowSize
        } : null
      }
    })

  } catch (error) {
    console.error('Get analytics summary error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get analytics summary' },
      { status: 500 }
    )
  }
}