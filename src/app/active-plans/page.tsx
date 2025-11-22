'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

interface ActiveInvestment {
  id: string
  plan: {
    id: string
    name: string
    price: number
  }
  purchasePrice: number
  dailyEarning: number
  totalExpectedReturn: number
  totalEarnedSoFar: number
  startDate: string
  endDate: string
  daysRemaining: number
  isActive: boolean
  lastEarningDate: string
  recentEarnings: Array<{
    amount: number
    earningDate: string
  }>
}

export default function ActivePlansPage() {
  const { user, token } = useAuth()
  const [investments, setInvestments] = useState<ActiveInvestment[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!token) {
      router.push('/auth')
      return
    }

    fetchActiveInvestments()
  }, [token, router])

  const fetchActiveInvestments = async () => {
    try {
      const response = await fetch('/api/investments/active', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setInvestments(data.data)
      }
    } catch (error) {
      console.error('Error fetching investments:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const calculateProgress = (investment: ActiveInvestment) => {
    const totalDays = Math.ceil((new Date(investment.endDate).getTime() - new Date(investment.startDate).getTime()) / (1000 * 60 * 60 * 24))
    const daysCompleted = totalDays - investment.daysRemaining
    return (daysCompleted / totalDays) * 100
  }

  if (!token) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 mr-4">
                ← Dashboard
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Active Plans</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : investments.length > 0 ? (
          <div className="space-y-6">
            {investments.map((investment) => (
              <div key={investment.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{investment.plan.name}</h2>
                      <p className="text-blue-100 mt-1">Started on {formatDate(investment.startDate)}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-white">{investment.daysRemaining}</div>
                      <div className="text-blue-100 text-sm">days remaining</div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm text-gray-500">{Math.round(calculateProgress(investment))}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${calculateProgress(investment)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Investment Amount</p>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(investment.purchasePrice)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Daily Earning</p>
                      <p className="text-lg font-semibold text-green-600">{formatCurrency(investment.dailyEarning)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Earned So Far</p>
                      <p className="text-lg font-semibold text-blue-600">{formatCurrency(investment.totalEarnedSoFar)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Total Return</p>
                      <p className="text-lg font-semibold text-purple-600">{formatCurrency(investment.totalExpectedReturn)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Investment Timeline</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Start Date:</span>
                          <span className="font-medium">{formatDate(investment.startDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">End Date:</span>
                          <span className="font-medium">{formatDate(investment.endDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Last Earning:</span>
                          <span className="font-medium">
                            {investment.lastEarningDate ? formatDate(investment.lastEarningDate) : 'Not yet'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Earnings</h3>
                      {investment.recentEarnings.length > 0 ? (
                        <div className="space-y-2 text-sm max-h-24 overflow-y-auto">
                          {investment.recentEarnings.map((earning, index) => (
                            <div key={index} className="flex justify-between">
                              <span className="text-gray-500">{formatDate(earning.earningDate)}</span>
                              <span className="font-medium text-green-600">{formatCurrency(earning.amount)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No earnings yet</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-blue-800">
                        Daily earnings are automatically credited to your wallet. This plan will complete on {formatDate(investment.endDate)}.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v10H5V5z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Active Plans</h2>
            <p className="text-gray-600 mb-6">
              You don't have any active investment plans. Start investing to see your earnings grow!
            </p>
            <Link
              href="/plans"
              className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              View Investment Plans
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}