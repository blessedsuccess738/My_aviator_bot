import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/lib/middleware'
import { validateCoupon } from '@/lib/coupons'
import Joi from 'joi'

const couponSchema = Joi.object({
  coupon_code: Joi.string().required().messages({
    'any.required': 'Coupon code is required'
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
    const { error, value } = couponSchema.validate(body)

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.details[0].message
      }, { status: 400 })
    }

    const { coupon_code } = value

    const existingUsage = await prisma.couponUsage.findFirst({
      where: {
        userId: auth.user.userId,
        couponCode: coupon_code.toUpperCase()
      }
    })

    if (existingUsage) {
      return NextResponse.json({
        success: false,
        error: 'Coupon code already used'
      }, { status: 400 })
    }

    const couponAmount = validateCoupon(coupon_code)
    if (couponAmount === null) {
      return NextResponse.json({
        success: false,
        error: 'Invalid coupon code. Request a valid one from admin.'
      }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.couponUsage.create({
        data: {
          userId: auth.user.userId,
          couponCode: coupon_code.toUpperCase(),
          amount: couponAmount
        }
      })

      await tx.wallet.update({
        where: { userId: auth.user.userId },
        data: {
          balance: {
            increment: couponAmount
          },
          totalDeposited: {
            increment: couponAmount
          }
        }
      })
    })

    const updatedWallet = await prisma.wallet.findUnique({
      where: { userId: auth.user.userId }
    })

    return NextResponse.json({
      success: true,
      data: {
        amount: couponAmount,
        newBalance: updatedWallet?.balance || 0,
        message: `Coupon validated! ₦${couponAmount.toLocaleString()} has been added to your wallet.`
      }
    })

  } catch (error) {
    console.error('Coupon validation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}