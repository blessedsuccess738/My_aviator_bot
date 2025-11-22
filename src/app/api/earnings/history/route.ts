import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (!auth) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const skip = (page - 1) * limit

    const [earnings, totalCount] = await Promise.all([
      prisma.dailyEarning.findMany({
        where: { userId: auth.user.userId },
        include: {
          userInvestment: {
            include: {
              plan: true
            }
          }
        },
        orderBy: { earningDate: 'desc' },
        skip,
        take: limit
      }),
      prisma.dailyEarning.count({
        where: { userId: auth.user.userId }
      })
    ])

    const formattedEarnings = earnings.map(earning => ({
      id: earning.id,
      amount: earning.amount,
      earningDate: earning.earningDate,
      planName: earning.userInvestment.plan.name,
      createdAt: earning.createdAt
    }))

    return NextResponse.json({
      success: true,
      data: {
        earnings: formattedEarnings,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    })

  } catch (error) {
    console.error('Earnings history error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}