import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { generateToken } from '@/lib/jwt'
import Joi from 'joi'

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[A-Za-z])(?=.*\d)/).required().messages({
    'string.pattern.base': 'Password must contain at least one letter and one number'
  }),
  fullName: Joi.string().optional().allow('')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { error, value } = registerSchema.validate(body)
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.details[0].message
      }, { status: 400 })
    }

    const { email, password, fullName } = value

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'Email already registered'
      }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: fullName || null
      }
    })

    await prisma.wallet.create({
      data: {
        userId: user.id
      }
    })

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
        token
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}