import React from 'react';

interface OutputSectionProps {
  linkedInPosts: { content: string; title?: string }[];
  error: string;
  copiedIndex: number | null;
  onCopy: (text: string, index: number) => void;
}

const OutputSection: React.FC<OutputSectionProps> = ({ 
  linkedInPosts, 
  error, 
  copiedIndex, 
  onCopy 
}) => {
  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {linkedInPosts.length === 0 ? (
        <p className="text-gray-500 text-center">No content available</p>
      ) : (
        linkedInPosts.map((post, index) => {
          // Extract the first line as the title
          const firstLineEnd = post.content.indexOf('\n');
          const title = firstLineEnd !== -1 ? post.content.substring(0, firstLineEnd) : post.content;
          const content = firstLineEnd !== -1 ? post.content.substring(firstLineEnd + 1) : '';

          return (
            <div key={index} className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="p-6">
                {/* Render the first line as a bold title */}
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  {title}
                </h3>
                {/* Render the remaining content */}
                <p className="text-gray-600 whitespace-pre-wrap">{content}</p>
              </div>
              <div className="bg-gray-50 px-6 py-4">
                <button
                  onClick={() => onCopy(post.content, index)}
                  className={`w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                    copiedIndex === index ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  {copiedIndex === index ? 'Copied!' : 'Copy to Clipboard'}
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