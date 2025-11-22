'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface InsightData {
  windowSize: number
  totalRounds: number
  avgMultiplier: number
  minMultiplier: number
  maxMultiplier: number
  standardDeviation: number
  lowRounds: number
  midRounds: number
  highRounds: number
  pattern: string
  riskLevel: string
  insights: string[]
  analysisData: any
  cached: boolean
  createdAt: string
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<InsightData[]>([])
  const [currentInsight, setCurrentInsight] = useState<InsightData | null>(null)
  const [windowSize, setWindowSize] = useState('10')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchInsights()
    checkAuth()
  }, [])

  const checkAuth = () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
    }
  }

  const fetchInsights = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/analytics/insights', {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch insights')
      }

      const data = await response.json()
      setInsights(data.data)
    } catch (error: any) {
      setError(error.message)
    }
  }

  const generateInsight = async () => {
    setGenerating(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/analytics/insights', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ windowSize: parseInt(windowSize) })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate insight')
      }

      setCurrentInsight(data.data)
      fetchInsights() // Refresh insights list

    } catch (error: any) {
      setError(error.message)
    } finally {
      setGenerating(false)
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'text-green-600 bg-green-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'high':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getPatternIcon = (pattern: string) => {
    switch (pattern) {
      case 'zigzag':
        return '〰️'
      case 'spike':
        return '📈'
      case 'stable':
        return '➡️'
      case 'trending':
        return '📊'
      default:
        return '🎲'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI-Powered Insights</h1>
          <p className="text-gray-600">
            Advanced pattern analysis and educational insights from your crash game data
          </p>
        </div>

        {/* Navigation */}
        <div className="flex space-x-4 mb-8">
          <a
            href="/dashboard"
            className="text-blue-600 hover:text-blue-500"
          >
            ← Back to Dashboard
          </a>
          <a
            href="/data"
            className="text-blue-600 hover:text-blue-500"
          >
            Add More Data
          </a>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Generate Insight Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate New Analysis</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Analysis Window
                </label>
                <select
                  value={windowSize}
                  onChange={(e) => setWindowSize(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="10">Last 10 Rounds (Quick Analysis)</option>
                  <option value="20">Last 20 Rounds (Medium Analysis)</option>
                  <option value="50">Last 50 Rounds (Premium Feature)</option>
                </select>
              </div>

              <button
                onClick={generateInsight}
                disabled={generating}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  '🔍 Generate Insight'
                )}
              </button>

              <div className="mt-4 text-xs text-gray-500">
                <p>• 10 rounds: Short-term patterns</p>
                <p>• 20 rounds: Medium-term trends</p>
                <p>• 50 rounds: Long-term analysis</p>
              </div>
            </div>

            {/* Pattern Legend */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pattern Types</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="text-xl mr-3">〰️</span>
                  <div>
                    <div className="font-medium text-gray-900">Zigzag</div>
                    <div className="text-sm text-gray-600">Alternating high/low</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-xl mr-3">📈</span>
                  <div>
                    <div className="font-medium text-gray-900">Spike</div>
                    <div className="text-sm text-gray-600">Isolated high multipliers</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-xl mr-3">➡️</span>
                  <div>
                    <div className="font-medium text-gray-900">Stable</div>
                    <div className="text-sm text-gray-600">Consistent range</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-xl mr-3">📊</span>
                  <div>
                    <div className="font-medium text-gray-900">Trending</div>
                    <div className="text-sm text-gray-600">Gradual increase/decrease</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-xl mr-3">🎲</span>
                  <div>
                    <div className="font-medium text-gray-900">Random</div>
                    <div className="text-sm text-gray-600">No clear pattern</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Current Insight Display */}
          <div className="lg:col-span-2">
            {currentInsight ? (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Analysis Results</h2>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getRiskLevelColor(currentInsight.riskLevel)}`}>
                      {currentInsight.riskLevel.toUpperCase()} RISK
                    </span>
                    {currentInsight.cached && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        Cached Result
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{currentInsight.totalRounds}</div>
                    <div className="text-sm text-gray-600">Rounds</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{currentInsight.avgMultiplier.toFixed(2)}x</div>
                    <div className="text-sm text-gray-600">Average</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{getPatternIcon(currentInsight.pattern)}</div>
                    <div className="text-sm text-gray-600 capitalize">{currentInsight.pattern}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{currentInsight.standardDeviation.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Volatility</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 bg-red-50 rounded">
                    <div className="text-lg font-semibold text-red-600">{currentInsight.lowRounds}</div>
                    <div className="text-sm text-red-600">Low (&lt;1.3x)</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded">
                    <div className="text-lg font-semibold text-yellow-600">{currentInsight.midRounds}</div>
                    <div className="text-sm text-yellow-600">Mid (1.3x-2.0x)</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="text-lg font-semibold text-green-600">{currentInsight.highRounds}</div>
                    <div className="text-sm text-green-600">High (&gt;2.0x)</div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Educational Insights</h3>
                  <div className="space-y-3">
                    {currentInsight.insights.map((insight, index) => (
                      <div key={index} className="flex items-start">
                        <span className="text-blue-500 mr-3 mt-1">•</span>
                        <p className="text-gray-700 text-sm leading-relaxed">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">🧠</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analysis Yet</h3>
                <p className="text-gray-600 mb-6">
                  Generate your first AI-powered insight by selecting an analysis window and clicking "Generate Insight".
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Historical Insights */}
        {insights.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Analyses</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {insights.map((insight) => (
                <div key={insight.createdAt} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">{getPatternIcon(insight.pattern)}</span>
                      <div>
                        <div className="font-medium text-gray-900 capitalize">
                          {insight.pattern} Pattern ({insight.windowSize} rounds)
                        </div>
                        <div className="text-sm text-gray-600">
                          Avg: {insight.avgMultiplier.toFixed(2)}x | Risk: {insight.riskLevel}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskLevelColor(insight.riskLevel)}`}>
                        {insight.riskLevel.toUpperCase()}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(insight.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-yellow-600 mr-3">⚠️</div>
            <div>
              <h3 className="text-yellow-800 font-semibold mb-1">Educational Disclaimer</h3>
              <p className="text-yellow-700 text-sm">
                These insights are for educational purposes only. They analyze historical patterns and do not predict future outcomes.
                Always gamble responsibly and never bet more than you can afford to lose.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}