import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/password'
import { generateToken } from '@/lib/jwt'
import Joi from 'joi'

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { error, value } = loginSchema.validate(body)
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.details[0].message
      }, { status: 400 })
    }

    const { email, password } = value

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        wallet: true
      }
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email or password'
      }, { status: 401 })
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash)
    if (!isValidPassword) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email or password'
      }, { status: 401 })
    }

    const token = generateToken({
      userId: user.id,
      email: user.email
    })

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName
        },
        wallet: user.wallet ? {
          balance: user.wallet.balance,
          totalDeposited: user.wallet.totalDeposited,
          totalWithdrawn: user.wallet.totalWithdrawn
        } : null,
        token
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}