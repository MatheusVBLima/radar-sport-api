import { NextResponse } from "next/server"
import axios from "axios"
import {
  BETTING_HOUSES,
  analyzeMarkets,
  type OddsData,
} from "@/lib/sport-radar"

const api = axios.create({
  baseURL: "https://stats.fn.sportradar.com/",
  timeout: 12000,
})

interface MatchEvent {
  _id: number
  teams?: {
    home?: { name?: string }
    away?: { name?: string }
  }
  time?: { date?: string; time?: string }
  status?: { type?: string }
}

interface SeasonData {
  matches?: MatchEvent[]
  tournament?: { name?: string }
}

interface OddsMarket {
  name?: string
  odds?: {
    name?: string
    value?: string | number
  }[]
}

interface MatchOddsResult {
  data?: {
    oddsdata?: {
      back?: Record<string, OddsMarket>
    }
    match?: MatchEvent
  }
}

async function getFixturesForHouse(
  house: string,
  sportId: number
): Promise<MatchEvent[]> {
  try {
    const configRes = await api.get(
      `${house}/en/Europe:Berlin/gismo/config_tree_mini/41/0/${sportId}`
    )

    const categories = configRes.data?.doc?.[0]?.data?.[0]

    if (!categories?.realcategories) return []

    const seasonIds: number[] = []
    const rcats = Object.values(categories.realcategories) as Record<string, unknown>[]
    for (const rc of rcats.slice(0, 5)) {
      const tournaments = rc.tournaments as Record<string, Record<string, unknown>> | undefined
      if (tournaments) {
        for (const t of Object.values(tournaments).slice(0, 3)) {
          if (t.seasonstages) {
            for (const s of Object.values(t.seasonstages as Record<string, Record<string, unknown>>).slice(0, 1)) {
              if (s._id) seasonIds.push(s._id as number)
            }
          }
        }
      }
    }

    const allMatches: MatchEvent[] = []

    const fixtureResults = await Promise.allSettled(
      seasonIds.slice(0, 8).map((sid) =>
        api.get(
          `${house}/en/Europe:Berlin/gismo/stats_season_fixtures2/${sid}/1`
        )
      )
    )

    for (const result of fixtureResults) {
      if (result.status === "fulfilled") {
        const seasonData = result.value?.data?.doc?.[0]?.data as SeasonData | undefined
        if (seasonData?.matches) {
          const upcoming = seasonData.matches.filter(
            (m: MatchEvent) =>
              m.status?.type === "notstarted" || m.status?.type === "inprogress"
          )
          allMatches.push(...upcoming.slice(0, 10))
        }
      }
    }

    return allMatches
  } catch {
    return []
  }
}

async function getOddsForMatch(
  house: { id: string; name: string },
  matchId: number
): Promise<{
  bettingHouse: string
  bettingHouseName: string
  market: string
  outcomes: { name: string; odds: number }[]
}[]> {
  try {
    const res = await api.get(
      `${house.id}/en/Europe:Berlin/gismo/match_get/${matchId}`
    )
    const matchData = res.data?.doc?.[0] as MatchOddsResult | undefined
    const oddsData = matchData?.data?.oddsdata?.back

    if (!oddsData) return []

    const markets: {
      bettingHouse: string
      bettingHouseName: string
      market: string
      outcomes: { name: string; odds: number }[]
    }[] = []

    for (const [, marketData] of Object.entries(oddsData)) {
      if (marketData.odds && marketData.name) {
        const outcomes = Object.values(marketData.odds)
          .filter(
            (o) =>
              o.name && o.value && parseFloat(String(o.value)) > 1
          )
          .map((o) => ({
            name: o.name as string,
            odds: parseFloat(String(o.value)),
          }))

        if (outcomes.length >= 2) {
          markets.push({
            bettingHouse: house.id,
            bettingHouseName: house.name,
            market: marketData.name,
            outcomes,
          })
        }
      }
    }

    return markets
  } catch {
    return []
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sportId = parseInt(searchParams.get("sportId") || "1")
  const selectedHouses = searchParams.get("houses")?.split(",") || [
    "bet365",
    "betfair",
    "betano",
  ]

  const houses = BETTING_HOUSES.filter((h) =>
    selectedHouses.includes(h.id)
  )

  if (houses.length < 2) {
    return NextResponse.json(
      { error: "Selecione pelo menos 2 casas de aposta" },
      { status: 400 }
    )
  }

  // Get upcoming matches from the first house
  const matches = await getFixturesForHouse(houses[0].id, sportId)

  if (matches.length === 0) {
    return NextResponse.json({ sureBets: [], allMarkets: [], matchesScanned: 0, oddsCollected: 0 })
  }

  // For each match, get odds from all selected houses
  const oddsDataList: OddsData[] = []

  const matchOddsPromises = matches.slice(0, 15).map(async (match) => {
    const allHouseOdds = await Promise.allSettled(
      houses.map((h) => getOddsForMatch(h, match._id))
    )

    const validOdds = allHouseOdds
      .filter(
        (r): r is PromiseFulfilledResult<ReturnType<typeof getOddsForMatch> extends Promise<infer T> ? T : never> =>
          r.status === "fulfilled" && r.value.length > 0
      )
      .flatMap((r) => r.value)

    if (validOdds.length > 0) {
      oddsDataList.push({
        matchId: match._id,
        home: match.teams?.home?.name || "Time A",
        away: match.teams?.away?.name || "Time B",
        league: "Liga",
        sport: sportId === 1 ? "Futebol" : "Esporte",
        startTime: `${match.time?.date || ""} ${match.time?.time || ""}`.trim(),
        odds: validOdds,
      })
    }
  })

  await Promise.allSettled(matchOddsPromises)

  const { sureBets, allMarkets } = analyzeMarkets(oddsDataList)

  return NextResponse.json({
    sureBets,
    allMarkets,
    matchesScanned: matches.length,
    oddsCollected: oddsDataList.length,
  })
}
