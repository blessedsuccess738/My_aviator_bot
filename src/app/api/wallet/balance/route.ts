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

    const wallet = await prisma.wallet.findUnique({
      where: { userId: auth.user.userId }
    })

    if (!wallet) {
      return NextResponse.json({
        success: false,
        error: 'Wallet not found'
      }, { status: 404 })
    }

    const couponUsages = await prisma.couponUsage.findMany({
      where: { userId: auth.user.userId },
      orderBy: { usedAt: 'desc' },
      take: 10
    })

    return NextResponse.json({
      success: true,
      data: {
        balance: wallet.balance,
        totalDeposited: wallet.totalDeposited,
        totalWithdrawn: wallet.totalWithdrawn,
        recentCouponUsages: couponUsages.map(usage => ({
          amount: usage.amount,
          couponCode: usage.couponCode,
          usedAt: usage.usedAt
        }))
      }
    })

  } catch (error) {
    console.error('Wallet balance error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}