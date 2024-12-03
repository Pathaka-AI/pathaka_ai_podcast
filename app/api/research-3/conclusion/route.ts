import { NextResponse } from "next/server";

import { default_podcast_prompt } from "@/lib/utils";
import { askClaude } from "@/lib/claude";

export async function POST(request: Request): Promise<Response> {
  try {
    const { research, prompt } = await request.json();

    if (!research) {
      return NextResponse.json(
        { error: "Missing research data" },
        { status: 400 }
      );
    }

    const conclusionResponse = await askClaude(
      `You are writing a podcast conclusion that synthesizes insights, provides reflection, and leaves a lasting impact.
     ## REQUIREMENTS:
Minimum Length: 4000 CHARACTERS
      - Summarize key points
      - Offer forward-looking perspectives
      - Provide a call to action or thought-provoking reflection

      Research Context: ${research.paragraph}
      Key Takeaway Topics: ${research.analysis.topWords.slice(0, 5).join(", ")}
      Research Data Highlights: ${JSON.stringify(
        research.web.results.slice(0, 3)
      )}

      Conclusion Guidance:
      - Recap the most significant insights
      - Connect the discussion to broader implications
      - Inspire listener curiosity or further exploration
      - End with a memorable statement or question
      ${
        prompt ? `Custom Conclusion Prompt: ${prompt}` : default_podcast_prompt
      }`,
      { temperature: 0.4 }
    );

    const conclusionText = conclusionResponse.content[0].text;
    return NextResponse.json({ conclusion_script: conclusionText });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to generate conclusion", details: error.message },
      { status: 500 }
    );
  }
}
