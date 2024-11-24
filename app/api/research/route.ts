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
        max_tokens: 1024,
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
      `You are a professional writer and podcaster. I need you to craft an award-winning, engaging, and thought-provoking podcast script based on the following information:

- **Research Overview**: ${research.paragraph}
- **Web Results**: ${data.web.results}
- **Analysis Insights**: ${research.analysis}

### Host (Speaker 1)
- Role: Expert guide and storyteller
- Personality Traits:
  * Knowledgeable but approachable
  * Enthusiastic about sharing insights
  * Uses metaphors and analogies effectively
  * Occasionally self-deprecating
  * Responds thoughtfully to questions
- Speech Patterns:
  * Varied pace and emphasis
  * Clear articulation
  * Strategic pauses for emphasis
  * Occasional verbal backtracking for authenticity

### Co-Host (Speaker 2)
- Role: Curious learner and audience surrogate
- Personality Traits:
  * Genuinely interested
  * Quick-witted
  * Asks insightful questions
  * Shares relatable perspectives
  * Occasionally challenges assumptions
  * Occasionally adds related and relevant facts or figures 
  * Natural speech patterns with strategic pauses 
- Speech Patterns:
  * Natural reactions ("Hmm", "Oh!", "Wait...")
  * Brief interjections
  * Thinking out loud
  * Casual tone

## Episode Structure

1. Opening (5 min)
    - Welcome and topic introduction
    - Personal connection
    - Episode overview
2. Main Content (20 min)
    - Foundation/Background
    - Key Insights/Analysis
    - Future Implications
3. Closing (5 min)
    - Key takeaways
    - Personal reflections
    - Sign off

## Writing Guidelines

### Content Balance

- 60% Core education
- 20% Stories/examples
- 10% Humor
- 10% Questions/clarification

### Natural Dialogue Elements

- Include micro-interruptions
- Use collaborative thinking ("So what you're saying is...")
- Add real-time processing moments
- Include false starts occasionally
- Build running themes/callbacks

### Voice Optimization

- Write for 145 words per minute
- Use ALL CAPS sparingly for emphasis
- Include pauses (...) for natural breaks
- Break long sentences into segments
- Use contractions (I'm, you're, isn't)

 Minimum 3,750 to 4,250 words. strictly follow the guidelines below:

The script should be written as a dynamic conversation between two hosts, keeping the tone lively, engaging, and accessible. The discussion should feel natural and captivating for a broad audience, sustaining interest for a duration of approximately 25 minutes. 

Incorporate storytelling elements, insightful observations, and a mix of facts and anecdotes to make the podcast both educational and entertaining. Structure the content with clear transitions and ensure the dialogue flows seamlessly, keeping the audience hooked throughout.`
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
