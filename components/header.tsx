import { Radar, Activity } from "lucide-react"

export function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Radar className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              Radar SureBet
            </h1>
            <p className="text-xs text-muted-foreground">
              Arbitragem esportiva em tempo real
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5">
            <Activity className="h-3.5 w-3.5 text-profit" />
            <span className="text-xs font-medium text-muted-foreground">
              Scanner ativo
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
