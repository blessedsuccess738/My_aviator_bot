import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const plans = await prisma.investmentPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        durationDays: plan.durationDays,
        dailyReturnRate: plan.dailyReturnRate
      }))
    })

  } catch (error) {
    console.error('Available plans error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}