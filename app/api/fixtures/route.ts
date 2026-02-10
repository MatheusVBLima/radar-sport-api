import { NextResponse } from "next/server"
import { getSeasonFixtures } from "@/lib/sport-radar"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const seasonId = searchParams.get("seasonId")
  const house = searchParams.get("house") || "bet365"
  const page = searchParams.get("page") || "1"

  if (!seasonId) {
    return NextResponse.json(
      { error: "seasonId is required" },
      { status: 400 }
    )
  }

  const fixtures = await getSeasonFixtures(
    house,
    parseInt(seasonId),
    parseInt(page)
  )

  return NextResponse.json({ fixtures })
}
