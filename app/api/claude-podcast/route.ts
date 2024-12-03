// app/api/claude/route.js
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

async function extendScript(
  script: string,
  openai: OpenAI,
  targetWordCount: number
): Promise<string> {
  let extendedScript = script;
  let wordCount = extendedScript.split(/\s+/).length;

  while (wordCount < targetWordCount) {
    const remainingWords = targetWordCount - wordCount;
    const approximateTokens = Math.min(remainingWords * 4, 3000); // Approximate 4 characters per token

    const extendResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are an expert podcast script writer. Extend and enhance the provided script while maintaining the same style and format. Ensure smooth transitions and a cohesive narrative.",
        },
        {
          role: "user",
          content: `Please extend this podcast script with approximately ${remainingWords} words while maintaining the Speaker 1/Speaker 2 format. Current script: \n\n${extendedScript}`,
        },
      ],
      temperature: 0.3,
      max_tokens: approximateTokens,
    });

    const newContent = extendResponse.choices[0].message.content;
    extendedScript += `\n\n${newContent}`;
    wordCount = extendedScript.split(/\s+/).length;
    // Safety check to avoid infinite loops
    if (!newContent || newContent.trim().length === 0) break;
  }

  return extendedScript;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { topic } = body;

    if (!topic) {
      return NextResponse.json(
        { error: "Topic and structure are required." },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.NEXT_CLAUDE_API_KEY,
    });

    const prompt = `
 You are writing a 3000-word podcast script.
The topic is "${topic}".
Structure:


Write the first 500 words of the script in a conversational and engaging tone.

`;
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      temperature: 0.35,
      messages: [{ role: "user", content: prompt }],
    });

    // return NextResponse.json({ script: response.content });
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const extendedScript = await extendScript(
      response.content[0].text,
      openai,
      3000
    );

    // Return extended script
    return NextResponse.json({
      full_script: extendedScript,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to generate the script. Please try again later." },
      { status: 500 }
    );
  }
}
