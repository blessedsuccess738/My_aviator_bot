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

    const investments = await prisma.userInvestment.findMany({
      where: {
        userId: auth.user.userId,
        isActive: true
      },
      include: {
        plan: true,
        dailyEarnings: {
          orderBy: { earningDate: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const updatedInvestments = investments.map(investment => {
      const now = new Date()
      const endDate = new Date(investment.endDate)
      const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

      return {
        id: investment.id,
        plan: {
          id: investment.plan.id,
          name: investment.plan.name,
          price: investment.plan.price
        },
        purchasePrice: investment.purchasePrice,
        dailyEarning: investment.dailyEarning,
        totalExpectedReturn: investment.totalExpectedReturn,
        totalEarnedSoFar: investment.totalEarnedSoFar,
        startDate: investment.startDate,
        endDate: investment.endDate,
        daysRemaining: daysRemaining,
        isActive: daysRemaining > 0,
        lastEarningDate: investment.lastEarningDate,
        recentEarnings: investment.dailyEarnings.map(earning => ({
          amount: earning.amount,
          earningDate: earning.earningDate
        }))
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedInvestments
    })

  } catch (error) {
    console.error('Active investments error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}