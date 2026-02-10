import { NextResponse } from "next/server"
import {
  BETTING_HOUSES,
  analyzeMarkets,
  type OddsData,
} from "@/lib/sport-radar"

const BASE_URL = "https://stats.fn.sportradar.com"

async function fetchJson(url: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) {
      console.log(`[v0] fetch failed ${res.status}: ${url}`)
      return null
    }
    return await res.json()
  } catch (e) {
    console.log(`[v0] fetch error: ${url}`, e)
    return null
  } finally {
    clearTimeout(timeout)
  }
}

interface SeasonStage {
  _id: number
  name?: string
}

interface TournamentData {
  name?: string
  seasonstages?: Record<string, SeasonStage>
}

interface CategoryData {
  name?: string
  tournaments?: Record<string, TournamentData>
}

interface MatchEvent {
  _id: number
  teams?: {
    home?: { name?: string; uid?: number }
    away?: { name?: string; uid?: number }
  }
  time?: { date?: string; time?: string }
  status?: { type?: string }
  _rcid?: number
  _tid?: number
  _sid?: number
}

async function getUpcomingMatches(
  house: string,
  sportId: number
): Promise<{ match: MatchEvent; league: string }[]> {
  const configUrl = `${BASE_URL}/${house}/en/Europe:Berlin/gismo/config_tree_mini/41/0/${sportId}`
  console.log(`[v0] Fetching config: ${configUrl}`)
  const configData = await fetchJson(configUrl)

  const root = configData?.doc?.[0]?.data?.[0]
  if (!root?.realcategories) {
    console.log("[v0] No realcategories found in config")
    // Try alternative: direct sport fixtures endpoint
    return await getUpcomingMatchesFallback(house, sportId)
  }

  const categories = Object.values(root.realcategories) as CategoryData[]
  console.log(`[v0] Found ${categories.length} categories`)

  const seasonInfos: { seasonId: number; leagueName: string }[] = []

  for (const cat of categories.slice(0, 8)) {
    if (!cat.tournaments) continue
    for (const tourn of Object.values(cat.tournaments).slice(0, 5)) {
      if (!tourn.seasonstages) continue
      for (const stage of Object.values(tourn.seasonstages).slice(0, 1)) {
        if (stage._id) {
          seasonInfos.push({
            seasonId: stage._id,
            leagueName: `${cat.name || ""} - ${tourn.name || ""}`,
          })
        }
      }
    }
  }

  console.log(`[v0] Found ${seasonInfos.length} seasons to scan`)

  const results: { match: MatchEvent; league: string }[] = []

  const batchSize = 6
  for (let i = 0; i < Math.min(seasonInfos.length, 12); i += batchSize) {
    const batch = seasonInfos.slice(i, i + batchSize)
    const fixtureResults = await Promise.allSettled(
      batch.map(async (si) => {
        const url = `${BASE_URL}/${house}/en/Europe:Berlin/gismo/stats_season_fixtures2/${si.seasonId}/1`
        const data = await fetchJson(url)
        return { data, league: si.leagueName }
      })
    )

    for (const result of fixtureResults) {
      if (result.status !== "fulfilled" || !result.value.data) continue
      
      const seasonData = result.value.data?.doc?.[0]?.data
      const league = result.value.league

      // Try different data shapes
      let matches: MatchEvent[] = []
      if (Array.isArray(seasonData?.matches)) {
        matches = seasonData.matches
      } else if (seasonData?.matches && typeof seasonData.matches === "object") {
        matches = Object.values(seasonData.matches)
      }

      // Also try events array
      if (matches.length === 0 && Array.isArray(seasonData?.events)) {
        matches = seasonData.events
      }

      const upcoming = matches.filter(
        (m: MatchEvent) =>
          m.status?.type === "notstarted" || m.status?.type === "inprogress"
      )

      console.log(`[v0] Season ${league}: ${matches.length} total matches, ${upcoming.length} upcoming`)

      for (const m of upcoming.slice(0, 8)) {
        results.push({ match: m, league })
      }
    }
  }

  console.log(`[v0] Total upcoming matches found: ${results.length}`)
  return results
}

async function getUpcomingMatchesFallback(
  house: string,
  sportId: number
): Promise<{ match: MatchEvent; league: string }[]> {
  console.log(`[v0] Trying fallback for ${house}, sport ${sportId}`)

  // Try the sport schedule endpoint
  const url = `${BASE_URL}/${house}/en/Europe:Berlin/gismo/sport_matches/${sportId}/1`
  const data = await fetchJson(url)

  const results: { match: MatchEvent; league: string }[] = []

  const matchesRoot = data?.doc?.[0]?.data
  if (!matchesRoot) {
    console.log("[v0] No data in fallback")
    return results
  }

  // Try to extract matches from various possible structures
  let allMatches: MatchEvent[] = []
  
  if (Array.isArray(matchesRoot)) {
    for (const section of matchesRoot) {
      if (section?.events && Array.isArray(section.events)) {
        allMatches.push(...section.events)
      }
    }
  } else if (matchesRoot.matches) {
    allMatches = Array.isArray(matchesRoot.matches)
      ? matchesRoot.matches
      : Object.values(matchesRoot.matches)
  }

  console.log(`[v0] Fallback found ${allMatches.length} matches`)

  for (const m of allMatches.filter(
    (m: MatchEvent) =>
      m._id && (m.status?.type === "notstarted" || m.status?.type === "inprogress")
  ).slice(0, 20)) {
    results.push({ match: m, league: "Liga" })
  }

  return results
}

