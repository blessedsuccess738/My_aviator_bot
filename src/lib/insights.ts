import prisma from './prisma'

export interface RoundData {
  id: string
  roundId: string
  multiplier: number
  crashTimestamp: Date
}

export interface AnalysisResult {
  windowSize: number
  totalRounds: number
  avgMultiplier: number
  minMultiplier: number
  maxMultiplier: number
  standardDeviation: number
  lowRounds: number // < 1.3x
  midRounds: number // 1.3x - 2.0x
  highRounds: number // > 2.0x
  pattern: PatternType
  riskLevel: 'low' | 'medium' | 'high'
  insights: string[]
  analysisData: any
}

export type PatternType = 'zigzag' | 'spike' | 'stable' | 'trending' | 'random'

export class InsightEngine {
  static analyzeRounds(rounds: RoundData[], windowSize: number): AnalysisResult {
    if (rounds.length === 0) {
      throw new Error('No rounds to analyze')
    }

    const multipliers = rounds.map(r => r.multiplier)
    const avgMultiplier = multipliers.reduce((sum, m) => sum + m, 0) / multipliers.length
    const minMultiplier = Math.min(...multipliers)
    const maxMultiplier = Math.max(...multipliers)

    // Calculate standard deviation
    const variance = multipliers.reduce((sum, m) => sum + Math.pow(m - avgMultiplier, 2), 0) / multipliers.length
    const standardDeviation = Math.sqrt(variance)

    // Count rounds by category
    const lowRounds = multipliers.filter(m => m < 1.3).length
    const midRounds = multipliers.filter(m => m >= 1.3 && m <= 2.0).length
    const highRounds = multipliers.filter(m => m > 2.0).length

    // Pattern detection
    const pattern = this.detectPattern(rounds)

    // Risk assessment
    const riskLevel = this.calculateRisk(avgMultiplier, standardDeviation, pattern, {
      lowRounds,
      midRounds,
      highRounds
    })

    // Generate insights
    const insights = this.generateInsights({
      windowSize,
      totalRounds: rounds.length,
      avgMultiplier,
      standardDeviation,
      pattern,
      riskLevel,
      lowRounds,
      midRounds,
      highRounds,
      minMultiplier,
      maxMultiplier
    })

    const analysisData = {
      multipliers,
      timeline: rounds.map(r => ({
        timestamp: r.crashTimestamp,
        multiplier: r.multiplier
      })),
      statistics: {
        avgMultiplier,
        standardDeviation,
        variance,
        lowRounds,
        midRounds,
        highRounds
      }
    }

    return {
      windowSize,
      totalRounds: rounds.length,
      avgMultiplier,
      minMultiplier,
      maxMultiplier,
      standardDeviation,
      lowRounds,
      midRounds,
      highRounds,
      pattern,
      riskLevel,
      insights,
      analysisData
    }
  }

