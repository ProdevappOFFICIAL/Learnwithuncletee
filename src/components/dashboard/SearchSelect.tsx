import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export interface SearchOption {
  id: string;
  label: string;
  hint?: string;
}

/**
 * Lightweight searchable combobox used by the course-assignment wizard.
 * No extra dependencies: type to filter, arrow keys + Enter to pick.
 */
export const SearchSelect = ({
  label,
  placeholder = 'Search...',
  items,
  value,
  onChange,
  disabled = false,
  loading = false,
  emptyText = 'No matches found.',
}: {
  label: string;
  placeholder?: string;
  items: SearchOption[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  loading?: boolean;
  emptyText?: string;
}) => {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const selected = useMemo(() => items.find((item) => item.id === value) ?? null, [items, value]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) =>
      `${item.label} ${item.hint ?? ''}`.toLowerCase().includes(needle),
    );
  }, [items, query]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, items]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  const choose = (option: SearchOption) => {
    onChange(option.id);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div ref={wrapRef} className="relative">
      <label className="block text-sm font-semibold" htmlFor={`${listId}-input`}>
        {label}
      </label>
      <div className="relative mt-2">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          size={15}
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id={`${listId}-input`}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          value={open ? query : selected?.label ?? ''}
          placeholder={selected ? selected.label : placeholder}
          disabled={disabled}
          onFocus={() => {
            if (disabled) return;
            setOpen(true);
            setQuery('');
          }}
          onClick={() => {
            if (disabled || open) return;
            setOpen(true);
            setQuery('');
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setOpen(false);
              return;
            }
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              if (!open) {
                setOpen(true);
                setQuery('');
                return;
              }
              setActiveIndex((index) => Math.min(index + 1, Math.max(filtered.length - 1, 0)));
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
            }
            if (event.key === 'Enter' && open) {
              const option = filtered[activeIndex];
              if (option) {
                event.preventDefault();
                choose(option);
              }
            }
          }}
          className="min-h-11 w-full rounded border border-line bg-white pl-9 pr-9 text-sm outline-none focus:border-brand-500 disabled:bg-cream disabled:text-muted"
        />
        {selected && !disabled ? (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setQuery('');
              setOpen(false);
            }}
            aria-label={`Clear ${label}`}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-ink"
          >
            <X size={14} aria-hidden="true" />
          </button>
        ) : (
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
            size={15}
            aria-hidden="true"
          />
        )}
      </div>

      {open && !disabled && (
        <ul
          id={listId}
          role="listbox"
          className="scroll-db absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded border border-line bg-white py-1 shadow-lg"
        >
          {loading ? (
            <li className="px-3 py-2 text-xs text-muted">Loading...</li>
          ) : filtered.length === 0 ? (
            <li className="px-3 py-2 text-xs text-muted">{emptyText}</li>
          ) : (
            filtered.map((option, index) => (
              <li
                key={option.id}
                role="option"
                aria-selected={option.id === value}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(option)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex cursor-pointer items-start justify-between gap-2 px-3 py-2 text-left text-sm ${
                  index === activeIndex ? 'bg-brand-50' : 'bg-white'
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-ink">{option.label}</span>
                  {option.hint && <span className="mt-0.5 block truncate text-xs text-muted">{option.hint}</span>}
                </span>
                {option.id === value && (
                  <Check className="mt-0.5 shrink-0 text-brand-700" size={15} aria-hidden="true" />
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};
