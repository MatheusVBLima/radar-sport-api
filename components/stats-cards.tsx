import { TrendingUp, Search, Target, BarChart3 } from "lucide-react"

interface StatsCardsProps {
  sureBetsCount: number
  allMarketsCount: number
  matchesScanned: number
  bestProfit: number
  isLoading: boolean
}

export function StatsCards({
  sureBetsCount,
  allMarketsCount,
  matchesScanned,
  bestProfit,
  isLoading,
}: StatsCardsProps) {
  const cards = [
    {
      label: "Mercados Encontrados",
      value: isLoading ? "--" : String(allMarketsCount),
      icon: BarChart3,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Sure Bets",
      value: isLoading ? "--" : String(sureBetsCount),
      icon: Target,
      color: "text-profit",
      bgColor: "bg-profit/10",
    },
    {
      label: "Jogos Analisados",
      value: isLoading ? "--" : String(matchesScanned),
      icon: Search,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Melhor Lucro",
      value: isLoading ? "--" : bestProfit > 0 ? `${bestProfit}%` : "0%",
      icon: TrendingUp,
      color: bestProfit > 0 ? "text-profit" : "text-muted-foreground",
      bgColor: bestProfit > 0 ? "bg-profit/10" : "bg-muted",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.bgColor}`}
            >
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <span className="text-xs text-muted-foreground">
              {card.label}
            </span>
          </div>
          <p
            className={`mt-3 font-mono text-2xl font-bold ${card.color}`}
          >
            {card.value}
          </p>
        </div>
      ))}
    </div>
  )
}
