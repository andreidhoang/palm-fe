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
                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    // Use stream: true to handle multi-byte characters across chunks
                    buffer += decoder.decode(value, { stream: true });
                    
                    // Split by \n\n to get complete SSE events
                    const events = buffer.split('\n\n');
                    // Keep the last incomplete event in the buffer
                    buffer = events.pop() || '';

                    for (const event of events) {
                        const lines = event.split('\n').filter(line => line.trim() !== '');
                        
                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                const data = line.slice(6).trim();
                                
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

                                    // Extract citations from final message (not delta)
                                    if (parsed.choices?.[0]?.message?.citations) {
                                        citations = parsed.choices[0].message.citations;
                                    }

                                    // Extract images from final message
                                    if (parsed.choices?.[0]?.message?.images) {
                                        images = parsed.choices[0].message.images;
                                    }

                                    // Check if this is the final event (finish_reason)
                                    if (parsed.choices?.[0]?.finish_reason === 'stop') {
                                        // Citations are in the message
                                        if (parsed.choices[0].message?.citations) {
                                            citations = parsed.choices[0].message.citations;
                                        }
                                        if (parsed.choices[0].message?.images) {
                                            images = parsed.choices[0].message.images;
                                        }
                                    }

                                } catch (parseError) {
                                    console.error('Error parsing SSE event:', parseError, 'Data:', data);
                                }
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
