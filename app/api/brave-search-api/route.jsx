import axios from "axios";
import { NextResponse } from "next/server";

export async function POST(req) {
    const { searchInput, searchType } = await req.json();

    if (!searchInput) {
        return NextResponse.json({ error: 'Please pass user search query' })
    }

    if (!process.env.BRAVE_API_KEY) {
        return NextResponse.json({ 
            error: 'Brave Search API key is not configured. Please add BRAVE_API_KEY to your environment variables.',
            web: { results: [] }
        })
    }

    try {
        const result = await axios.get('https://api.search.brave.com/res/v1/web/search?q=' + searchInput + '&count=8', {
            headers: {
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip',
                'X-Subscription-Token': process.env.BRAVE_API_KEY
            }
        });

        console.log(result.data);
        return NextResponse.json(result.data)
    } catch (error) {
        console.error('Brave Search API error:', error.message);
        return NextResponse.json({ 
            error: 'Failed to fetch search results: ' + error.message,
            web: { results: [] }
        })
    }
}