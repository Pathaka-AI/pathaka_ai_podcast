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
        max_tokens: 1500,
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

    //     const createResearchParagraph = await askClaude(`
    // You are an expert podcast scriptwriter. Create an engaging conversation between two hosts about ${searchQuery} using this research:

    // CONTEXT:
    // - Research Summary: ${research.paragraph}
    // - Source Material: ${data.web.results}
    // - Key Topics: ${research.analysis.topWords.join(", ")}

    // Create a natural 25-minute conversation following this exact format:
    // {
    //     "title": "Your Title Here",
    //     "conversation": [
    //         {"host1": "Opening line..."},
    //         {"host2": "Response..."},
    //         {"host1": "Next line..."},
    //         {"host2": "Next response..."}
    //         // continue alternating dialogue
    //     ]
    // }

    // REQUIREMENTS:
    // 1. Natural, flowing conversation
    // 2. Include specific facts and examples from the research
    // 3. Maintain casual, friendly tone while being informative
    // 4. Cover all key topics from the research
    // 5. Each exchange should build on the previous one
    // 6. Include 15-20 exchanges to fill 25 minutes
    // 7. Return ONLY the JSON object - no additional text

    // Return ONLY valid JSON matching the above format.`);

    const createResearchParagraph = await askClaude(
      `You are a professional writer and podcaster. I need you to craft an award-winning, engaging, and thought-provoking podcast script based on the following information:
- **Research Overview**: ${research.paragraph}      
- **Web Results**: ${data.web.results}
- **Analysis Insights**: ${research.analysis}
 Each line should be a JSON object within an array.
                  Use id: 1 for Speaker 1 and id: 2 for Speaker 2.
                  Example of Structure each object in the array as follows:
                  Just give me simple JSON object with id and text key value pair.
                  Stricly follow the below format.
                  [
                  {
                    "id": 1,
                    "text": "Welcome to today's episode, folks, where we're diving into the history of one of the most iconic games of all time - Minecraft. I'm your host, and I'm super excited to share with you the story of how this sandbox sensation was born. And joining me is someone who's new to the Minecraft universe, Ben, so let's get into it. Hi, Ben, ready to dig in?"
                  },
                  {
                    "id": 2,
                    "text": "Yeah, I'm here, I've heard of Minecraft, but I've never actually played it. I've seen all the builds and creations online, but that's about it.\n\nSpeaker 1: Well, that's perfect, because I'm going to start at the very beginning. So, Minecraft was created by Markus Persson, also known as Notch, and released in 2009 as an indie sandbox game."
                  },
                  {
                    "id": 1,
                    "text": "Hmm, I'd imagine it's like, a game where you can just build and play around without any rules, right? Like, you're given a bunch of blocks or tools, and you just experiment and see what happens?"
                  }
                  ]

                  Starts responce with [ 
                  Ends with ]

                  Avoid any special characters or escape sequences like \n, \t, or \n'.
                  Keep responses humorous and engaging to enhance the listener's experience.

                  ## QUALITY GUIDELINES

                  1. Conversational Elements:
                  - Use contractions (I'm, you're, isn't)
                  - Include false starts occasionally
                  - Add thinking sounds naturally
                  - Incorporate relevant personal anecdotes

                  2. Educational Components:
                  - Break complex ideas into digestible chunks
                  - Use relevant metaphors
                  - Provide real-world examples
                  - Reference familiar concepts

                  3. Engagement Techniques:
                  - Create mini-cliffhangers between segments
                  - Use callback references to earlier points
                  - Include unexpected facts or perspectives
                  - Build running jokes or themes

                  4. TTS Optimization:
                  - Avoid ambiguous abbreviations
                  - Use full words instead of numbers
                  - Clear pronunciation guidance for unusual terms
                  - Consistent speaker identification

                  ## CONTENT BALANCE

                  Maintain these ratios:
                  - 60% Core content/education
                  - 20% Personal stories/examples
                  - 10% Humor/entertainment
                  - 10% Questions/clarifications

                  ## TECHNICAL SPECIFICATIONS

                  1. JSON Formatting:
                  - No escape characters
                  - No special formatting
                  - Clean, parseable structure
                  - Consistent quotation usage

                  2. Speech Timing:
                  - Average 150 words per minute
                  - Natural pauses between exchanges
                  - Varied sentence lengths
                  - Rhythm changes for emphasis

                  3. Quality Checks:
                  - Verify JSON validity
                  - Check for natural flow
                  - Ensure TTS compatibility
                  - Maintain consistent tone

                  4. Accessibility:
                  - Clear pronunciation guides
                  - Explicit context setting
                  - Defined technical terms
                  - Inclusive language,
 Minimum 3,750 to 4,250 words. strictly follow the guidelines below:
The script should be written as a dynamic conversation between two hosts, keeping the tone lively, engaging, and accessible. The discussion should feel natural and captivating for a broad audience, sustaining interest for a duration of approximately 25 minutes. 
Incorporate storytelling elements, insightful observations, and a mix of facts and anecdotes to make the podcast both educational and entertaining. Structure the content with clear transitions and ensure the dialogue flows seamlessly, keeping the audience hooked throughout.`
    );
    console.log(createResearchParagraph);

    // Extract and validate the JSON response
    const podcastScript = createResearchParagraph.content[0].text;
    // let parsedScript;
    // try {
    //   parsedScript = JSON.parse(podcastScript);

    //   // Validate required structure
    //   if (!parsedScript.title || !Array.isArray(parsedScript.conversation)) {
    //     throw new Error("Invalid script structure");
    //   }

    return NextResponse.json({
      research: podcastScript,
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
