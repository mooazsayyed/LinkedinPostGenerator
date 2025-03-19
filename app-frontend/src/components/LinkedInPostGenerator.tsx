import React, { useState } from 'react';
import { InputSection } from './InputSection';
import OutputSection from './OutputSection';

interface LinkedInPost {
  content: string;
  title?: string;
}

export const LinkedInPostGenerator: React.FC = () => {
  const [inputType, setInputType] = useState<'blog' | 'video'>('blog');
  const [inputUrl, setInputUrl] = useState('');
  const [inputContent, setInputContent] = useState('');
  const [linkedInPosts, setLinkedInPosts] = useState<LinkedInPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (isLoading) return; // Prevent duplicate API calls
    setIsLoading(true);
    setError('');
    setLinkedInPosts([]); // Clear previous posts

    try {
        if (!inputUrl.trim()) {
            throw new Error('Please provide a valid URL.');
        }

        // Determine API endpoint based on inputType
        const apiUrl = inputType === 'blog'
            ? 'http://localhost:3000/process/blog'
            : 'http://localhost:3000/process/youtube';

        const response = await fetch(apiUrl, {
            method: 'POST',  
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: inputUrl }) // Send URL in request body
        });

        if (!response.ok) {
            const errorMessage = await response.text(); // Extract detailed error message
            throw new Error(`Failed to fetch: ${response.status} - ${errorMessage}`);
        }

        const data = await response.json();
        console.log('API Response:', data); // Debugging API response

        // Handle both response formats dynamically
        const processedContent = data.processedContent || data.aiResponse;

        if (!processedContent) {
            throw new Error('Invalid response received from the API.');
        }

        // Store the processed content in linkedInPosts
        setLinkedInPosts([{ content: processedContent }]);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error('Error generating LinkedIn posts:', err);
    } finally {
        setIsLoading(false);
    }
};

  const handleClear = () => {
    setInputUrl('');
    setInputContent('');
    setLinkedInPosts([]); 
    setError('');
    setIsLoading(false); // Ensure loading state is reset
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      },
      () => {
        console.error('Failed to copy text');
      }
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Input Section */}
      <InputSection
        inputType={inputType}
        setInputType={setInputType}
        inputUrl={inputUrl}
        setInputUrl={setInputUrl}
        inputContent={inputContent}
        setInputContent={setInputContent}
        generatedContent={linkedInPosts.length > 0 ? linkedInPosts[0].content : ''}
        isLoading={isLoading}
        onGenerate={handleGenerate}
        onClear={handleClear}
      />

      {/* Loading Indicator */}
      {isLoading && (
        <div className="text-center text-gray-500">Generating post...</div>
      )}

      {/* Output Section */}
      {linkedInPosts.length > 0 && !isLoading && (
        <OutputSection 
          linkedInPosts={linkedInPosts} 
          error={error} 
          copiedIndex={copiedIndex} 
          onCopy={copyToClipboard} 
        />
      )}

      {/* Error Message */}
      {error && (
        <div className="text-red-500 text-center">{error}</div>
      )}
    </div>
  );
};
