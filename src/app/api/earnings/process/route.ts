import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const activeInvestments = await prisma.userInvestment.findMany({
      where: {
        isActive: true,
        lastEarningDate: {
          lt: oneDayAgo
        }
      },
      include: {
        user: true
      }
    })

    const processedEarnings = []

    for (const investment of activeInvestments) {
      const endDate = new Date(investment.endDate)

      if (now <= endDate) {
        await prisma.$transaction(async (tx) => {
          await tx.dailyEarning.create({
            data: {
              userInvestmentId: investment.id,
              userId: investment.userId,
              amount: investment.dailyEarning,
              earningDate: now
            }
          })

          await tx.wallet.update({
            where: { userId: investment.userId },
            data: {
              balance: {
                increment: investment.dailyEarning
              }
            }
          })

          await tx.userInvestment.update({
            where: { id: investment.id },
            data: {
              totalEarnedSoFar: {
                increment: investment.dailyEarning
              },
              lastEarningDate: now
            }
          })
        })

        processedEarnings.push({
          investmentId: investment.id,
          userId: investment.userId,
          amount: investment.dailyEarning
        })
      } else {
        await tx.userInvestment.update({
          where: { id: investment.id },
          data: {
            isActive: false,
            daysRemaining: 0
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        processedCount: processedEarnings.length,
        totalAmount: processedEarnings.reduce((sum, earning) => sum + earning.amount, 0),
        processedAt: now,
        earnings: processedEarnings
      }
    })

  } catch (error) {
    console.error('Earnings processing error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}