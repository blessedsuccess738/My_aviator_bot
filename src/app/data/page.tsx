'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface CasinoLink {
  id: string
  name: string
  url: string
  isActive: boolean
  _count: { crashRounds: number }
}

export default function DataPage() {
  const [links, setLinks] = useState<CasinoLink[]>([])
  const [selectedLink, setSelectedLink] = useState('')
  const [roundId, setRoundId] = useState('')
  const [multiplier, setMultiplier] = useState('')
  const [csvData, setCsvData] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchLinks()
  }, [])

  const fetchLinks = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/links', {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch links')
      }

      const data = await response.json()
      setLinks(data.data)
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const payload: any = {
        roundId,
        multiplier: parseFloat(multiplier),
        crashTimestamp: new Date().toISOString()
      }

      if (selectedLink) {
        payload.sourceLinkId = selectedLink
      }

      const response = await fetch('/api/rounds', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add round')
      }

      setSuccess('Round added successfully!')
      setRoundId('')
      setMultiplier('')
      setSelectedLink('')

    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkImport = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      // Parse CSV data
      const lines = csvData.trim().split('\n')
      const rounds = []

      // Skip header if exists
      const startIndex = lines[0].toLowerCase().includes('round') ? 1 : 0

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const [roundId, multiplier] = line.split(',').map(s => s.trim())
        if (roundId && multiplier) {
          rounds.push({
            roundId,
            multiplier: parseFloat(multiplier),
            crashTimestamp: new Date().toISOString(),
            sourceLinkId: selectedLink || undefined
          })
        }
      }

      if (rounds.length === 0) {
        throw new Error('No valid rounds found in CSV data')
      }

      const response = await fetch('/api/rounds', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rounds })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import rounds')
      }

      setSuccess(`Successfully imported ${data.data.created} of ${data.data.total} rounds`)
      setCsvData('')

    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setCsvData(text)
    }
    reader.readAsText(file)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Management</h1>
          <p className="text-gray-600">
            Add crash round data manually or import from CSV files
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
            href="/links"
            className="text-blue-600 hover:text-blue-500"
          >
            Manage Casino Links
          </a>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 p-4 mb-6">
            <div className="text-sm text-green-700">{success}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Single Round Entry */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Single Round</h2>
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Casino Link (Optional)
                </label>
                <select
                  value={selectedLink}
                  onChange={(e) => setSelectedLink(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Manual Entry (No Link)</option>
                  {links.map(link => (
                    <option key={link.id} value={link.id}>
                      {link.name} ({link._count.crashRounds} rounds)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Round ID
                </label>
                <input
                  type="text"
                  value={roundId}
                  onChange={(e) => setRoundId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., round_12345"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Multiplier
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={multiplier}
                  onChange={(e) => setMultiplier(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 2.45"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Round'}
              </button>
            </form>
          </div>

          {/* Bulk Import */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Bulk Import (CSV)</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Link (Optional)
              </label>
              <select
                value={selectedLink}
                onChange={(e) => setSelectedLink(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Manual Entry (No Link)</option>
                {links.map(link => (
                  <option key={link.id} value={link.id}>
                    {link.name} ({link._count.crashRounds} rounds)
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload CSV File
              </label>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Or paste CSV data directly:
              </label>
              <textarea
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="round_id,multiplier&#10;round_001,1.25&#10;round_002,3.45&#10;round_003,1.89"
              />
            </div>

            <div className="text-xs text-gray-500 mb-4">
              Format: round_id,multiplier (one per line)
            </div>

            <button
              onClick={handleBulkImport}
              disabled={loading || !csvData.trim()}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {loading ? 'Importing...' : 'Import Rounds'}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-blue-800 font-semibold mb-2">💡 Data Input Instructions</h3>
          <div className="text-blue-700 text-sm space-y-2">
            <p><strong>Single Entry:</strong> Add one round at a time with round ID and multiplier.</p>
            <p><strong>Bulk Import:</strong> Upload a CSV file or paste data with format: round_id,multiplier</p>
            <p><strong>Casino Links:</strong> Associate data with specific casino links for better organization.</p>
            <p><strong>Data Validation:</strong> Multipliers must be between 1.00 and 1000.00</p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-yellow-600 mr-3">⚠️</div>
            <div>
              <h3 className="text-yellow-800 font-semibold mb-1">Educational Disclaimer</h3>
              <p className="text-yellow-700 text-sm">
                This data is used for educational analysis purposes only. No predictions or guarantees are made.
                Always gamble responsibly and never bet more than you can afford to lose.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}