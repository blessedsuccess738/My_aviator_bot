// Simple in-memory database for development
// This is a temporary solution until Prisma issues are resolved

export interface User {
  id: string
  email: string
  passwordHash: string
  subscriptionTier: string
  createdAt: Date
  lastLogin?: Date
}

export interface Session {
  id: string
  userId: string
  tokenHash: string
  expiresAt: Date
  createdAt: Date
}

export interface CasinoLink {
  id: string
  userId: string
  name: string
  url: string
  isActive: boolean
  fetchFrequency: number
  lastFetch?: Date
  createdAt: Date
}

export interface CrashRound {
  id: string
  roundId: string
  multiplier: number
  crashTimestamp: Date
  sourceLinkId?: string
  createdAt: Date
}

class SimpleDatabase {
  private users: Map<string, User> = new Map()
  private sessions: Map<string, Session> = new Map()
  private casinoLinks: Map<string, CasinoLink> = new Map()
  private crashRounds: Map<string, CrashRound> = new Map()

  // User operations
  async createUser(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const user: User = {
      id,
      ...data,
      createdAt: new Date()
    }
    this.users.set(id, user)
    return user
  }

  async getUserByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user
      }
    }
    return null
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null
  }

  // Session operations
  async createSession(data: Omit<Session, 'id' | 'createdAt'>): Promise<Session> {
    const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const session: Session = {
      id,
      ...data,
      createdAt: new Date()
    }
    this.sessions.set(id, session)
    return session
  }

  async getSessionByTokenHash(tokenHash: string): Promise<Session | null> {
    for (const session of this.sessions.values()) {
      if (session.tokenHash === tokenHash && session.expiresAt > new Date()) {
        return session
      }
    }
    return null
  }

  // Casino Link operations
  async createCasinoLink(data: Omit<CasinoLink, 'id' | 'createdAt'>): Promise<CasinoLink> {
    const id = `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const link: CasinoLink = {
      id,
      ...data,
      createdAt: new Date()
    }
    this.casinoLinks.set(id, link)
    return link
  }

  async getCasinoLinksByUserId(userId: string): Promise<CasinoLink[]> {
    const links: CasinoLink[] = []
    for (const link of this.casinoLinks.values()) {
      if (link.userId === userId) {
        links.push(link)
      }
    }
    return links.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  async getCasinoLinkCountByUserId(userId: string): Promise<number> {
    let count = 0
    for (const link of this.casinoLinks.values()) {
      if (link.userId === userId) {
        count++
      }
    }
    return count
  }

  // Crash Round operations
  async createCrashRound(data: Omit<CrashRound, 'id' | 'createdAt'>): Promise<CrashRound> {
    const id = `round_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const round: CrashRound = {
      id,
      ...data,
      createdAt: new Date()
    }
    this.crashRounds.set(id, round)
    return round
  }

  async getCrashRoundsByUserId(userId: string, limit: number = 100): Promise<CrashRound[]> {
    // First get user's links
    const userLinks = await this.getCasinoLinksByUserId(userId)
    const linkIds = userLinks.map(link => link.id)

    const rounds: CrashRound[] = []
    for (const round of this.crashRounds.values()) {
      if (!round.sourceLinkId || linkIds.includes(round.sourceLinkId)) {
        rounds.push(round)
      }
    }

    return rounds
      .sort((a, b) => b.crashTimestamp.getTime() - a.crashTimestamp.getTime())
      .slice(0, limit)
  }

  async getCrashRoundsCountByUserId(userId: string): Promise<number> {
    const userLinks = await this.getCasinoLinksByUserId(userId)
    const linkIds = userLinks.map(link => link.id)

    let count = 0
    for (const round of this.crashRounds.values()) {
      if (!round.sourceLinkId || linkIds.includes(round.sourceLinkId)) {
        count++
      }
    }
    return count
  }

  async getCrashRoundsByLinkId(linkId: string, limit: number = 100): Promise<CrashRound[]> {
    const rounds: CrashRound[] = []
    for (const round of this.crashRounds.values()) {
      if (round.sourceLinkId === linkId) {
        rounds.push(round)
      }
    }

    return rounds
      .sort((a, b) => b.crashTimestamp.getTime() - a.crashTimestamp.getTime())
      .slice(0, limit)
  }

  async getCrashRoundsCountByLinkId(linkId: string): Promise<number> {
    let count = 0
    for (const round of this.crashRounds.values()) {
      if (round.sourceLinkId === linkId) {
        count++
      }
    }
    return count
  }

  async getCrashRoundsLast24Hours(userId: string): Promise<number> {
    const userLinks = await this.getCasinoLinksByUserId(userId)
    const linkIds = userLinks.map(link => link.id)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

    let count = 0
    for (const round of this.crashRounds.values()) {
      if ((!round.sourceLinkId || linkIds.includes(round.sourceLinkId)) &&
          round.crashTimestamp > yesterday) {
        count++
      }
    }
    return count
  }

  // Analytics
  async getAnalyticsSummary(userId: string) {
    const [totalRounds, totalLinks, roundsLast24Hours] = await Promise.all([
      this.getCrashRoundsCountByUserId(userId),
      this.getCasinoLinkCountByUserId(userId),
      this.getCrashRoundsLast24Hours(userId)
    ])

    const recentRounds = await this.getCrashRoundsByUserId(userId, 100)
    let avgMultiplier = 0
    let minMultiplier = 0
    let maxMultiplier = 0

    if (recentRounds.length > 0) {
      const multipliers = recentRounds.map(r => r.multiplier)
      avgMultiplier = multipliers.reduce((sum, m) => sum + m, 0) / multipliers.length
      minMultiplier = Math.min(...multipliers)
      maxMultiplier = Math.max(...multipliers)
    }

    return {
      totalRounds,
      totalLinks,
      avgMultiplier,
      minMultiplier,
      maxMultiplier,
      roundsLast24Hours
    }
  }
}

export const db = new SimpleDatabase()