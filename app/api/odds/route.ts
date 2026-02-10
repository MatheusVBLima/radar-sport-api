import { NextResponse } from "next/server"
import { BETTING_HOUSES, getMatchOdds } from "@/lib/sport-radar"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const matchId = searchParams.get("matchId")

  if (!matchId) {
    return NextResponse.json(
      { error: "matchId is required" },
      { status: 400 }
    )
  }

  const id = parseInt(matchId)
  const results = await Promise.allSettled(
    BETTING_HOUSES.map(async (house) => {
      const data = await getMatchOdds(house.id, id)
      return { house, data }
    })
  )

  const odds = results
    .filter(
      (r): r is PromiseFulfilledResult<{ house: typeof BETTING_HOUSES[number]; data: unknown }> =>
        r.status === "fulfilled" && r.value.data !== null
    )
    .map((r) => ({
      bettingHouse: r.value.house.id,
      bettingHouseName: r.value.house.name,
      data: r.value.data,
    }))

  return NextResponse.json({ odds })
}
