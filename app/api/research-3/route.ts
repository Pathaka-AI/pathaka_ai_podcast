import { NextResponse } from "next/server";
import OpenAI from "openai"; // Add this import

async function generateSection(
  research: any,
  prompt: string | undefined,
  section: string
) {
  const response = await fetch(
    `http://localhost:3001/api/research/${section}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ research, prompt: prompt || "" }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to generate ${section}: ${response.statusText}`);
  }

  return response.json();
}

export async function POST(request: Request): Promise<Response> {
  try {
    const { prompt, topic } = await request.json();

    // Fetch research data from Brave API
    const researchResponse = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(
        topic
      )}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip",
          "X-Subscription-Token": process.env.NEXT_BRAVE_API_KEY || "",
        },
      }
    );

    if (!researchResponse.ok) {
      throw new Error("Failed to fetch research data");
    }

    const webResults = await researchResponse.json();

    // Extract key information from search results
    const research = {
      paragraph: topic,
      web: {
        results: webResults.web.results.map((result: any) => ({
          title: result.title,
          description: result.description,
          url: result.url,
        })),
      },
      analysis: {
        topWords: extractTopWords(webResults.web.results),
      },
    };

    // Helper function to extract common words from results
    function extractTopWords(results: any[]) {
      const words = results
        .map((r) => `${r.title} ${r.description}`)
        .join(" ")
        .toLowerCase()
        .split(/\W+/)
        .filter((w) => w.length > 3);

      const wordFreq = words.reduce((acc: any, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(wordFreq)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 10)
        .map(([word]) => word);
    }

    if (!research) {
      return NextResponse.json(
        { error: "Missing research data" },
        { status: 400 }
      );
    }

    // Generate all sections in parallel
    const [introResult, mainResult, conclusionResult] = await Promise.all([
      generateSection(research, prompt, "intro"),
      generateSection(research, prompt, "main"),
      generateSection(research, prompt, "conclusion"),
    ]);

    // Combine all sections
    const fullScript = `
          ${introResult.intro_script}

          ${mainResult.main_script}

          ${conclusionResult.conclusion_script}
    `.trim();

    // Convert to JSON format (using the existing convertScriptToJson function)
    const jsonScript = convertScriptToJson(fullScript);
    // Send to OpenAI API directly
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Replace the existing while loop with the extendScript function call
    // const extended_script = await extendScript(fullScript, openai, 3000);

    const introExpanded = await expandSection(
      introResult.intro_script,
      openai,
      500
    );
    const mainExpanded = await expandSection(
      mainResult.main_script,
      openai,
      2000
    );
    const conclusionExpanded = await expandSection(
      conclusionResult.conclusion_script,
      openai,
      500
    );

    // Combine sections
    const extended_script = `
        ${introExpanded}

        ${mainExpanded}

        ${conclusionExpanded}
      `.trim();

    return NextResponse.json({
      full_script: extended_script,
      // podcast_script: jsonScript,
      // sections: {
      //   intro: introResult.intro_script,
      //   main: mainResult.main_script,
      //   conclusion: conclusionResult.conclusion_script,
      // },
    });
  } catch (error: any) {
    console.error("Script Generation Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate complete script",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// Helper function to convert script to JSON format
function convertScriptToJson(scriptText: string) {
  const lines = scriptText.split("\n");
  const result = [];

  for (const line of lines) {
    if (
      !line.trim() ||
      (!line.startsWith("Speaker 1:") && !line.startsWith("Speaker 2:"))
    ) {
      continue;
    }

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

// Add the extendScript function at the bottom of the file
async function expandSection(
  section: string,
  openai: OpenAI,
  targetWords: number
): Promise<string> {
  let currentSection = section;
  let wordCount = currentSection.split(/\s+/).length;

  while (wordCount < targetWords) {
    const remainingWords = targetWords - wordCount;
    const tokens = Math.min(remainingWords * 4, 3000);

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a podcast script expert. Expand the provided section while maintaining its style and focus. Aim to make it coherent, engaging, and detailed.",
        },
        {
          role: "user",
          content: `Expand this section with approximately ${remainingWords} words:\n\n${currentSection}`,
        },
      ],
      temperature: 0.3,
      max_tokens: tokens,
    });

    const additionalContent = response.choices[0].message.content;
    currentSection += `\n\n${additionalContent}`;
    wordCount = currentSection.split(/\s+/).length;

    if (additionalContent?.trim().length === 0) break;
  }

  return currentSection;
}
