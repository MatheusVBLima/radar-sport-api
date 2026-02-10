import { SearchX } from "lucide-react"

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        <SearchX className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">
        Nenhuma sure bet encontrada
      </h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        No momento, nenhuma oportunidade de arbitragem foi detectada para os filtros selecionados. 
        Tente mudar o esporte ou as casas de aposta, ou aguarde novas partidas.
      </p>
    </div>
  )
}
