import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// OpenAI client will be initialized inside the POST function

export async function POST(request: NextRequest) {
  try {
    const { query, context } = await request.json();

    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    let searchResults: any[] = [];
    let hasSearchData = false;
    let searchSource = '';

    // Try multiple search approaches
    console.log(`[SEARCH] Searching for: "${query}"`);

    // Method 1: Try Serper.dev (Google Search API) - free tier available
    if (!hasSearchData && process.env.SERPER_API_KEY) {
      try {
        const serperResponse = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': process.env.SERPER_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: query,
            num: 5
          })
        });

        if (serperResponse.ok) {
          const serperData = await serperResponse.json();
          if (serperData.organic) {
            searchResults = serperData.organic.slice(0, 3).map((result: any) => ({
              title: result.title,
              url: result.link,
              description: result.snippet,
              published: result.date || 'Recent'
            }));
            hasSearchData = true;
            searchSource = 'Google (Serper)';
          }
        }
      } catch (error) {
        console.log('Serper API failed:', error);
      }
    }

    // Method 2: Try SearchAPI (free tier)
    if (!hasSearchData && process.env.SEARCHAPI_KEY) {
      try {
        const searchApiResponse = await fetch(`https://www.searchapi.io/api/v1/search?api_key=${process.env.SEARCHAPI_KEY}&query=${encodeURIComponent(query)}&limit=5`);
        
        if (searchApiResponse.ok) {
          const searchApiData = await searchApiResponse.json();
          if (searchApiData.organic_results) {
            searchResults = searchApiData.organic_results.slice(0, 3).map((result: any) => ({
              title: result.title,
              url: result.link,
              description: result.snippet,
              published: result.date || 'Recent'
            }));
            hasSearchData = true;
            searchSource = 'SearchAPI';
          }
        }
      } catch (error) {
        console.log('SearchAPI failed:', error);
      }
    }

    // Method 3: Wikipedia API for general knowledge queries
    if (!hasSearchData) {
      try {
        // Try direct search first
        console.log(`[SEARCH] Trying Wikipedia direct search for: "${query}"`);
        const wikiResponse = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
        
        if (wikiResponse.ok) {
          const wikiData = await wikiResponse.json();
          if (wikiData.extract) {
            searchResults = [{
              title: wikiData.title,
              url: wikiData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
              description: wikiData.extract,
              published: 'Wikipedia'
            }];
            hasSearchData = true;
            searchSource = 'Wikipedia';
            console.log(`[SEARCH] Wikipedia direct search found: ${wikiData.title}`);
          }
        }
        
        // If direct search fails, try Wikipedia search API for better results
        if (!hasSearchData) {
          console.log(`[SEARCH] Trying Wikipedia search API for: "${query}"`);
          const searchTerms = query.toLowerCase().includes('ai') || query.toLowerCase().includes('artificial intelligence') 
            ? 'Artificial intelligence' 
            : query.replace(/current|latest|trends?|for|in|2024|2025/gi, '').trim();
          
          const wikiSearchResponse = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerms)}`);
          
          if (wikiSearchResponse.ok) {
            const wikiSearchData = await wikiSearchResponse.json();
            if (wikiSearchData.extract) {
              searchResults = [{
                title: wikiSearchData.title,
                url: wikiSearchData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(searchTerms)}`,
                description: wikiSearchData.extract,
                published: 'Wikipedia'
              }];
              hasSearchData = true;
              searchSource = 'Wikipedia';
              console.log(`[SEARCH] Wikipedia search API found: ${wikiSearchData.title}`);
            }
          }
        }
      } catch (error) {
        console.log('Wikipedia search failed:', error);
      }
    }

    // Method 4: Try alternative search using Bing API (if available)
    if (!hasSearchData && process.env.BING_SEARCH_API_KEY) {
      try {
        const bingResponse = await fetch(`https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=5`, {
          headers: {
            'Ocp-Apim-Subscription-Key': process.env.BING_SEARCH_API_KEY
          }
        });

        if (bingResponse.ok) {
          const bingData = await bingResponse.json();
          if (bingData.webPages?.value) {
            searchResults = bingData.webPages.value.slice(0, 3).map((result: any) => ({
              title: result.name,
              url: result.url,
              description: result.snippet,
              published: result.dateLastCrawled || 'Recent'
            }));
            hasSearchData = true;
            searchSource = 'Bing';
          }
        }
      } catch (error) {
        console.log('Bing search failed:', error);
      }
    }

    console.log(`[SEARCH] Found ${searchResults.length} results from ${searchSource || 'no source'}`);

    // Create AI summary with search results
    const searchContext = hasSearchData 
      ? `Search Results from ${searchSource}:\n\n${searchResults.map(r => `Title: ${r.title}\nURL: ${r.url}\nDescription: ${r.description}\n`).join('\n')}`
      : 'No current search results available. Responding with general knowledge only.';

    // Initialize OpenAI client
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      return NextResponse.json({ 
        success: true,
        query,
        aiResponse: "Search completed but AI analysis unavailable due to configuration.",
        searchResults,
        hasLiveData: hasSearchData,
        searchSource: searchSource || 'none',
        timestamp: new Date().toISOString()
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You're a business strategist AI assistant. ${hasSearchData ? 'Use the search results to provide current, accurate information. Always cite sources when referencing search data.' : 'No current search data is available. Provide general knowledge with clear disclaimers that information may not be current.'}`
        },
        {
          role: "user",
          content: `Search query: "${query}"

Context: ${context || 'General business inquiry'}

${searchContext}

Please provide a comprehensive answer${hasSearchData ? ' based on the search results above, citing specific sources when possible' : ' using your general knowledge, but clearly state that you don\'t have access to current information'}.`
        }
      ],
      temperature: 0.3,
      max_tokens: 400
    });

    const aiResponse = completion.choices[0].message.content || "I couldn't process that query properly.";

    return NextResponse.json({
      success: true,
      query,
      aiResponse,
      searchResults,
      hasLiveData: hasSearchData,
      searchSource: searchSource || 'none',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({
      error: 'Search failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}