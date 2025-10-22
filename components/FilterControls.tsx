import React from 'react';
import type { FilterOptions } from '../types';
import { FilterIcon } from './Icons';

interface FilterControlsProps {
  filters: FilterOptions;
  onFilterChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({ filters, onFilterChange }) => {
  return (
    <div className="max-w-4xl mx-auto mb-10 bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-300 mb-4 flex items-center gap-3">
        <FilterIcon className="h-6 w-6 text-cyan-400" />
        <span>高级筛选</span>
      </h2>
      <div>
        <div>
          <label htmlFor="subTopic" className="block text-sm font-medium text-gray-400 mb-1">
            主题词 (文章将围绕此核心主题，自动包含英文同义词)
          </label>
          <input
            type="text"
            name="subTopic"
            id="subTopic"
            value={filters.subTopic}
            onChange={onFilterChange}
            placeholder="人工智能, 区块链, 宏观经济..."
            className="w-full bg-gray-900/50 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-gray-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
        </div>
      </div>
    </div>
  );
};

export default FilterControls;