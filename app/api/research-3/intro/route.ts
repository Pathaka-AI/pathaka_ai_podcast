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

    const introResponse = await askClaude(
      `You are writing a comprehensive podcast introduction that sets the stage for an in-depth exploration.
      REQUIREMENTS:
      - Minimum Length: 4000 CHARACTERS
      - Provide context, intrigue, and a roadmap for the episode
      - Use a conversational, engaging tone
      - Include personal anecdotes or compelling hooks

      Research Context: ${research.paragraph}
      Key Topics: ${research.analysis.topWords.slice(0, 5).join(", ")}
      Research Data Overview: ${JSON.stringify(
        research.web.results.slice(0, 3)
      )}

      Additional Guidance:
      - Start with a captivating story or surprising fact
      - Explain why this topic matters to the audience
      - Preview the key insights and perspectives to be discussed
      ${
        prompt ? `Custom Prompt Additions: ${prompt}` : default_podcast_prompt
      }`,
      { temperature: 0.4 }
    );

    const introText = introResponse.content[0].text;
    return NextResponse.json({ intro_script: introText });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to generate intro", details: error.message },
      { status: 500 }
    );
  }
}
