import axios from "axios"

const api = axios.create({
  baseURL: "https://stats.fn.sportradar.com/",
  timeout: 15000,
})

const s5Api = axios.create({
  baseURL: "https://s5.sir.sportradar.com/",
  timeout: 15000,
})

export const BETTING_HOUSES = [
  { id: "bet365", name: "Bet365", color: "#027b5b" },
  { id: "betfair", name: "Betfair", color: "#ffb80c" },
  { id: "betano", name: "Betano", color: "#e8233a" },
  { id: "betway", name: "Betway", color: "#00a826" },
  { id: "888sport", name: "888sport", color: "#1e8c6e" },
  { id: "sportingbet", name: "Sportingbet", color: "#f7b500" },
  { id: "rivalo", name: "Rivalo", color: "#ff6600" },
] as const

export type BettingHouseId = (typeof BETTING_HOUSES)[number]["id"]

export const SPORTS = [
  { id: 1, name: "Futebol" },
  { id: 2, name: "Basquete" },
  { id: 5, name: "Tenis" },
  { id: 4, name: "Hockey no Gelo" },
  { id: 23, name: "Volei" },
  { id: 3, name: "Baseball" },
  { id: 6, name: "Handebol" },
  { id: 16, name: "Futebol Americano" },
] as const

export async function getCategories(
  bettingHouse: string,
  sportId: number
) {
  try {
    const res = await api.get(
      `${bettingHouse}/en/Europe:Berlin/gismo/config_tree_mini/41/0/${sportId}`
    )
    return res.data?.doc?.[0]?.data?.[0] ?? null
  } catch {
    return null
  }
}

export async function getSeasonMeta(
  bettingHouse: string,
  seasonId: number
) {
  try {
    const res = await api.get(
      `${bettingHouse}/en/Europe:Berlin/gismo/stats_season_meta/${seasonId}`
    )
    return res.data?.doc?.[0] ?? null
  } catch {
    return null
  }
}

export async function getSeasonFixtures(
  bettingHouse: string,
  seasonId: number,
  page: number = 1
) {
  try {
    const res = await api.get(
      `${bettingHouse}/en/Europe:Berlin/gismo/stats_season_fixtures2/${seasonId}/${page}`
    )
    return res.data?.doc?.[0] ?? null
  } catch {
    return null
  }
}

export async function getMatchOdds(
  bettingHouse: string,
  matchId: number
) {
  try {
    const res = await api.get(
      `${bettingHouse}/en/Europe:Berlin/gismo/match_get/${matchId}`
    )
    return res.data?.doc?.[0] ?? null
  } catch {
    return null
  }
}

export async function getCommonTranslations(
  langId: string = "5bc333c9e86aeb31125b4b35e9038eb5"
) {
  try {
    const res = await s5Api.get(
      `translations/common/en.${langId}.json`
    )
    return res.data
  } catch {
    return null
  }
}

export interface OddsData {
  matchId: number
  home: string
  away: string
  league: string
  sport: string
  startTime: string
  odds: {
    bettingHouse: string
    bettingHouseName: string
    market: string
    outcomes: {
      name: string
      odds: number
    }[]
  }[]
}

export interface SureBet {
  matchId: number
  home: string
  away: string
  league: string
  sport: string
  startTime: string
  market: string
  profit: number
  totalImpliedProbability: number
  bets: {
    outcome: string
    bettingHouse: string
    bettingHouseName: string
    odds: number
    stake: number
    potentialReturn: number
  }[]
}

export interface MarketComparison {
  matchId: number
  home: string
  away: string
  league: string
  sport: string
  startTime: string
  market: string
  totalImpliedProbability: number
  margin: number
  isSureBet: boolean
  outcomes: {
    name: string
    bestOdds: number
    bestHouse: string
    bestHouseName: string
    allOdds: { house: string; houseName: string; odds: number }[]
  }[]
}

export function analyzeMarkets(oddsDataList: OddsData[]): {
  sureBets: SureBet[]
  allMarkets: MarketComparison[]
} {
  const sureBets: SureBet[] = []
  const allMarkets: MarketComparison[] = []

  for (const matchOdds of oddsDataList) {
    const marketMap = new Map<
      string,
      Map<string, { house: string; houseName: string; odds: number }[]>
    >()

    for (const houseOdds of matchOdds.odds) {
      for (const outcome of houseOdds.outcomes) {
        if (!marketMap.has(houseOdds.market)) {
          marketMap.set(houseOdds.market, new Map())
        }
        const outcomesMap = marketMap.get(houseOdds.market)!
        if (!outcomesMap.has(outcome.name)) {
          outcomesMap.set(outcome.name, [])
        }
        outcomesMap.get(outcome.name)!.push({
          house: houseOdds.bettingHouse,
          houseName: houseOdds.bettingHouseName,
          odds: outcome.odds,
        })
      }
    }

    for (const [market, outcomesMap] of marketMap) {
      const outcomes = Array.from(outcomesMap.entries())
      if (outcomes.length < 2) continue

      // Need odds from at least 2 different houses for a comparison
      const allHouses = new Set<string>()
      for (const [, houses] of outcomes) {
        for (const h of houses) allHouses.add(h.house)
      }
      if (allHouses.size < 2) continue

      const bestOdds = outcomes.map(([name, houses]) => {
        const best = houses.reduce((a, b) => (a.odds > b.odds ? a : b))
        return {
          name,
          bestOdds: best.odds,
          bestHouse: best.house,
          bestHouseName: best.houseName,
          allOdds: houses.sort((a, b) => b.odds - a.odds),
        }
      })

      const totalImpliedProb = bestOdds.reduce(
        (sum, o) => sum + 1 / o.bestOdds,
        0
      )

      const isSureBet = totalImpliedProb < 1
      const margin = (totalImpliedProb - 1) * 100

      allMarkets.push({
        matchId: matchOdds.matchId,
        home: matchOdds.home,
        away: matchOdds.away,
        league: matchOdds.league,
        sport: matchOdds.sport,
        startTime: matchOdds.startTime,
        market,
        totalImpliedProbability: Math.round(totalImpliedProb * 10000) / 10000,
        margin: Math.round(margin * 100) / 100,
        isSureBet,
        outcomes: bestOdds,
      })

      if (isSureBet) {
        const profit = (1 / totalImpliedProb - 1) * 100
        const totalStake = 100

        const bets = bestOdds.map((o) => {
          const stake =
            (totalStake * (1 / o.bestOdds)) / totalImpliedProb
          const potentialReturn = stake * o.bestOdds
          return {
            outcome: o.name,
            bettingHouse: o.bestHouse,
            bettingHouseName: o.bestHouseName,
            odds: o.bestOdds,
            stake: Math.round(stake * 100) / 100,
            potentialReturn: Math.round(potentialReturn * 100) / 100,
          }
        })

        sureBets.push({
          matchId: matchOdds.matchId,
          home: matchOdds.home,
          away: matchOdds.away,
          league: matchOdds.league,
          sport: matchOdds.sport,
          startTime: matchOdds.startTime,
          market,
          profit: Math.round(profit * 100) / 100,
          totalImpliedProbability:
            Math.round(totalImpliedProb * 10000) / 10000,
          bets,
        })
      }
    }
  }

  return {
    sureBets: sureBets.sort((a, b) => b.profit - a.profit),
    allMarkets: allMarkets.sort((a, b) => a.margin - b.margin),
  }
}
