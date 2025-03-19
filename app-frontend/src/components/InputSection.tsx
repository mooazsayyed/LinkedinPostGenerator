import React, { useState } from 'react';
import { FileTextIcon, YoutubeIcon, RefreshCwIcon, Trash2Icon, AlertCircleIcon } from 'lucide-react';

interface InputSectionProps {
  inputType: 'blog' | 'video';
  setInputType: (type: 'blog' | 'video') => void;
  inputUrl: string;
  setInputUrl: (url: string) => void;
  inputContent: string;
  setInputContent: (content: string) => void;
  generatedContent: string;  // New prop for handling generated content
  isLoading: boolean;
  onGenerate: () => void;
  onClear: () => void;
}

export const InputSection: React.FC<InputSectionProps> = ({
  inputType,
  setInputType,
  inputUrl,
  setInputUrl,
  inputContent,
  setInputContent,
  generatedContent,
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
    <div className="p-6 bg-white rounded-lg shadow-sm max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
        Convert Content to LinkedIn Post
      </h2>

      {/* Input Type Toggle Buttons */}
      <div className="flex justify-center space-x-4 mb-8">
        <button
          className={`flex items-center px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            inputType === 'blog' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
          onClick={() => setInputType('blog')}
        >
          <FileTextIcon className="h-4 w-4 mr-2" />
          Blog Post / Webpage
        </button>

        <button
          className={`flex items-center px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            inputType === 'video' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
          onClick={() => setInputType('video')}
        >
          <YoutubeIcon className="h-4 w-4 mr-2" />
          Video
        </button>
      </div>

      {/* URL Input */}
      <div className="mb-6">
        <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
          {inputType === 'blog' ? 'Blog Post / Webpage URL' : 'Video URL'}
        </label>
        <div className="relative">
          <input
            type="url"
            id="url"
            className={`w-full px-4 py-2.5 border ${
              urlError ? 'border-red-300' : 'border-gray-200'
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200`}
            placeholder={inputType === 'blog' ? 'https://example.com/blog-post' : 'https://youtube.com/watch?v=...'}
            value={inputUrl}
            onChange={handleUrlChange}
          />
          {urlError && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <AlertCircleIcon className="h-5 w-5 text-red-500" />
            </div>
          )}
        </div>
        {urlError && <p className="mt-1 text-sm text-red-500">{urlError}</p>}
      </div>

      {/* Content Textarea */}
      <div className="mb-6">
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
          {inputType === 'blog' ? 'Or paste article content' : 'Or paste video transcript'}
        </label>
        <textarea
          id="content"
          rows={5}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200"
          placeholder={
            inputType === 'blog' ? 'Paste your article content here...' : 'Paste your video transcript here...'
          }
          value={inputContent}
          onChange={(e) => setInputContent(e.target.value)}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <button
          className={`flex items-center px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
            isLoading || (!inputUrl && !inputContent) || urlError
              ? 'bg-blue-300 text-white cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
          }`}
          onClick={onGenerate}
          disabled={isLoading || (!inputUrl && !inputContent) || !!urlError}
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
