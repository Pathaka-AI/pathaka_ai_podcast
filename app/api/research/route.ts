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

    const createResearchParagraph = await askClaude(
      `You are an award-winning podcast writer, responsible for creating highly engaging and conversational scripts. Your job is to craft realistic and nuanced podcast dialogues, ensuring that the conversation feels authentic, with natural interruptions and a balance of teaching and curiosity between speakers.
                  Instructions:
                  Web Search: ${data?.web?.results} 
                  ${research?.paragraph}
                  ${research.analysis}

                  Duration: 25 minutes (~2500-3000 words)
                  Generate 21000 chararcters of podcast conversation from the essay then convert it in the JSON given below.
                  Style: Conversational, dynamic, educational entertainment

                  ## SPEAKER PROFILES

                  ### Host (Speaker 1)
                  - Name: Amelia
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
                  - Name: Alex
                  - Role: Curious learner and audience surrogate
                  - Personality Traits:
                    * Genuinely interested
                    * Quick-witted
                    * Asks insightful questions
                    * Shares relatable perspectives
                    * Occasionally challenges assumptions
                    * Occasionally adds related and relevant facts or figures  
                  - Speech Patterns:
                    * Natural reactions ("Hmm", "Oh!", "Wait...")
                    * Brief interjections
                    * Thinking out loud
                    * Casual tone

                  ## EPISODE STRUCTURE

                  ### Opening Segment (5 minutes)
                  - Welcoming atmosphere
                  - Topic introduction
                  - Personal connection to topic
                  - Episode roadmap
                  - Initial co-host reactions
                  - 500 words from essay to be used in the opening segment of JSON

                  ### Main Content (20 minutes)
                  Divide into 3-4 distinct subtopics:
                  1. Foundation/Background
                  2. Key Insights/Analysis
                  3. Practical Applications
                  4. Future Implications
                  - 2000 words from essay to be used in the opening segment of JSON

                  ### Closing Segment (5 minutes)
                  - Key takeaways
                  - Personal reflections
                  - Next episode tease
                  - Sign-off
                  - 500 words from essay to be used in the opening segment of JSON


                  ## CONVERSATION DYNAMICS
                  - Make like 3000 words of conversation in JSON format.
                  - If we calulate the words in the text in JSON it should be around 3000 words.

                  ### Natural Flow Elements
                  1. Micro-Interruptions:
                  {
                    "id": 2,
                    "text": "Oh wait, sorry to jump in, but..."
                  }

                  2. Collaborative Thinking:
                  {
                    "id": 2,
                    "text": "So what you're saying is... [rephrases concept]"
                  }

                  3. Real-time Processing:
       
                  {
                    "id": 2,
                    "text": "Hmm... let me think about that for a second..."
                  }

                  ### TTS-Optimized Speech Patterns

                  1. Emphasis Indicators:
                  - Use capitalization sparingly for emphasis
                  - Include brief pauses (...) for natural breaks
                  - Break long sentences into shorter segments

                  2. Reaction Markers:
                  - [chuckles]
                  - [thoughtful pause]
                  - [excited]
                  - [surprised]

                  3. Voice Modulation Hints:
                  - End statements with period for falling tone
                  - Use question marks for rising intonation
                  - Em dashes for abrupt transitions
                  - Commas for brief pauses
                  - Directly Give JSON format of the conversation with 3000 words.


                  ## JSON FORMAT
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
                  - Inclusive language`
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
