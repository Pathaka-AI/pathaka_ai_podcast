import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { default_podcast_prompt } from "@/lib/utils";

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

function convertScriptToJson(scriptText: string) {
  // Split the text into lines
  const lines = scriptText.split("\n");
  const result = [];

  for (const line of lines) {
    // Skip empty lines or lines without speakers
    if (
      !line.trim() ||
      (!line.startsWith("Speaker 1:") && !line.startsWith("Speaker 2:"))
    ) {
      continue;
    }

    // Extract speaker number and text
    const match = line.match(/Speaker (\d+):\s*(.*)/);
    if (match) {
      const [, speakerId, text] = match;
      result.push({
        id: parseInt(speakerId),
        text: text.trim(),
      });
    }
  }

  return result;
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
        model: "claude-3-sonnet-20240229", // Using opus model for longer outputs
        max_tokens: 1024,
        temperature: 0.3,
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

      console.log("Podcast Script:", response.content[0].text);
      console.log("Podcast Script JSON:", typeof response.content[0].text);

      // Example usage:
      const podcastScript = `${response.content[0].text}`;
      const jsonFormat = convertScriptToJson(podcastScript);
      console.log(jsonFormat);

      return {
        ...response,
        podcast_script: jsonFormat,
      };
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

// Add new function for fetching web research
async function fetchWebResearch(searchQuery: string) {
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(
    searchQuery
  )}`;
  const braveApiKey = process.env.NEXT_BRAVE_API_KEY;

  if (!braveApiKey) {
    throw new Error("Missing Brave API key");
  }

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": braveApiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Error from Brave API: ${response.statusText}`);
  }

  return await response.json();
}

// Add the new generatePodcastScript function
async function generatePodcastScript(searchQuery: string, prompt?: string) {
  // Step 1: Initial Research Generation
  const researchData = await fetchWebResearch(searchQuery);
  const research = generateResearchParagraph(researchData);

  // Step 2: Define script stages with focused prompts
  const scriptStages = [
    {
      stage: "Introduction",
      prompt: `You are writing a podcast introduction (5-7 minutes).
      Research Context: ${research.paragraph}
      Key Topics: ${research.analysis.topWords.slice(0, 5).join(", ")}
      
      Create an engaging opening that introduces the speakers and topic.
      ${prompt || default_podcast_prompt}
      
      Output Format:
      Speaker 1: [Male voice]
      Speaker 2: [Female voice]`,
    },
    // ... other stages similar to your original code ...
  ];

  // Step 3: Generate script stages with parallel processing
  const stagePromises = scriptStages.map((stage) =>
    askClaude(stage.prompt, {
      max_tokens: 4096,
      temperature: 0.7,
    }).catch((error) => ({
      error: `Error in ${stage.stage}: ${error.message}`,
      content: [{ text: "" }],
    }))
  );

  const stageResults = await Promise.all(stagePromises);

  // Step 4: Combine and process results
  const fullScript = stageResults
    .map((result) => result.content[0].text)
    .join("\n\n");

  return {
    fullScript,
    jsonScript: convertScriptToJson(fullScript),
    research,
  };
}

// Update the GET route handler
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const prompt = searchParams.get("prompt");

  if (!query) {
    return NextResponse.json(
      { error: "Missing search query" },
      { status: 400 }
    );
  }

  try {
    const { fullScript, jsonScript, research } = await generatePodcastScript(
      query,
      prompt || undefined
    );

    return NextResponse.json({
      research,
      full_script: fullScript,
      podcast_script: jsonScript,
    });
  } catch (error: any) {
    console.error("Script Generation Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate podcast script",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
