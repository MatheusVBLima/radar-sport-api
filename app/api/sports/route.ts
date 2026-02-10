import { NextResponse } from "next/server"
import { SPORTS, BETTING_HOUSES, getCategories } from "@/lib/sport-radar"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sportId = searchParams.get("sportId")
  const house = searchParams.get("house") || "bet365"

  if (sportId) {
    const categories = await getCategories(house, parseInt(sportId))
    return NextResponse.json({ categories })
  }

  return NextResponse.json({
    sports: SPORTS,
    houses: BETTING_HOUSES,
  })
}
