import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/lib/middleware'
import Joi from 'joi'

const withdrawalSchema = Joi.object({
  amount: Joi.number().positive().min(2000).required().messages({
    'number.min': 'Minimum withdrawal amount is ₦2,000'
  }),
  bank_name: Joi.string().required().messages({
    'any.required': 'Bank name is required'
  }),
  account_number: Joi.string().required().messages({
    'any.required': 'Account number is required'
  }),
  account_name: Joi.string().required().messages({
    'any.required': 'Account name is required'
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
    const { error, value } = withdrawalSchema.validate(body)

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.details[0].message
      }, { status: 400 })
    }

    const { amount, bank_name, account_number, account_name } = value

    const wallet = await prisma.wallet.findUnique({
      where: { userId: auth.user.userId }
    })

    if (!wallet || wallet.balance < amount) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient balance'
      }, { status: 400 })
    }

    const withdrawal = await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { userId: auth.user.userId },
        data: {
          balance: {
            decrement: amount
          },
          totalWithdrawn: {
            increment: amount
          }
        }
      })

      return await tx.withdrawalRequest.create({
        data: {
          userId: auth.user.userId,
          amount,
          bankName: bank_name,
          accountNumber: account_number,
          accountName: account_name
        }
      })
    })

    return NextResponse.json({
      success: true,
      data: {
        withdrawal: {
          id: withdrawal.id,
          amount: withdrawal.amount,
          bankName: withdrawal.bankName,
          accountNumber: withdrawal.accountNumber,
          accountName: withdrawal.accountName,
          status: withdrawal.status,
          createdAt: withdrawal.createdAt
        },
        message: `Withdrawal request of ₦${amount.toLocaleString()} submitted successfully. Status: ${withdrawal.status}`
      }
    })

  } catch (error) {
    console.error('Withdrawal request error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}