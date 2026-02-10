"use client"

import { cn } from "@/lib/utils"

const SPORTS = [
  { id: 1, name: "Futebol", icon: "F" },
  { id: 2, name: "Basquete", icon: "B" },
  { id: 5, name: "Tenis", icon: "T" },
  { id: 4, name: "Hockey", icon: "H" },
  { id: 23, name: "Volei", icon: "V" },
  { id: 6, name: "Handebol", icon: "Hb" },
]

interface SportSelectorProps {
  selected: number
  onChange: (sportId: number) => void
}

export function SportSelector({ selected, onChange }: SportSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SPORTS.map((sport) => (
        <button
          key={sport.id}
          onClick={() => onChange(sport.id)}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
            selected === sport.id
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
          )}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded bg-muted text-xs font-bold">
            {sport.icon}
          </span>
          {sport.name}
        </button>
      ))}
    </div>
  )
}
