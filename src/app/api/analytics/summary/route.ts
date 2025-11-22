import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/simple-db'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get analytics summary using the simple database
    const summary = await db.getAnalyticsSummary(user.userId)

    return NextResponse.json({
      success: true,
      data: {
        ...summary,
        latestInsight: null // TODO: Implement insights later
      }
    })

  } catch (error: any) {
    console.error('Get analytics summary error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get analytics summary' },
      { status: 500 }
    )
  }
}