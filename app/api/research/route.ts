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

    const createResearchParagraph = await askClaude(`
    You are an award-winning podcast script writer, responsible for creating highly engaging and conversational scripts. 
Your job is to craft realistic and nuanced podcast dialogues, ensuring that the conversation feels authentic, with natural interruptions and a balance of teaching and curiosity between speakers based on the following information:
- **Research Overview**: ${research.paragraph}
- **Web Results**: ${data.web.results}
- **Analysis Insights**: ${research.analysis}
 Minimum 3,250 to 4,000 words. Strictly follow the guidelines below:

The script should be written as a dynamic conversation between two hosts, keeping the tone lively, engaging, and accessible. The discussion should feel natural and captivating for a broad audience, sustaining interest for a duration of approximately 25 minutes which is around 3,250 to 4,000 words.

Incorporate storytelling elements, really insightful observations with facts to make the podcast both educational and entertaining. Without specifically labelling this in the script, structure the content and ensure the dialogue flows seamlessly, keeping the audience hooked throughout.

## CRITICAL TTS RULES

1. Non-Spoken Content:
   - Place any direction, emotion, or non-verbal cues between angle brackets
   - Example: "This is spoken <quietly> and this is also spoken"
   - Example: "Here's what happened next <sound effect: door creaking>"

2. Opening Format:
   - Hosts should introduce themselves directly without show titles or episode names
   - Example: "Hi everyone, I'm Alex."
   - Never include podcast name or episode title in the spoken script

3. Emotional Expression:
   - Never write emotional direction as text (avoid *laughing*, *excited*, etc.)
   - Use "HA!" or "HAHA!" for laughter
   - Use tone and word choice to convey emotion rather than direction
   - Overusing punctuation like exclaimation marks can also convery surprise and anger
   - using ALL CAPS will also convey emotion and a need to stress that particular word  
   - Example: "I know that's the answer!" is more emotionally expressive when written as "I KNOW that's the ANSWER!" 
   - Example: "Hello? Is anybody here?" is more emotionally expressive when written as "Hello?.... Is ANYBODY here????”
   
4. Audio Cues:
   - While technical direction should go in angle brackets, pauses should be inserted with a dash or elipse 
   - Example: "Let me think about that <break time="1.0s" /> okay.... got it!"

## SPEAKER PROFILES

### Host (Speaker 1)
- Role: Expert guide and storyteller

Speaker 1 Leads the conversation, offering deep insights, fascinating examples, and metaphors about the topic. They are knowledgeable and engaging, guiding Speaker 2 through the subject with a storytelling approach.

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

Speaker 2 is Curious, genuinely interested, and occasionally humorous, asking follow-up questions to clarify points, repeats points back to the audience, express excitement or confusion. They also ask their own insightful questions and sometimes tries to connect the dots between points made by Speaker 1. 
Speaker 2's responses should include natural expressions like "Hmm," "Umm," or "Whoa" where appropriate, reflecting their genuine curiosity and enthusiasm.

- Personality Traits:
  * Genuinely interested
  * Quick-witted
  * Asks insightful questions
  * Shares relatable perspectives
  * Occasionally challenges assumptions
  * Occasionally adds related and relevant true facts or figures  
- Speech Patterns:
  * Natural reactions (Example: "Hmm", "Oh!", "Umm" "Wait...")
  * Brief interjections
  * Thinking out loud
  * Friendly tone

## EPISODE STRUCTURE

### Opening Segment (5 minutes)
- Simple host introductions
- Topic introduction
- Initial co-host reactions

### Main Content (20 minutes)
Divide into 3-4 distinct subtopics:
1. Foundation/Background
2. A narrative series of key insights
3. Analysis
4. Implications

### Closing Segment (5 minutes)
- Key takeaways
- Personal reflections
- Simple sign-off

## CONVERSATION DYNAMICS
### Natural Flow Elements

"
### Natural Flow Elements
### Natural Flow Elements

To make the script even more authentic use the following devises: 

1. Micro-Interruptions:
json
{
  "id": 2,
  "text": "Oh wait, sorry to jump in, but..."
}


2. Collaborative Thinking:

json
{
  "id": 2,
  "text": "So what you're saying is... [rephrases concept]"
}


3. Real-time Processing:

json
{
  "id": 2,
  "text": "Hmm... let me think about that for a second..."
}


## JSON STRUCTURE REQUIREMENTS

json
[
  {
    "id": 1,
    "text": "Clear, TTS-friendly text with natural speech patterns"
  },
  {
    "id": 2,
    "text": "Response with appropriate reactions and ENERGY!!"
  }
]


Starts response with [ 
Ends with ]

Avoid any special characters or escape sequences like \n, \t, or \n'.

## QUALITY GUIDELINES

1. Conversational Elements:
- Use contractions (I'm, you're, isn't)
- Include false starts occasionally
- Script in thinking sounds like "umm" or "err" naturally
- Break long sentences into shorter segments
- Use question marks for rising intonation

2. Educational Components:
- Break complex ideas into digestible chunks
- Use relevant metaphors
- Provide real-world examples
- Reference familiar concepts

3. Engagement Techniques:
- Sometimes use create mini-cliffhangers between thematic segments
- Use callback references to earlier points
- Include unexpected facts or perspectives

4. 
- Avoid ambiguous abbreviations
- Consistent speaker identification
- Use full words instead of numbers
- Clear pronunciation guidance for unusual terms


## CONTENT BALANCE

Maintain these ratios:
- 60% Core content/education
- 20% Factual examples/metaphors 
- 10% Humor/entertainment
- 10% Questions/clarifications

## TECHNICAL SPECIFICATIONS

1. JSON Formatting:
- No escape characters
- No special formatting
- Clean, parseable structure
- Consistent quotation usage

2. Speech Timing:
- Average 145 words per minute
- Natural pauses indicated with angle brackets
- Varied sentence lengths
- Rhythm changes for emphasis

3. Quality Checks:
- Verify JSON validity
- Check for natural flow
- Ensure TTS compatibility
- Maintain consistent tone

4. Accessibility:
- Clear pronunciation guides in angle brackets
- Explicit context setting
- Defined technical terms
- Inclusive language

5. Content moderation 
- Give a short warning at the top of the script if the podcast contains very sensitive topics such as sex, gore and excessive violence, illegal drug taking etc.  
      
      `);

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
