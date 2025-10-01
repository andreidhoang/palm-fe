import React from 'react'
import ReactMarkdown from 'react-markdown'

function DisplaySummery({ aiResp, citations = [] }) {
    // Parse citations in the format [1], [2], etc. and make them clickable
    const renderTextWithCitations = (text) => {
        if (!text) return null;
        
        const citationPattern = /\[(\d+)\]/g;
        const parts = [];
        let lastIndex = 0;
        let match;
        
        while ((match = citationPattern.exec(text)) !== null) {
            const beforeText = text.substring(lastIndex, match.index);
            if (beforeText) {
                parts.push(beforeText);
            }
            
            const citationNumber = parseInt(match[1]);
            const citation = citations[citationNumber - 1];
            
            parts.push(
                <sup key={`citation-${match.index}`}>
                    <a
                        href={citation?.url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-medium"
                        title={citation?.title || `Source ${citationNumber}`}
                    >
                        [{citationNumber}]
                    </a>
                </sup>
            );
            
            lastIndex = match.index + match[0].length;
        }
        
        if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
        }
        
        return parts.length > 0 ? parts : text;
    };

    return (
        <div className='mt-7'>
            {!aiResp &&
                <div>
                    <div className='w-full h-5 bg-accent animate-pulse rounded-md'></div>
                    <div className='w-1/2 mt-2 h-5 bg-accent animate-pulse rounded-md'></div>
                    <div className='w-[70%] mt-2 h-5 bg-accent animate-pulse rounded-md'></div>

                </div>}
            <ReactMarkdown
                components={{
                    h1: ({ node, ...props }) => (
                        <h1 className="text-4xl font-bold text-gray-600 mb-4 leading-snug" {...props} />
                    ),
                    h2: ({ node, ...props }) => (
                        <h2 className="text-3xl font-semibold text-gray-600 mb-3 leading-snug" {...props} />
                    ),
                    h3: ({ node, ...props }) => (
                        <h3 className="text-2xl font-semibold text-gray-600 mt-4 mb-2 leading-tight" {...props} />
                    ),
                    p: ({ node, children, ...props }) => {
                        const processChildren = (children) => {
                            if (typeof children === 'string') {
                                return renderTextWithCitations(children);
                            }
                            if (Array.isArray(children)) {
                                return children.map((child, i) => 
                                    typeof child === 'string' ? renderTextWithCitations(child) : child
                                );
                            }
                            return children;
                        };
                        
                        return (
                            <p className="text-gray-700 leading-relaxed mb-4" {...props}>
                                {processChildren(children)}
                            </p>
                        );
                    },
                    a: ({ node, ...props }) => (
                        <a
                            className="text-blue-800 underline hover:text-gray-600"
                            target="_blank"
                            rel="noreferrer"
                            {...props}
                        />
                    ),
                    ul: ({ node, ...props }) => (
                        <ul className="list-disc list-inside space-y-2 leading-relaxed" {...props} />
                    ),
                    li: ({ node, ...props }) => (
                        <li className="mb-1" {...props} />
                    ),
                    blockquote: ({ node, ...props }) => (
                        <blockquote className="bg-gray-100 p-4 rounded-lg text-gray-700 leading-relaxed mb-6" {...props} />
                    ),
                    table: ({ node, ...props }) => (
                        <table className="table-auto w-full text-sm text-gray-700 border-collapse border border-gray-300" {...props} />
                    ),
                    th: ({ node, ...props }) => (
                        <th className="border border-gray-300 px-4 py-2 bg-gray-100 text-left" {...props} />
                    ),
                    td: ({ node, ...props }) => (
                        <td className="border border-gray-300 px-4 py-2" {...props} />
                    ),
                    code: ({ node, inline, className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                            // <SyntaxHighlighter
                            //     style={okaidia}
                            //     language={match[1]}
                            //     PreTag="div"
                            //     className="rounded-md overflow-auto"
                            // >
                            <div>{children}</div>
                            // </SyntaxHighlighter>
                        ) : (
                            <code className="bg-gray-100 p-1 rounded-md" {...props}>
                                {children}
                            </code>
                        );
                    },
                }}
            >
                {aiResp}
            </ReactMarkdown>

        </div>
    )
}

export default DisplaySummery