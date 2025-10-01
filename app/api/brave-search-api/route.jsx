import axios from "axios";
import { NextResponse } from "next/server";

export async function POST(req) {
    const { searchInput, searchType } = await req.json();

    if (!searchInput) {
        return NextResponse.json(
            { error: 'Please pass user search query' },
            { status: 400 }
        )
    }

    if (!process.env.TAVILY_API_KEY) {
        return NextResponse.json({ 
            error: 'Tavily API key is not configured. Please add TAVILY_API_KEY to your environment variables.',
            web: { results: [] }
        }, { status: 503 })
    }

    try {
        // Call Tavily API
        const result = await axios.post('https://api.tavily.com/search', {
            api_key: process.env.TAVILY_API_KEY,
            query: searchInput,
            max_results: 8,
            search_depth: searchType === 'research' ? 'advanced' : 'basic',
            include_answer: true,
            include_images: true,
            include_raw_content: false
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        // Transform Tavily response to match Brave format for compatibility
        const tavilyData = result.data;
        const transformedResponse = {
            web: {
                results: tavilyData.results?.map(item => ({
                    title: item.title,
                    url: item.url,
                    description: item.content,
                    thumbnail: {
                        src: item.thumbnail,
                        original: item.thumbnail
                    }
                })) || []
            },
            answer: tavilyData.answer,
            images: tavilyData.images
        };

        console.log('Tavily search results:', transformedResponse);
        return NextResponse.json(transformedResponse)
    } catch (error) {
        console.error('Tavily Search API error:', error.message);
        console.error('Error details:', error.response?.data);
        return NextResponse.json({ 
            error: 'Failed to fetch search results: ' + error.message,
            details: error.response?.data,
            web: { results: [] }
        }, { status: 502 })
    }
}