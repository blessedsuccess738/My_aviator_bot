'use client'

import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'

interface Round {
  id: string
  roundId: string
  multiplier: number
  crashTimestamp: string
  sourceLink?: {
    id: string
    name: string
  }
}

interface AnalyticsSummary {
  totalRounds: number
  totalLinks: number
  avgMultiplier: number
  minMultiplier: number
  maxMultiplier: number
  roundsLast24Hours: number
  latestInsight?: {
    riskLevel: string
    createdAt: string
    windowSize: number
  }
}

export default function Dashboard() {
  const [rounds, setRounds] = useState<Round[]>([])
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get auth token from localStorage
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Authentication required')
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      // Fetch summary and recent rounds
      const [summaryResponse, roundsResponse] = await Promise.all([
        fetch('/api/analytics/summary', { headers }),
        fetch('/api/rounds?limit=50', { headers })
      ])

      if (!summaryResponse.ok || !roundsResponse.ok) {
        throw new Error('Failed to fetch data')
      }

      const summaryData = await summaryResponse.json()
      const roundsData = await roundsResponse.json()

      setSummary(summaryData.data)
      setRounds(roundsData.data.rounds)

    } catch (error: any) {
      setError(error.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
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

  const chartData = rounds.slice(0, 20).reverse().map((round, index) => ({
    index: index + 1,
    multiplier: round.multiplier,
    timestamp: format(new Date(round.crashTimestamp), 'HH:mm')
  }))

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lucky Jet Analytics Dashboard</h1>
          <p className="text-gray-600">
            Educational analytics tool for crash game pattern analysis
          </p>
        </div>

        {/* Disclaimer */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <div className="flex">
            <div className="text-yellow-600 mr-3">⚠️</div>
            <div>
              <h3 className="text-yellow-800 font-semibold mb-1">Educational Disclaimer</h3>
              <p className="text-yellow-700 text-sm">
                This analytics tool is for educational purposes only. No predictions are guaranteed.
                Use at your own risk and never gamble more than you can afford to lose.
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm font-medium mb-2">Total Rounds</h3>
              <p className="text-2xl font-bold text-gray-900">{summary.totalRounds.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm font-medium mb-2">Average Multiplier</h3>
              <p className="text-2xl font-bold text-gray-900">{summary.avgMultiplier.toFixed(2)}x</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm font-medium mb-2">Casino Links</h3>
              <p className="text-2xl font-bold text-gray-900">{summary.totalLinks}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm font-medium mb-2">Last 24 Hours</h3>
              <p className="text-2xl font-bold text-gray-900">{summary.roundsLast24Hours}</p>
            </div>
          </div>
        )}

        {/* Latest Insight */}
        {summary?.latestInsight && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Latest Analysis</h3>
            <div className="flex items-center justify-between">
              <div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskLevelColor(summary.latestInsight.riskLevel)}`}>
                  {summary.latestInsight.riskLevel.toUpperCase()} RISK
                </span>
                <p className="text-gray-600 text-sm mt-2">
                  {summary.latestInsight.windowSize}-round analysis completed
                </p>
              </div>
              <div className="text-gray-500 text-sm">
                {format(new Date(summary.latestInsight.createdAt), 'MMM d, yyyy h:mm a')}
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        {rounds.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Multiplier Trend Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Multiplier Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`${value}x`, 'Multiplier']}
                    labelFormatter={(label) => `Time: ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="multiplier"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Multiplier"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Highest Multiplier:</span>
                  <span className="font-semibold">{summary?.maxMultiplier.toFixed(2)}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lowest Multiplier:</span>
                  <span className="font-semibold">{summary?.minMultiplier.toFixed(2)}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data Points:</span>
                  <span className="font-semibold">{rounds.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average:</span>
                  <span className="font-semibold">{summary?.avgMultiplier.toFixed(2)}x</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Rounds Table */}
        {rounds.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Rounds</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Round ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Multiplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rounds.slice(0, 10).map((round) => (
                    <tr key={round.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {round.roundId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`font-semibold ${
                          round.multiplier > 2 ? 'text-green-600' :
                          round.multiplier < 1.3 ? 'text-red-600' :
                          'text-yellow-600'
                        }`}>
                          {round.multiplier.toFixed(2)}x
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(round.crashTimestamp), 'MMM d, yyyy h:mm a')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {round.sourceLink?.name || 'Manual Entry'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {rounds.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-600 mb-6">
              Start by adding crash round data manually or connecting a casino link.
            </p>
            <div className="space-x-4">
              <a
                href="/data"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Add Data
              </a>
              <a
                href="/links"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Manage Links
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}