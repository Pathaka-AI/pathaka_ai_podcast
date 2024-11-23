import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

interface WebResult {
  title: string;
  description?: string;
}

interface Data {
  web: {
    results: WebResult[];
  };
  query: {
    original: string;
  };
}

interface ResearchParagraph {
  paragraph: string;
  analysis: {
    topWords: string[];
  };
}

// Function to generate a research paragraph from data
function generateResearchParagraph(data: Data): ResearchParagraph {
  const wordFrequency: Record<string, number> = {};
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
  ]);

  const results = data.web.results || []; // Adjust to your API's structure

  // Process all titles and descriptions
  results.forEach((result: WebResult) => {
    const text = `${result.title} ${result.description || ""}`.toLowerCase();

    text.split(/\W+/).forEach((word) => {
      if (word.length > 3 && !stopWords.has(word)) {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      }
    });
  });

  // Identify top topics
  const topWords = Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);

  // Construct a summary paragraph
  const paragraph = `
        The topic '${
          data.query.original
        }' has been discussed widely, with recurring themes such as 
        ${topWords
          .slice(0, 5)
          .join(
            ", "
          )}. These terms frequently appeared in analyses and summaries.
    `
    .replace(/\s+/g, " ")
    .trim();

  return {
    paragraph,
    analysis: {
      topWords,
    },
  };
}

// Create reusable function for Claude interactions
const askClaude = async (
  prompt: string,
  options: Record<string, any> = {}
): Promise<any> => {
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const anthropic = new Anthropic({
        apiKey: process.env.NEXT_CLAUDE_API_KEY,
      });

      const defaultParams = {
        model: "claude-3-sonnet-20240229",
        max_tokens: 3000,
        temperature: 0.7,
        messages: [{ role: "user", content: prompt }],
      };

      const params: any = { ...defaultParams, ...options };
      const response: any = await anthropic.messages.create(params);

      console.log("Claude Response Generated:", {
        prompt_length: prompt.length,
        response_length: response.content[0].text.length,
        model: params.model,
        attempt: attempt + 1,
      });

      return response;
    } catch (error: any) {
      const isOverloaded = error.message.includes("overloaded");
      const isLastAttempt = attempt === maxRetries - 1;

      console.warn(`Claude API attempt ${attempt + 1} failed:`, error.message);

      if (isOverloaded && !isLastAttempt) {
        const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
        console.log(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw new Error(`Claude API Error: ${error.message}`);
    }
  }
};

// Convert Express route to Next.js route handler
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  // For demo purposes
  const DEMO = "History about Sanskrit Language";
  const searchQuery = query;

  if (!searchQuery) {
    return NextResponse.json(
      {
        error: "Missing search query",
      },
      { status: 400 }
    );
  }

  try {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(
      searchQuery
    )}`;
    const apiKey = process.env.NEXT_BRAVE_API_KEY;
    if (!apiKey) {
      throw new Error("Missing Brave API key");
    }

    const headers = {
      Accept: "application/json",
      "X-Subscription-Token": apiKey,
    };
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Error from Brave API: ${response.statusText}`);
    }

    const data: Data = await response.json();
    const research = generateResearchParagraph(data);

    const createResearchParagraph = await askClaude(`
You are an expert podcast scriptwriter. Create an engaging conversation between two hosts about ${searchQuery} using this research:

CONTEXT:
- Research Summary: ${research.paragraph}
- Source Material: ${data.web.results}
- Key Topics: ${research.analysis.topWords.join(", ")}

Create a natural 25-minute conversation following this exact format:
{
    "title": "Your Title Here",
    "conversation": [
        {"host1": "Opening line..."},
        {"host2": "Response..."},
        {"host1": "Next line..."},
        {"host2": "Next response..."}
        // continue alternating dialogue
    ]
}

REQUIREMENTS:
1. Natural, flowing conversation
2. Include specific facts and examples from the research
3. Maintain casual, friendly tone while being informative
4. Cover all key topics from the research
5. Each exchange should build on the previous one
6. Include 15-20 exchanges to fill 25 minutes
7. Return ONLY the JSON object - no additional text

Return ONLY valid JSON matching the above format.`);

    // Extract and validate the JSON response
    const podcastScript = createResearchParagraph.content[0].text;
    let parsedScript;
    try {
      parsedScript = JSON.parse(podcastScript);

      // Validate required structure
      if (!parsedScript.title || !Array.isArray(parsedScript.conversation)) {
        throw new Error("Invalid script structure");
      }

      return NextResponse.json({
        research: parsedScript,
        brave_search_results: data.web.results,
      });
    } catch (error) {
      console.error("Failed to parse Claude response:", error);
      throw new Error("Failed to generate valid podcast script");
    }
  } catch (error: any) {
    console.error("Error processing request:", error.message);
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