async function getOddsForMatch(
  houseId: string,
  houseName: string,
  matchId: number
): Promise<{
  bettingHouse: string
  bettingHouseName: string
  market: string
  outcomes: { name: string; odds: number }[]
}[]> {
  const url = `${BASE_URL}/${houseId}/en/Europe:Berlin/gismo/match_get/${matchId}`
  const data = await fetchJson(url)

  const matchData = data?.doc?.[0]?.data
  const oddsData = matchData?.oddsdata?.back

  if (!oddsData) {
    console.log(`[v0] No odds for match ${matchId} at ${houseId}`)
    return []
  }

  const markets: {
    bettingHouse: string
    bettingHouseName: string
    market: string
    outcomes: { name: string; odds: number }[]
  }[] = []

  for (const [, marketData] of Object.entries(oddsData)) {
    const md = marketData as { name?: string; odds?: Record<string, { name?: string; value?: string | number }> }
    if (!md.odds || !md.name) continue

    const outcomes = Object.values(md.odds)
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
        bettingHouse: houseId,
        bettingHouseName: houseName,
        market: md.name,
        outcomes,
      })
    }
  }

  console.log(`[v0] Match ${matchId} at ${houseId}: ${markets.length} markets with odds`)
  return markets
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

  console.log(`[v0] Starting scan: sport=${sportId}, houses=${selectedHouses.join(",")}`)

  // Get upcoming matches from each house and merge
  const matchResults = await Promise.allSettled(
    houses.slice(0, 3).map((h) => getUpcomingMatches(h.id, sportId))
  )

  const matchMap = new Map<number, { match: MatchEvent; league: string }>()
  for (const result of matchResults) {
    if (result.status === "fulfilled") {
      for (const item of result.value) {
        if (!matchMap.has(item.match._id)) {
          matchMap.set(item.match._id, item)
        }
      }
    }
  }

  const uniqueMatches = Array.from(matchMap.values())
  console.log(`[v0] Unique matches to analyze: ${uniqueMatches.length}`)

  if (uniqueMatches.length === 0) {
    return NextResponse.json({
      sureBets: [],
      allMarkets: [],
      matchesScanned: 0,
      oddsCollected: 0,
    })
  }

  // For each match, get odds from all selected houses
  const oddsDataList: OddsData[] = []

  // Process in batches
  const matchBatchSize = 5
  for (let i = 0; i < Math.min(uniqueMatches.length, 20); i += matchBatchSize) {
    const batch = uniqueMatches.slice(i, i + matchBatchSize)

    const batchResults = await Promise.allSettled(
      batch.map(async ({ match, league }) => {
        const allHouseOdds = await Promise.allSettled(
          houses.map((h) => getOddsForMatch(h.id, h.name, match._id))
        )

        const validOdds = allHouseOdds
          .filter(
            (r): r is PromiseFulfilledResult<
              Awaited<ReturnType<typeof getOddsForMatch>>
            > => r.status === "fulfilled" && r.value.length > 0
          )
          .flatMap((r) => r.value)

        if (validOdds.length > 0) {
          return {
            matchId: match._id,
            home: match.teams?.home?.name || "Time A",
            away: match.teams?.away?.name || "Time B",
            league,
            sport:
              sportId === 1
                ? "Futebol"
                : sportId === 2
                  ? "Basquete"
                  : sportId === 5
                    ? "Tenis"
                    : sportId === 4
                      ? "Hockey"
                      : sportId === 23
                        ? "Volei"
                        : "Esporte",
            startTime: `${match.time?.date || ""} ${match.time?.time || ""}`.trim(),
            odds: validOdds,
          } as OddsData
        }
        return null
      })
    )

    for (const result of batchResults) {
      if (result.status === "fulfilled" && result.value) {
        oddsDataList.push(result.value)
      }
    }
  }

  console.log(`[v0] Odds collected for ${oddsDataList.length} matches`)

  const { sureBets, allMarkets } = analyzeMarkets(oddsDataList)

  console.log(`[v0] Analysis: ${allMarkets.length} markets, ${sureBets.length} sure bets`)

  return NextResponse.json({
    sureBets,
    allMarkets,
    matchesScanned: uniqueMatches.length,
    oddsCollected: oddsDataList.length,
  })
}
