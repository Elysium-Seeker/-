import React, { useState, useCallback } from 'react';
import { fetchDigitalEconomyArticles } from './services/geminiService';
import type { Article, GroundingSource, FilterOptions } from './types';
import ArticleCard from './components/ArticleCard';
import LoadingSpinner from './components/LoadingSpinner';
import FilterControls from './components/FilterControls';
import { BookOpenIcon, LinkIcon, SearchIcon, AlertTriangleIcon } from './components/Icons';

const App: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [groundingSources, setGroundingSources] = useState<GroundingSource[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [filters, setFilters] = useState<FilterOptions>({
    subTopic: '',
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleFetchArticles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setArticles([]);
    setGroundingSources([]);

    try {
      const result = await fetchDigitalEconomyArticles(filters);
      if (result.articles.length === 0) {
        setError("模型未根据指定条件返回任何文章。请尝试使用不同的筛选条件重试。");
      } else {
        setArticles(result.articles);
        setGroundingSources(result.sources);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生未知错误。');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-10">
          <div className="flex items-center justify-center gap-4 mb-4">
            <BookOpenIcon className="h-10 w-10 text-cyan-400" />
            <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">
              数字经济文摘
            </h1>
          </div>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            您的宏观战略研究助理。专注于国家级、国际化的数字经济研究，优先提供学术论文和深度行业报告，并确保中英文文献均衡呈现，为您提供全球化的深度洞察。
          </p>
        </header>

        <main>
          <FilterControls filters={filters} onFilterChange={handleFilterChange} />

          <div className="flex justify-center mb-12">
            <button
              onClick={handleFetchArticles}
              disabled={isLoading}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  <span>搜索中...</span>
                </>
              ) : (
                <>
                  <SearchIcon className="h-6 w-6" />
                  <span>查找文章</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="max-w-2xl mx-auto bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative text-center" role="alert">
              <div className="flex items-center justify-center gap-2">
                <AlertTriangleIcon className="h-5 w-5"/>
                <span className="block sm:inline">{error}</span>
              </div>
            </div>
          )}

          {!isLoading && !error && hasSearched && articles.length === 0 && (
             <div className="text-center text-gray-500">
              <p>未找到符合当前条件的文章。</p>
              <p>请调整您的筛选条件并重试。</p>
            </div>
          )}

          {articles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article, index) => (
                <ArticleCard key={index} article={article} />
              ))}
            </div>
          )}
          
          {groundingSources.length > 0 && (
            <div className="mt-16 pt-8 border-t border-gray-700">
              <h2 className="text-2xl font-semibold text-center text-gray-300 mb-6 flex items-center justify-center gap-3">
                <LinkIcon className="h-7 w-7 text-cyan-400" />
                <span>引用来源</span>
              </h2>
              <div className="max-w-4xl mx-auto bg-gray-800/50 rounded-lg p-6">
                <ul className="space-y-3">
                  {groundingSources.map((source, index) => (
                     <li key={index} className="flex items-start gap-3">
                       <span className="text-cyan-400 pt-1">&#8226;</span>
                       <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 hover:underline transition-colors break-all">
                         {source.title || source.uri}
                       </a>
                     </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </main>
        
        <footer className="text-center mt-16 pt-6 border-t border-gray-800">
            <p className="text-gray-500 text-sm">由 Gemini AI 驱动。注意：不支持PDF生成；请从源链接保存文章/论文。</p>
        </footer>
      </div>
    </div>
  );
};

export default App;