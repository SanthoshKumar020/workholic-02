"use client";
import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComboboxProps {
  label?: string;
  placeholder?: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
  allowCustom?: boolean;
  hint?: string;
}

export function Combobox({
  label,
  placeholder = "Search or type…",
  options,
  value,
  onChange,
  allowCustom = true,
  hint,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        if (allowCustom && query && query !== value) onChange(query);
        else if (!query) onChange("");
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [query, value, onChange, allowCustom]);

  const filtered = query
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  function select(opt: string) {
    onChange(opt);
    setQuery(opt);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      {label && <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>}
      <div className={cn(
        "flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm",
        "focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100",
        open && "border-brand-400 ring-2 ring-brand-100"
      )}>
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          placeholder={placeholder}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "Enter" && filtered[0]) { e.preventDefault(); select(filtered[0]); }
          }}
        />
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform cursor-pointer", open && "rotate-180")}
          onClick={() => setOpen((o) => !o)}
        />
      </div>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}

      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          {filtered.slice(0, 50).map((opt) => (
            <li
              key={opt}
              onMouseDown={(e) => { e.preventDefault(); select(opt); }}
              className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-brand-50"
            >
              <Check className={cn("h-4 w-4 text-brand-600 shrink-0", value === opt ? "opacity-100" : "opacity-0")} />
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
