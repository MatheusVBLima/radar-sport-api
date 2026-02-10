import { SearchX, Target } from "lucide-react"

interface EmptyStateProps {
  mode: "all" | "surebet"
}

export function EmptyState({ mode }: EmptyStateProps) {
  const isSureBet = mode === "surebet"

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        {isSureBet ? (
          <Target className="h-7 w-7 text-muted-foreground" />
        ) : (
          <SearchX className="h-7 w-7 text-muted-foreground" />
        )}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">
        {isSureBet
          ? "Nenhuma sure bet encontrada"
          : "Nenhum mercado encontrado"}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {isSureBet
          ? "No momento, nenhuma oportunidade de arbitragem foi detectada. Sure bets sao raras - tente a aba \"Todos os Mercados\" para ver comparacoes de odds entre casas."
          : "Nenhuma partida com odds de multiplas casas foi encontrada para os filtros selecionados. Tente mudar o esporte ou as casas de aposta."}
      </p>
    </div>
  )
}
