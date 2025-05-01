import React from 'react';

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

interface OutputSectionProps {
    linkedInPosts: LinkedInPost[];
    error: string;
    copiedIndex: number | null;
    onCopy: (text: string, index: number) => void;
}

const OutputSection: React.FC<OutputSectionProps> = ({
    linkedInPosts,
    error,
    copiedIndex,
    onCopy,
}) => {
    if (error) {
        return <div className="text-red-500 text-center p-4">{error}</div>;
    }

    // Function to clean markdown formatting
    const cleanContent = (content: string) => {
        return content.replace(/\*\*/g, '');
    };

    // Function to format the post content
    const formatPostContent = (content: string) => {
        const cleanedContent = cleanContent(content);
        const paragraphs = cleanedContent.split('\n\n').filter(p => p.trim());
        
        // Extract hashtags if they exist at the end
        const lastParagraph = paragraphs[paragraphs.length - 1];
        const hashtagRegex = /((?:#\w+\s*)+)$/;
        const hashtagMatch = lastParagraph?.match(hashtagRegex);
        
        let mainContent = paragraphs;
        let hashtags = '';
        
        if (hashtagMatch) {
            // Remove hashtags from the last paragraph
            mainContent[mainContent.length - 1] = lastParagraph.replace(hashtagRegex, '').trim();
            hashtags = hashtagMatch[0];
        }

        return {
            mainContent: mainContent.filter(p => p.trim()),
            hashtags
        };
    };

    return (
        <div className="space-y-6">
            {linkedInPosts.length === 0 ? (
                <p className="text-gray-500 text-center">No content available</p>
            ) : (
                linkedInPosts.map((post, index) => {
                    const { mainContent, hashtags } = formatPostContent(post.content);
                    
                    return (
                        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 max-w-2xl mx-auto">
                            <div className="relative">
                                {/* LinkedIn-style post content */}
                                <div className="text-gray-800 space-y-4 pr-16 font-linkedin">
                                    {mainContent.map((paragraph, pIndex) => {
                                        // Check if paragraph looks like a heading (starts with # or is short and ends with ?)
                                        const isHeading = pIndex === 0 && (
                                            paragraph.startsWith('#') || 
                                            (paragraph.length < 100 && paragraph.endsWith('?'))
                                        );

                                        if (isHeading) {
                                            return (
                                                <h1 key={pIndex} className="text-xl font-semibold leading-tight">
                                                    {paragraph.replace(/^#\s*/, '')}
                                                </h1>
                                            );
                                        }

                                        // Handle bullet points
                                        if (paragraph.includes('•') || paragraph.includes('-')) {
                                            const points = paragraph
                                                .split(/[•-]/)
                                                .filter(point => point.trim());
                                            
                                            return (
                                                <ul key={pIndex} className="list-disc pl-4 space-y-2">
                                                    {points.map((point, i) => (
                                                        <li key={i} className="text-base leading-relaxed">
                                                            {point.trim()}
                                                        </li>
                                                    ))}
                                                </ul>
                                            );
                                        }

                                        return (
                                            <p key={pIndex} className="text-base leading-relaxed">
                                                {paragraph}
                                            </p>
                                        );
                                    })}
                                    
                                    {/* Hashtags section */}
                                    {hashtags && (
                                        <div className="text-blue-600 text-sm mt-4">
                                            {hashtags}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => onCopy(cleanContent(post.content), index)}
                                    className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 text-sm rounded-md hover:bg-blue-600 transition-colors"
                                >
                                    {copiedIndex === index ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default OutputSection;