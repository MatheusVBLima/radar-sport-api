"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, TrendingUp, Clock, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SureBet } from "@/lib/sport-radar"

interface SureBetCardProps {
  sureBet: SureBet
  investmentAmount: number
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

export function SureBetCard({ sureBet, investmentAmount }: SureBetCardProps) {
  const [expanded, setExpanded] = useState(false)

  const scaleFactor = investmentAmount / 100

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/30">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-profit/10">
              <TrendingUp className="h-5 w-5 text-profit" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-semibold text-foreground">
                  {sureBet.home} vs {sureBet.away}
                </h3>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {sureBet.startTime || "A definir"}
                </span>
                <span>{sureBet.league}</span>
                <span className="rounded bg-muted px-1.5 py-0.5 font-medium">
                  {sureBet.market}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-mono text-xl font-bold text-profit">
                +{sureBet.profit}%
              </p>
              <p className="text-xs text-muted-foreground">
                lucro garantido
              </p>
            </div>
            <div className="text-right">
              <p className="flex items-center gap-1 font-mono text-lg font-bold text-foreground">
                <DollarSign className="h-4 w-4" />
                {(sureBet.profit * scaleFactor).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                em R${investmentAmount}
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
          <div className="mb-3 flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              Como apostar (investimento de R${investmentAmount}):
            </span>
          </div>
          <div className="space-y-2">
            {sureBet.bets.map((bet, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        HOUSE_COLORS[bet.bettingHouse] || "#888",
                    }}
                  />
                  <div>
                    <span className="text-sm font-semibold text-foreground">
                      {bet.bettingHouseName}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {bet.outcome}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="font-mono text-sm font-bold text-foreground">
                      {bet.odds.toFixed(2)}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      odd
                    </p>
                  </div>
                  <div className="text-center">
                    <p className={cn("font-mono text-sm font-bold", "text-warning")}>
                      R${(bet.stake * scaleFactor).toFixed(2)}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      apostar
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="font-mono text-sm font-bold text-profit">
                      R${(bet.potentialReturn * scaleFactor).toFixed(2)}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      retorno
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-lg border border-profit/20 bg-profit/5 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Investimento total:
              </span>
              <span className="font-mono text-sm font-bold text-foreground">
                R${investmentAmount.toFixed(2)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Retorno garantido:
              </span>
              <span className="font-mono text-sm font-bold text-profit">
                R${(investmentAmount * (1 + sureBet.profit / 100)).toFixed(2)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Lucro liquido:
              </span>
              <span className="font-mono text-lg font-bold text-profit">
                +R${(investmentAmount * (sureBet.profit / 100)).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
