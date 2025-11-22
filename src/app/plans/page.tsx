'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

interface InvestmentPlan {
  id: string
  name: string
  price: number
  durationDays: number
  dailyReturnRate: number
}

export default function PlansPage() {
  const { user, wallet, token } = useAuth()
  const [plans, setPlans] = useState<InvestmentPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (!token) {
      router.push('/auth')
      return
    }

    fetchPlans()
  }, [token, router])

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans/available')
      const data = await response.json()
      if (data.success) {
        setPlans(data.data)
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (planId: string, planName: string, price: number) => {
    if (!wallet || wallet.balance < price) {
      setMessage('Insufficient balance. Please deposit funds first.')
      return
    }

    setPurchasing(planId)
    setMessage('')

    try {
      const response = await fetch('/api/investments/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan_id: planId })
      })

      const data = await response.json()

      if (data.success) {
        setMessage(data.data.message)
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        setMessage(data.error || 'Purchase failed')
      }
    } catch (error) {
      setMessage('Network error. Please try again.')
    } finally {
      setPurchasing(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`
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
              <h1 className="text-xl font-semibold text-gray-900">Investment Plans</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Balance: {wallet ? formatCurrency(wallet.balance) : formatCurrency(0)}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-medium text-blue-900 mb-2">How It Works</h2>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Choose an investment plan that suits your budget</li>
            <li>• Earn 40% daily returns for 30 days</li>
            <li>• Total return: {formatCurrency(1000)} becomes {formatCurrency(1000 + (1000 * 0.40 * 30))}</li>
            <li>• Earnings are automatically credited to your wallet daily</li>
          </ul>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('Successfully') || message.includes('purchased')
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const dailyEarning = plan.price * plan.dailyReturnRate
              const totalReturn = plan.price + (dailyEarning * plan.durationDays)

              return (
                <div key={plan.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                    <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                    <div className="text-3xl font-bold text-white">{formatCurrency(plan.price)}</div>
                  </div>

                  <div className="p-6">
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Duration:</span>
                        <span className="font-medium">{plan.durationDays} days</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Daily Return:</span>
                        <span className="font-medium text-green-600">{formatCurrency(dailyEarning)} (40%)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Total Return:</span>
                        <span className="font-medium text-blue-600">{formatCurrency(totalReturn)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Profit:</span>
                        <span className="font-medium text-purple-600">{formatCurrency(totalReturn - plan.price)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePurchase(plan.id, plan.name, plan.price)}
                      disabled={purchasing === plan.id || (wallet && wallet.balance < plan.price)}
                      className={`w-full py-3 px-4 rounded-lg font-semibold transition duration-200 ${
                        purchasing === plan.id
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : wallet && wallet.balance >= plan.price
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {purchasing === plan.id ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin h-5 w-5 mr-2 border-t-2 border-b-2 border-current rounded-full" viewBox="0 0 24 24"></svg>
                          Processing...
                        </span>
                      ) : wallet && wallet.balance >= plan.price ? (
                        'Buy Plan'
                      ) : (
                        'Insufficient Balance'
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {plans.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">No investment plans available at the moment.</p>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/deposit"
            className="inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
            </svg>
            Need to deposit funds first?
          </Link>
        </div>
      </main>
    </div>
  )
}