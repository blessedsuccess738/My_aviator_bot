import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/lib/middleware'
import Joi from 'joi'

const purchaseSchema = Joi.object({
  plan_id: Joi.string().required().messages({
    'any.required': 'Plan ID is required'
  })
})

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (!auth) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    const body = await request.json()
    const { error, value } = purchaseSchema.validate(body)

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.details[0].message
      }, { status: 400 })
    }

    const { plan_id } = value

    const plan = await prisma.investmentPlan.findUnique({
      where: { id: plan_id }
    })

    if (!plan || !plan.isActive) {
      return NextResponse.json({
        success: false,
        error: 'Investment plan not found or inactive'
      }, { status: 404 })
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: auth.user.userId }
    })

    if (!wallet || wallet.balance < plan.price) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient balance'
      }, { status: 400 })
    }

    const dailyEarning = plan.price * plan.dailyReturnRate
    const totalExpectedReturn = dailyEarning * plan.durationDays
    const startDate = new Date()
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + plan.durationDays)

    const investment = await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { userId: auth.user.userId },
        data: {
          balance: {
            decrement: plan.price
          }
        }
      })

      return await tx.userInvestment.create({
        data: {
          userId: auth.user.userId,
          planId: plan.id,
          purchasePrice: plan.price,
          dailyEarning: dailyEarning,
          totalExpectedReturn: totalExpectedReturn,
          startDate: startDate,
          endDate: endDate,
          daysRemaining: plan.durationDays,
          lastEarningDate: startDate
        }
      })
    })

    return NextResponse.json({
      success: true,
      data: {
        investment: {
          id: investment.id,
          planName: plan.name,
          purchasePrice: investment.purchasePrice,
          dailyEarning: investment.dailyEarning,
          totalExpectedReturn: investment.totalExpectedReturn,
          startDate: investment.startDate,
          endDate: investment.endDate,
          daysRemaining: investment.daysRemaining
        },
        message: `Successfully purchased ${plan.name}! You will earn ₦${dailyEarning.toLocaleString()} daily for ${plan.durationDays} days.`
      }
    })

  } catch (error) {
    console.error('Investment purchase error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}