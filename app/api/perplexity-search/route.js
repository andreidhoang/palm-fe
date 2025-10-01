import { NextResponse } from "next/server";

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_BASE_URL = "https://api.perplexity.ai";

export async function POST(req) {
    const { searchInput, recordId } = await req.json();
    
    if (!PERPLEXITY_API_KEY) {
        return NextResponse.json(
            { error: 'Perplexity API key not configured' },
            { status: 500 }
        );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            try {
                // Call Perplexity Sonar model with streaming
                const response = await fetch(`${PERPLEXITY_BASE_URL}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'sonar',
                        messages: [
                            {
                                role: 'system',
                                content: 'Be precise and concise. Provide well-structured answers with proper markdown formatting.'
                            },
                            {
                                role: 'user',
                                content: searchInput
                            }
                        ],
                        stream: true,
                        return_citations: true,
                        return_images: true,
                        search_recency_filter: 'month'
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Perplexity API error: ${response.statusText}`);
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let fullText = '';
                let citations = [];
                let images = [];

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n').filter(line => line.trim() !== '');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            
                            if (data === '[DONE]') {
                                continue;
                            }

                            try {
                                const parsed = JSON.parse(data);
                                
                                // Extract content delta
                                if (parsed.choices?.[0]?.delta?.content) {
                                    const content = parsed.choices[0].delta.content;
                                    fullText += content;
                                    
                                    // Send content chunk to client
                                    controller.enqueue(
                                        encoder.encode(`data: ${JSON.stringify({ 
                                            type: 'content',
                                            text: content 
                                        })}\n\n`)
                                    );
                                }

                                // Extract citations when finished
                                if (parsed.citations) {
                                    citations = parsed.citations;
                                }

                                // Extract images
                                if (parsed.images) {
                                    images = parsed.images;
                                }

                            } catch (parseError) {
                                console.error('Error parsing SSE chunk:', parseError);
                            }
                        }
                    }
                }

                // Send citations and images
                if (citations.length > 0) {
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ 
                            type: 'citations',
                            citations: citations 
                        })}\n\n`)
                    );
                }

                if (images.length > 0) {
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ 
                            type: 'images',
                            images: images 
                        })}\n\n`)
                    );
                }

                // Send completion signal with full data
                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ 
                        type: 'done',
                        fullText,
                        citations,
                        images,
                        recordId
                    })}\n\n`)
                );
                
                controller.close();

            } catch (error) {
                console.error('Perplexity streaming error:', error);
                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ 
                        type: 'error',
                        error: error.message 
                    })}\n\n`)
                );
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
