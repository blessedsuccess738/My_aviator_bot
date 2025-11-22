import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

const roundSchema = z.object({
  roundId: z.string(),
  multiplier: z.number().min(1).max(1000),
  crashTimestamp: z.string().datetime(),
  sourceLinkId: z.string().optional(),
})

const bulkRoundsSchema = z.object({
  rounds: z.array(roundSchema).max(1000), // Limit bulk import to 1000 rounds
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

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000)
    const offset = parseInt(searchParams.get('offset') || '0')
    const sourceId = searchParams.get('sourceId')

    // Build where clause
    const where: any = {}
    if (sourceId) {
      where.sourceLinkId = sourceId
    } else {
      // Only get rounds from user's links
      where.sourceLink = {
        userId: user.userId
      }
    }

    // Check subscription limits
    if (user.subscriptionTier === 'free') {
      // Free users can only access last 50 rounds
      const totalCount = await prisma.crashRound.count({ where })
      if (totalCount > 50) {
        where.crashTimestamp = {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    }

    const [rounds, total] = await Promise.all([
      prisma.crashRound.findMany({
        where,
        orderBy: { crashTimestamp: 'desc' },
        take: limit,
        skip: offset,
        include: {
          sourceLink: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      }),
      prisma.crashRound.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        rounds: rounds.map(round => ({
          ...round,
          multiplier: parseFloat(round.multiplier.toString()),
        })),
        total,
        limit,
        offset,
      }
    })

  } catch (error) {
    console.error('Get rounds error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get rounds' },
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

    // Check if it's a bulk import or single round
    if (body.rounds && Array.isArray(body.rounds)) {
      // Bulk import
      const { rounds } = bulkRoundsSchema.parse(body)

      // Check subscription limits
      const currentRoundCount = await prisma.crashRound.count({
        where: {
          sourceLink: {
            userId: user.userId
          }
        }
      })

      if (user.subscriptionTier === 'free' && currentRoundCount + rounds.length > 1000) {
        return NextResponse.json(
          { success: false, error: 'Free tier limited to 1000 rounds' },
          { status: 403 }
        )
      }

      // Validate source links
      const sourceLinkIds = [...new Set(rounds.map(r => r.sourceLinkId).filter(Boolean))]
      if (sourceLinkIds.length > 0) {
        const sourceLinks = await prisma.casinoLink.findMany({
          where: {
            id: { in: sourceLinkIds },
            userId: user.userId
          }
        })

        if (sourceLinks.length !== sourceLinkIds.length) {
          return NextResponse.json(
            { success: false, error: 'Invalid source link provided' },
            { status: 400 }
          )
        }
      }

      // Create rounds
      const createdRounds = await prisma.crashRound.createMany({
        data: rounds.map(round => ({
          roundId: round.roundId,
          multiplier: new Decimal(round.multiplier),
          crashTimestamp: new Date(round.crashTimestamp),
          sourceLinkId: round.sourceLinkId,
        })),
        skipDuplicates: true
      })

      return NextResponse.json({
        success: true,
        data: {
          created: createdRounds.count,
          total: rounds.length
        }
      })

    } else {
      // Single round
      const round = roundSchema.parse(body)

      // Validate source link if provided
      if (round.sourceLinkId) {
        const sourceLink = await prisma.casinoLink.findFirst({
          where: {
            id: round.sourceLinkId,
            userId: user.userId
          }
        })

        if (!sourceLink) {
          return NextResponse.json(
            { success: false, error: 'Invalid source link' },
            { status: 400 }
          )
        }
      }

      // Check subscription limits
      const currentRoundCount = await prisma.crashRound.count({
        where: {
          sourceLink: {
            userId: user.userId
          }
        }
      })

      if (user.subscriptionTier === 'free' && currentRoundCount >= 1000) {
        return NextResponse.json(
          { success: false, error: 'Free tier limited to 1000 rounds' },
          { status: 403 }
        )
      }

      const createdRound = await prisma.crashRound.create({
        data: {
          roundId: round.roundId,
          multiplier: new Decimal(round.multiplier),
          crashTimestamp: new Date(round.crashTimestamp),
          sourceLinkId: round.sourceLinkId,
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          ...createdRound,
          multiplier: parseFloat(createdRound.multiplier.toString()),
        }
      })
    }

  } catch (error) {
    console.error('Create rounds error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create rounds' },
      { status: 500 }
    )
  }
}