import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase, isSupabaseConfigured } from "@/services/supabase";

export async function POST(req) {
    const { searchInput, searchResult, recordId } = await req.json();
    
    const geminiApiKey = process.env.NODE_ENV === 'production' 
        ? process.env.GEMINI_API_KEY
        : (process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY);
    
    if (!geminiApiKey) {
        return NextResponse.json(
            { error: 'Gemini API key not configured' },
            { status: 500 }
        );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            try {
                const genAI = new GoogleGenerativeAI(geminiApiKey);
                const model = genAI.getGenerativeModel({ 
                    model: "gemini-2.0-flash-exp" 
                });

                const prompt = `Based on the following search results about "${searchInput}", create a comprehensive, well-formatted markdown summary.

Search Results:
${JSON.stringify(searchResult, null, 2)}

Please provide a detailed answer with:
- Clear markdown formatting with headers (##, ###)
- Bullet points for lists
- Proper paragraph breaks
- Citations to sources when relevant

Answer:`;

                const result = await model.generateContentStream(prompt);
                let fullText = '';

                for await (const chunk of result.stream) {
                    const chunkText = chunk.text();
                    fullText += chunkText;
                    
                    // Send chunk to client
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ text: chunkText })}\n\n`)
                    );
                }

                // Save complete response to database
                if (isSupabaseConfigured() && recordId) {
                    try {
                        await supabase
                            .from('Chats')
                            .update({ aiResp: fullText })
                            .eq('id', recordId);
                    } catch (dbError) {
                        console.error('Error saving to database:', dbError);
                    }
                }

                // Send completion signal
                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
                );
                controller.close();

            } catch (error) {
                console.error('Streaming error:', error);
                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`)
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
