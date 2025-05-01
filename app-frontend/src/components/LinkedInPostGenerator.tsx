import React, { useState } from 'react';
import { InputSection } from './InputSection';
import OutputSection from './OutputSection';

interface LinkedInPost {
    content: string;
    title?: string;
    metadata?: {
        model: string;
        provider: string;
        usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
        source?: {
            type: string;
            url: string;
        };
    };
}

export const LinkedInPostGenerator: React.FC = () => {
    const [inputUrl, setInputUrl] = useState('');
    const [linkedInPosts, setLinkedInPosts] = useState<LinkedInPost[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    // Helper to detect YouTube URLs
    const isYouTubeUrl = (url: string) => {
        return /(?:youtube\.com\/.*v=|youtu\.be\/)/i.test(url);
    };

    const handleGenerate = async () => {
        if (isLoading) return;
        setIsLoading(true);
        setError('');
        setLinkedInPosts([]);

        try {
            if (!inputUrl.trim()) {
                throw new Error('Please provide a valid URL.');
            }

            // Detect endpoint
            const apiUrl = isYouTubeUrl(inputUrl)
                ? 'http://localhost:3000/process/youtube'
                : 'http://localhost:3000/process/blog';

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: inputUrl })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || `Failed to fetch: ${response.status}`);
            }

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to process content');
            }

            const newPost: LinkedInPost = {
                content: data.data.linkedInPost,
                metadata: {
                    model: data.data.metadata.model,
                    provider: data.data.metadata.provider,
                    usage: data.data.metadata.usage,
                    source: data.data.metadata.source
                }
            };

            setLinkedInPosts([newPost]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            console.error('Error generating LinkedIn posts:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = () => {
        setInputUrl('');
        setLinkedInPosts([]);
        setError('');
        setIsLoading(false);
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
            <InputSection
                inputType={"blog"} // ignored
                setInputType={() => {}} // ignored
                inputUrl={inputUrl}
                setInputUrl={setInputUrl}
                inputContent={""} // ignored
                setInputContent={() => {}} // ignored
                generatedContent={linkedInPosts.length > 0 ? linkedInPosts[0].content : ''}
                isLoading={isLoading}
                onGenerate={handleGenerate}
                onClear={handleClear}
            />
            {isLoading && (
                <div className="text-center text-gray-500">
                    Generating LinkedIn post...
                </div>
            )}
            {linkedInPosts.length > 0 && !isLoading && (
                <OutputSection
                    linkedInPosts={linkedInPosts}
                    error={error}
                    copiedIndex={copiedIndex}
                    onCopy={copyToClipboard}
                />
            )}
            {error && (
                <div className="text-red-500 text-center p-4 bg-red-50 rounded-lg">
                    {error}
                </div>
            )}
        </div>
    );
};
