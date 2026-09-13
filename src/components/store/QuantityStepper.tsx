import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}

export function QuantityStepper({ value, onChange, min = 1, max = 99 }: Props) {
  return (
    <div className="inline-flex items-center rounded-md border border-input" role="group" aria-label="Controle de quantidade">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-9 w-9 rounded-r-none"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Diminuir quantidade"
      >
        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
      <span className="w-10 text-center text-sm font-medium tabular-nums" aria-live="polite" aria-atomic="true">
        {value}
      </span>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-9 w-9 rounded-l-none"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Aumentar quantidade"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
    </div>
  );
}
