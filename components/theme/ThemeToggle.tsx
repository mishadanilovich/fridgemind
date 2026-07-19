"use client";

import { useTheme } from "@/components/theme/ThemeProvider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { isTheme } from "@/lib/theme";

const OPTIONS = [
  { value: "light", label: "Светлая" },
  { value: "dark", label: "Тёмная" },
  { value: "system", label: "Как в системе" },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <ToggleGroup
      type="single"
      value={theme}
      onValueChange={(value) => {
        if (isTheme(value)) setTheme(value);
      }}
      className="w-full gap-1.5 rounded-md border border-border bg-card p-1"
    >
      {OPTIONS.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className="h-auto min-w-0 flex-1 rounded-sm px-1.5 py-2.5 text-[12.5px] font-bold text-muted-foreground"
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
