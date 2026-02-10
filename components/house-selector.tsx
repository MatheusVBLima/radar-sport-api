"use client"

import { cn } from "@/lib/utils"

const HOUSES = [
  { id: "bet365", name: "Bet365", color: "#027b5b" },
  { id: "betfair", name: "Betfair", color: "#ffb80c" },
  { id: "betano", name: "Betano", color: "#e8233a" },
  { id: "betway", name: "Betway", color: "#00a826" },
  { id: "888sport", name: "888sport", color: "#1e8c6e" },
  { id: "sportingbet", name: "Sportingbet", color: "#f7b500" },
  { id: "rivalo", name: "Rivalo", color: "#ff6600" },
]

interface HouseSelectorProps {
  selected: string[]
  onChange: (houses: string[]) => void
}

export function HouseSelector({ selected, onChange }: HouseSelectorProps) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      if (selected.length > 2) {
        onChange(selected.filter((h) => h !== id))
      }
    } else {
      onChange([...selected, id])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {HOUSES.map((house) => {
        const isSelected = selected.includes(house.id)
        return (
          <button
            key={house.id}
            onClick={() => toggle(house.id)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
              isSelected
                ? "border-primary/50 bg-card text-foreground"
                : "border-border bg-card text-muted-foreground opacity-50 hover:opacity-75"
            )}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: house.color }}
            />
            {house.name}
          </button>
        )
      })}
    </div>
  )
}
