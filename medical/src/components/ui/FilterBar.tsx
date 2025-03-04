import React, { ReactNode } from 'react';
import { Search, Filter } from 'lucide-react';

interface FilterOption {
  id: string;
  label: string;
}

interface FilterBarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  options: FilterOption[];
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  searchValue?: string;
  extraControls?: ReactNode;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  activeFilter,
  onFilterChange,
  options,
  searchPlaceholder = 'Search...',
  onSearchChange,
  searchValue = '',
  extraControls,
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-between backdrop-blur-xl bg-white/5 rounded-xl p-4 
      border border-white/10 ${className}`}>
      <div className="flex gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onFilterChange(option.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              activeFilter === option.id
                ? 'bg-blue-500/80 text-white shadow-lg border border-blue-400/20'
                : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/5'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {onSearchChange && (
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm 
                focus:outline-none focus:border-blue-500/50 text-white placeholder-white/40
                backdrop-blur-sm"
            />
          </div>
        )}
        {extraControls}
        <button className="p-2 text-white/60 hover:text-white/90 transition-colors">
          <Filter className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};