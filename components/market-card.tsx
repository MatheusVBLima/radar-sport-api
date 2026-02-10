"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Clock, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MarketComparison } from "@/lib/sport-radar"

interface MarketCardProps {
  market: MarketComparison
}

const HOUSE_COLORS: Record<string, string> = {
  bet365: "#027b5b",
  betfair: "#ffb80c",
  betano: "#e8233a",
  betway: "#00a826",
  "888sport": "#1e8c6e",
  sportingbet: "#f7b500",
  rivalo: "#ff6600",
}

export function MarketCard({ market }: MarketCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card transition-all hover:border-primary/30",
        market.isSureBet ? "border-profit/40" : "border-border"
      )}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                market.isSureBet ? "bg-profit/10" : "bg-primary/10"
              )}
            >
              <BarChart3
                className={cn(
                  "h-5 w-5",
                  market.isSureBet ? "text-profit" : "text-primary"
                )}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-semibold text-foreground">
                  {market.home} vs {market.away}
                </h3>
                {market.isSureBet && (
                  <span className="shrink-0 rounded-md bg-profit/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-profit">
                    Sure Bet
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {market.startTime || "A definir"}
                </span>
                <span>{market.league}</span>
                <span className="rounded bg-muted px-1.5 py-0.5 font-medium">
                  {market.market}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p
                className={cn(
                  "font-mono text-lg font-bold",
                  market.isSureBet
                    ? "text-profit"
                    : market.margin < 3
                      ? "text-warning"
                      : "text-muted-foreground"
                )}
              >
                {market.margin > 0 ? "+" : ""}
                {market.margin}%
              </p>
              <p className="text-xs text-muted-foreground">
                {market.isSureBet ? "lucro garantido" : "margem"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm font-medium text-foreground">
                {market.outcomes.length} outcomes
              </p>
              <p className="text-xs text-muted-foreground">
                {new Set(market.outcomes.flatMap((o) => o.allOdds.map((a) => a.house))).size} casas
              </p>
            </div>
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border bg-muted/30 p-4">
          <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Comparacao de odds por outcome
          </div>
          <div className="space-y-3">
            {market.outcomes.map((outcome) => (
              <div key={outcome.name} className="rounded-lg border border-border bg-card p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    {outcome.name}
                  </span>
                  <span className="font-mono text-sm font-bold text-primary">
                    Melhor: {outcome.bestOdds.toFixed(2)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {outcome.allOdds.map((odd) => {
                    const isBest = odd.odds === outcome.bestOdds
                    return (
                      <div
                        key={`${odd.house}-${odd.odds}`}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-3 py-1.5",
                          isBest
                            ? "border-profit/40 bg-profit/5"
                            : "border-border bg-muted/50"
                        )}
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: HOUSE_COLORS[odd.house] || "#888" }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {odd.houseName}
                        </span>
                        <span
                          className={cn(
                            "font-mono text-sm font-bold",
                            isBest ? "text-profit" : "text-foreground"
                          )}
                        >
                          {odd.odds.toFixed(2)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-lg bg-muted/50 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Prob. implicita total:</span>
              <span
                className={cn(
                  "font-mono font-bold",
                  market.isSureBet ? "text-profit" : "text-foreground"
                )}
              >
                {(market.totalImpliedProbability * 100).toFixed(2)}%
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Margem da casa:</span>
              <span
                className={cn(
                  "font-mono font-bold",
                  market.isSureBet
                    ? "text-profit"
                    : market.margin < 3
                      ? "text-warning"
                      : "text-loss"
                )}
              >
                {market.margin > 0 ? "+" : ""}
                {market.margin}%
              </span>
            </div>
            {market.margin < 3 && !market.isSureBet && (
              <p className="mt-2 text-xs text-warning">
                Margem baixa - proximo de uma oportunidade de arbitragem.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
