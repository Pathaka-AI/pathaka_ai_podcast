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

// Modify askClaude function to include timeout
const askClaude = async (
  prompt: string,
  options: Record<string, any> = {}
): Promise<any> => {
  const maxRetries = 2; // Reduced from 3
  const baseDelay = 500; // Reduced from 1000
  const timeout = 8000; // 8 seconds timeout

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Claude API timeout")), timeout)
  );

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const anthropic = new Anthropic({
        apiKey: process.env.NEXT_CLAUDE_API_KEY,
      });

      const defaultParams = {
        model: "claude-3-sonnet-20240229",
        max_tokens: 750, // Reduced from 1024
        temperature: 0.7,
        messages: [{ role: "user", content: prompt }],
      };

      const params: any = { ...defaultParams, ...options };

      // Race between API call and timeout
      const response: any = await Promise.race([
        anthropic.messages.create(params),
        timeoutPromise,
      ]);

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
    const braveApiKey = process.env.NEXT_BRAVE_API_KEY;
    if (!braveApiKey) {
      throw new Error("Missing Brave API key");
    }

    const headers = {
      Accept: "application/json",
      "X-Subscription-Token": braveApiKey,
    };
    if (!headers) {
      throw new Error("Missing Brave API headers");
    }
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Error from Brave API: ${response.statusText}`);
    }

    const data: Data = await response.json();
    const research = generateResearchParagraph(data);

    const createResearchParagraph = await askClaude(
      `As a professional writer, create a concise, engaging podcast script (max 1000 words) discussing:
      ${research.paragraph}
      
      Format as a brief conversation between two hosts, focusing on key insights and main points.`,
      { max_tokens: 750 }
    );

    return NextResponse.json({
      research: createResearchParagraph,
      brave_search_results: data.web.results,
    });
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
