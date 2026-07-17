import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
};

export function SearchInput({ value, onChange, placeholder, className }: Props) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        inputMode="search"
        enterKeyHint="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-11 pl-10 pr-10"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Очистить поиск"
          className="pressable absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
