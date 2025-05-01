import React, { useState } from 'react';
import { RefreshCwIcon, Trash2Icon, AlertCircleIcon, Link2Icon } from 'lucide-react';

interface InputSectionProps {
  inputType: 'blog' | 'video'; // Will be ignored in new UI
  setInputType: (type: 'blog' | 'video') => void; // Will be ignored in new UI
  inputUrl: string;
  setInputUrl: (url: string) => void;
  inputContent: string; // Will be ignored in new UI
  setInputContent: (content: string) => void; // Will be ignored in new UI
  generatedContent: string;
  isLoading: boolean;
  onGenerate: () => void;
  onClear: () => void;
}

export const InputSection: React.FC<InputSectionProps> = ({
  inputUrl,
  setInputUrl,
  isLoading,
  onGenerate,
  onClear,
}) => {
  const [urlError, setUrlError] = useState('');

  const validateUrl = (url: string) => {
    if (!url) {
      setUrlError('');
      return;
    }
    try {
      new URL(url);
      setUrlError('');
    } catch (e) {
      setUrlError('Please enter a valid URL');
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setInputUrl(url);
    validateUrl(url);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm max-w-xl mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
        LinkedIn Post Generator
      </h2>
      <div className="mb-6">
        <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
          Paste a blog or YouTube URL
        </label>
        <div className="relative">
          <input
            type="url"
            id="url"
            className={`w-full px-4 py-2.5 border ${urlError ? 'border-red-300' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200`}
            placeholder="https://example.com/blog-post or https://youtube.com/watch?v=..."
            value={inputUrl}
            onChange={handleUrlChange}
            autoFocus
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <Link2Icon className="h-5 w-5 text-gray-300" />
          </div>
          {urlError && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <AlertCircleIcon className="h-5 w-5 text-red-500" />
            </div>
          )}
        </div>
        {urlError && <p className="mt-1 text-sm text-red-500">{urlError}</p>}
      </div>
      <div className="flex justify-center space-x-4">
        <button
          className={`flex items-center px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
            isLoading || !inputUrl || urlError
              ? 'bg-blue-300 text-white cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
          }`}
          onClick={onGenerate}
          disabled={isLoading || !inputUrl || !!urlError}
        >
          {isLoading ? (
            <>
              <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate LinkedIn Post'
          )}
        </button>
        <button
          className="flex items-center px-6 py-2.5 bg-gray-50 text-gray-600 rounded-full hover:bg-gray-100 transition-all duration-200 text-sm font-medium"
          onClick={onClear}
        >
          <Trash2Icon className="h-4 w-4 mr-2" />
          Clear
        </button>
      </div>
    </div>
  );
};
