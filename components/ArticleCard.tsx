import React from 'react';
import type { Article } from '../types';
import { LinkIcon } from './Icons';

interface ArticleCardProps {
  article: Article;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-lg p-6 flex flex-col h-full hover:border-cyan-500 transition-all duration-300 transform hover:-translate-y-1">
      <h3 className="text-xl font-bold text-cyan-300 mb-3">{article.title}</h3>
      <p className="text-gray-300 text-sm flex-grow mb-4">{article.summary}</p>
      <div className="mt-auto pt-4 border-t border-gray-700/50">
        <a
          href={article.source}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          <LinkIcon className="h-4 w-4" />
          <span>阅读全文</span>
        </a>
      </div>
    </div>
  );
};

export default ArticleCard;