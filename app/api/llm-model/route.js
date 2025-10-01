import { inngest } from "@/inngest/client";
import { NextResponse } from "next/server";

export async function POST(req) {
    const { searchInput, searchResult, recordId } = await req.json();
    console.log(searchInput, recordId)
    
    try {
        const inngestRunId = await inngest.send({
            name: "llm-model",
            data: {
                searchInput: searchInput,
                searchResult: searchResult,
                recordId: recordId
            },
        });

        return NextResponse.json(inngestRunId.ids[0]);
    } catch (error) {
        console.error('Inngest error (AI response generation disabled):', error.message);
        // Return success even if Inngest fails - search results are already saved
        return NextResponse.json({ 
            success: true, 
            message: 'Search completed. AI response generation is currently unavailable.',
            error: error.message 
        });
    }
}