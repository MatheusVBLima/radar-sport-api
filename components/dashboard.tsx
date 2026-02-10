"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import { RefreshCw, DollarSign, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { SportSelector } from "@/components/sport-selector"
import { HouseSelector } from "@/components/house-selector"
import { StatsCards } from "@/components/stats-cards"
import { SureBetCard } from "@/components/surebet-card"
import { EmptyState } from "@/components/empty-state"
import { LoadingSkeleton } from "@/components/loading-skeleton"
import type { SureBet } from "@/lib/sport-radar"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const INVESTMENT_PRESETS = [50, 100, 250, 500, 1000, 5000]

export function Dashboard() {
  const [sportId, setSportId] = useState(1)
  const [houses, setHouses] = useState(["bet365", "betfair", "betano"])
  const [investmentAmount, setInvestmentAmount] = useState(100)
  const [customAmount, setCustomAmount] = useState("")
  const [filtersOpen, setFiltersOpen] = useState(true)

  const queryKey = `/api/surebet?sportId=${sportId}&houses=${houses.join(",")}`

  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<{ sureBets: SureBet[]; matchesScanned: number; oddsCollected: number }>(
    queryKey,
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 120000,
      dedupingInterval: 30000,
    }
  )

  const sureBets = data?.sureBets ?? []
  const matchesScanned = data?.matchesScanned ?? 0
  const bestProfit = sureBets.length > 0 ? sureBets[0].profit : 0

  const handleRefresh = useCallback(() => {
    mutate()
  }, [mutate])

  const handleAmountChange = (amount: number) => {
    setInvestmentAmount(amount)
    setCustomAmount("")
  }

  const handleCustomAmount = (value: string) => {
    setCustomAmount(value)
    const num = parseFloat(value)
    if (!isNaN(num) && num > 0) {
      setInvestmentAmount(num)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      {/* Filters Section */}
      <div className="rounded-xl border border-border bg-card">
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="flex w-full items-center justify-between p-4"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              Filtros e Configuracao
            </span>
          </div>
          {filtersOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {filtersOpen && (
          <div className="space-y-5 border-t border-border px-4 pb-5 pt-4">
            {/* Sport Selection */}
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Esporte
              </label>
              <SportSelector selected={sportId} onChange={setSportId} />
            </div>

            {/* Betting Houses */}
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Casas de aposta (min. 2)
              </label>
              <HouseSelector selected={houses} onChange={setHouses} />
            </div>

            {/* Investment Amount */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <DollarSign className="h-3 w-3" />
                Valor do investimento (R$)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {INVESTMENT_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleAmountChange(preset)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 font-mono text-sm font-medium transition-all",
                      investmentAmount === preset && customAmount === ""
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    R${preset}
                  </button>
                ))}
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground">
                    R$
                  </span>
                  <input
                    type="number"
                    placeholder="Outro"
                    value={customAmount}
                    onChange={(e) => handleCustomAmount(e.target.value)}
                    className="h-9 w-28 rounded-lg border border-border bg-muted pl-8 pr-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* Scan Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className={cn(
                  "flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50",
                  isLoading && "cursor-wait"
                )}
              >
                <RefreshCw
                  className={cn("h-4 w-4", isLoading && "animate-spin")}
                />
                {isLoading ? "Analisando..." : "Buscar Sure Bets"}
              </button>
              {data && (
                <span className="text-xs text-muted-foreground">
                  {matchesScanned} jogos analisados, {data.oddsCollected ?? 0}{" "}
                  com odds coletadas
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="mt-6">
        <StatsCards
          sureBetsCount={sureBets.length}
          matchesScanned={matchesScanned}
          bestProfit={bestProfit}
          isLoading={isLoading}
        />
      </div>

      {/* Results */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Oportunidades de Arbitragem
          </h2>
          {sureBets.length > 0 && (
            <span className="rounded-md bg-profit/10 px-2 py-1 text-xs font-medium text-profit">
              {sureBets.length} encontrada{sureBets.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-loss/30 bg-loss/5 p-4">
            <p className="text-sm text-loss">
              Erro ao buscar dados. Tente novamente em alguns segundos.
            </p>
          </div>
        )}

        {isLoading && <LoadingSkeleton />}

        {!isLoading && !error && sureBets.length === 0 && <EmptyState />}

        {!isLoading && sureBets.length > 0 && (
          <div className="space-y-3">
            {sureBets.map((sb) => (
              <SureBetCard
                key={`${sb.matchId}-${sb.market}`}
                sureBet={sb}
                investmentAmount={investmentAmount}
              />
            ))}
          </div>
        )}
      </div>

      {/* How it works section */}
      <div className="mt-10 rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground">
          Como funciona o Radar SureBet?
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 font-mono text-sm font-bold text-primary">
              1
            </div>
            <h4 className="mt-3 text-sm font-medium text-foreground">
              Coleta de Odds
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Coletamos as odds de diversas casas de aposta em tempo real usando a API do SportRadar.
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 font-mono text-sm font-bold text-primary">
              2
            </div>
            <h4 className="mt-3 text-sm font-medium text-foreground">
              Calculo de Arbitragem
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Cruzamos as odds e identificamos quando a soma das probabilidades implicitas e menor que 100%.
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 font-mono text-sm font-bold text-primary">
              3
            </div>
            <h4 className="mt-3 text-sm font-medium text-foreground">
              Distribuicao de Stakes
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Calculamos exatamente quanto apostar em cada resultado para garantir lucro independente do resultado.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