  private static detectPattern(rounds: RoundData[]): PatternType {
    if (rounds.length < 3) return 'random'

    const multipliers = rounds.map(r => r.multiplier)
    const highThreshold = 2.0
    const lowThreshold = 1.5

    // Zigzag detection
    let alternations = 0
    for (let i = 1; i < multipliers.length; i++) {
      const prev = multipliers[i - 1]
      const curr = multipliers[i]
      const prevHigh = prev > highThreshold
      const currHigh = curr > highThreshold
      const prevLow = prev < lowThreshold
      const currLow = curr < lowThreshold

      if ((prevHigh && currLow) || (prevLow && currHigh)) {
        alternations++
      }
    }

    if (alternations / multipliers.length > 0.7) {
      return 'zigzag'
    }

    // Spike detection
    let spikes = 0
    for (let i = 1; i < multipliers.length - 1; i++) {
      const prev = multipliers[i - 1]
      const curr = multipliers[i]
      const next = multipliers[i + 1]

      if (curr > 3.0 && prev < 1.5 && next < 1.5) {
        spikes++
      }
    }

    if (spikes > 0) {
      return 'spike'
    }

    // Stable detection
    const inRange = multipliers.filter(m => m >= 1.2 && m <= 1.8).length
    if (inRange / multipliers.length > 0.8) {
      return 'stable'
    }

    // Trending detection
    if (multipliers.length >= 5) {
      const firstHalf = multipliers.slice(0, Math.floor(multipliers.length / 2))
      const secondHalf = multipliers.slice(Math.floor(multipliers.length / 2))
      const firstAvg = firstHalf.reduce((sum, m) => sum + m, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((sum, m) => sum + m, 0) / secondHalf.length

      const diff = Math.abs(secondAvg - firstAvg)
      if (diff > 0.3 && (secondAvg > firstAvg * 1.2 || secondAvg < firstAvg * 0.8)) {
        return 'trending'
      }
    }

    return 'random'
  }

  private static calculateRisk(
    avgMultiplier: number,
    standardDeviation: number,
    pattern: PatternType,
    distribution: { lowRounds: number, midRounds: number, highRounds: number }
  ): 'low' | 'medium' | 'high' {
    let riskScore = 0

    // Volatility component (40% weight)
    riskScore += standardDeviation * 0.4

    // Average multiplier component (30% weight) - lower avg = higher risk
    riskScore += (3.0 - Math.min(avgMultiplier, 3.0)) * 0.3

    // Pattern component (30% weight)
    const patternRiskMap: Record<PatternType, number> = {
      'stable': 0.5,
      'random': 1.0,
      'trending': 1.5,
      'zigzag': 2.0,
      'spike': 2.5
    }
    riskScore += patternRiskMap[pattern] * 0.3

    if (riskScore < 1.5) return 'low'
    if (riskScore < 2.5) return 'medium'
    return 'high'
  }

  private static generateInsights(data: any): string[] {
    const insights: string[] = []
    const { avgMultiplier, standardDeviation, pattern, riskLevel, lowRounds, midRounds, highRounds, windowSize } = data

    // General statistics
    insights.push(`Analyzed last ${windowSize} rounds with an average multiplier of ${avgMultiplier.toFixed(2)}x`)

    // Volatility insights
    if (standardDeviation < 0.3) {
      insights.push('Low volatility detected - multipliers are relatively consistent')
    } else if (standardDeviation < 0.6) {
      insights.push('Moderate volatility - expect some variation in multipliers')
    } else {
      insights.push('High volatility detected - expect significant multiplier swings')
    }

    // Distribution insights
    const total = lowRounds + midRounds + highRounds
    const lowPercent = ((lowRounds / total) * 100).toFixed(1)
    const midPercent = ((midRounds / total) * 100).toFixed(1)
    const highPercent = ((highRounds / total) * 100).toFixed(1)

    insights.push(`Distribution: ${lowPercent}% low (<1.3x), ${midPercent}% mid (1.3x-2.0x), ${highPercent}% high (>2.0x)`)

    // Pattern-specific insights
    switch (pattern) {
      case 'zigzag':
        insights.push('Zigzag pattern detected - alternating high and low multipliers suggest high volatility')
        insights.push('Educational note: Consider smaller, consistent stakes during zigzag patterns')
        break
      case 'spike':
        insights.push('Spike pattern detected - isolated high multipliers surrounded by low ones')
        insights.push('Educational warning: Spike patterns are random - avoid chasing outliers')
        break
      case 'stable':
        insights.push('Stable pattern detected - multipliers consistently in a narrow range')
        insights.push('Educational note: Stable periods may indicate predictable algorithm behavior')
        break
      case 'trending':
        insights.push('Trending pattern detected - gradual increase or decrease in multipliers')
        insights.push('Educational guidance: Watch for trend reversals - trends can change suddenly')
        break
      case 'random':
        insights.push('No clear pattern detected - multipliers appear random')
        insights.push('Educational note: Random patterns require careful bankroll management')
        break
    }

    // Risk-specific guidance
    switch (riskLevel) {
      case 'low':
        insights.push('Risk assessment: LOW - This pattern shows relatively stable behavior')
        break
      case 'medium':
        insights.push('Risk assessment: MEDIUM - Exercise caution with stake sizes')
        break
      case 'high':
        insights.push('Risk assessment: HIGH - High volatility requires careful bankroll management')
        insights.push('Educational warning: Consider reducing stakes during high volatility periods')
        break
    }

    // Add educational disclaimer
    insights.push('Disclaimer: This analysis is for educational purposes only and does not guarantee future outcomes')

    return insights
  }

  static async generateAndStoreInsights(userId: string, windowSize: number): Promise<AnalysisResult> {
    // Get user's recent rounds
    const rounds = await prisma.crashRound.findMany({
      where: {
        sourceLink: {
          userId: userId
        }
      },
      orderBy: {
        crashTimestamp: 'desc'
      },
      take: windowSize,
      select: {
        id: true,
        roundId: true,
        multiplier: true,
        crashTimestamp: true
      }
    })

    const roundData: RoundData[] = rounds.map(round => ({
      ...round,
      multiplier: parseFloat(round.multiplier.toString())
    }))

    if (roundData.length < windowSize) {
      throw new Error(`Insufficient data for ${windowSize}-round analysis. Need at least ${windowSize} rounds.`)
    }

    const analysis = this.analyzeRounds(roundData, windowSize)

    // Store insight in database
    await prisma.insight.create({
      data: {
        userId,
        windowSize,
        analysisData: analysis.analysisData,
        insightText: analysis.insights.join('\n\n'),
        riskLevel: analysis.riskLevel,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      }
    })

    return analysis
  }
}