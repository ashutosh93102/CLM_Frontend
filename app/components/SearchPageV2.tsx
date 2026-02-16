'use client';

import React, { useState } from 'react';
import DashboardLayout from './DashboardLayout';
import { Bell } from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  type: 'contract' | 'template' | 'clause';
  matches: number;
  excerpt: string;
  relevance: number;
}

const SearchPageV2: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([
    {
      id: '1',
      title: 'Service Agreement - Tech Services',
      type: 'contract',
      matches: 3,
      excerpt: '...service provider shall provide technical support services as outlined in Section 3...',
      relevance: 95,
    },
    {
      id: '2',
      title: 'Confidentiality Clause',
      type: 'clause',
      matches: 2,
      excerpt: '...information shall be kept confidential and not disclosed to third parties...',
      relevance: 88,
    },
  ]);
  const [searchType, setSearchType] = useState<string>('all');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate search
    console.log('Searching for:', query);
  };

  const filteredResults =
    searchType === 'all'
      ? results
      : results.filter((r) => r.type === searchType);

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      contract: 'bg-blue-50 text-blue-700',
      template: 'bg-purple-50 text-purple-700',
      clause: 'bg-amber-50 text-amber-700',
    };
    return colors[type] || 'bg-slate-50 text-slate-700';
  };

  const getRelevanceColor = (relevance: number) => {
    if (relevance >= 90) return 'text-emerald-600';
    if (relevance >= 75) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Search</h1>
        <button
          className="w-11 h-11 rounded-full bg-white border border-slate-200 inline-flex items-center justify-center"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-slate-700" />
        </button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contracts, templates, clauses..."
            className="w-full px-6 py-4 text-lg border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </form>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {[
          { label: 'All', value: 'all' },
          { label: 'Contracts', value: 'contract' },
          { label: 'Templates', value: 'template' },
          { label: 'Clauses', value: 'clause' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSearchType(tab.value)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              searchType === tab.value
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Results Count */}
      {query && (
        <div className="mb-6 text-slate-600">
          Found <span className="font-semibold text-slate-900">{filteredResults.length}</span> result
          {filteredResults.length !== 1 ? 's' : ''} for "{query}"
        </div>
      )}

      {/* Search Results */}
      <div className="space-y-4">
        {filteredResults.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-slate-600 text-lg">
              {query ? 'No results found' : 'Start typing to search'}
            </p>
          </div>
        ) : (
          filteredResults.map((result) => (
            <div
              key={result.id}
              className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {result.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {result.excerpt}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(
                      result.type
                    )}`}
                  >
                    {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Relevance:</span>
                  <span className={`font-semibold ${getRelevanceColor(result.relevance)}`}>
                    {result.relevance}%
                  </span>
                </div>
                <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      result.relevance >= 90
                        ? 'bg-emerald-500'
                        : result.relevance >= 75
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${result.relevance}%` }}
                  />
                </div>
                <span className="text-slate-600">
                  {result.matches} match{result.matches !== 1 ? 'es' : ''}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
};

export default SearchPageV2;
