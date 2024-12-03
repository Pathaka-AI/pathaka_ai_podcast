import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: Request) {
  const { prompt } = await request.json();
  const maxRetries = 3;
  const baseDelay = 1000;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const anthropic = new Anthropic({
        apiKey: process.env.NEXT_CLAUDE_API_KEY,
      });

      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 8000,
        temperature: 0.35,
        messages: [{ role: "user", content: prompt }],
      });

      console.log("Claude Response Generated:", {
        prompt_length: prompt.length,
        response_length: (response.content[0] as any).text.length,
        attempt: attempt + 1,
      });

      return NextResponse.json(response);
    } catch (error: any) {
      const isOverloaded = error.message.includes("overloaded");
      const isLastAttempt = attempt === maxRetries - 1;

      console.warn(`Claude API attempt ${attempt + 1} failed:`, error.message);

      if (isOverloaded && !isLastAttempt) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      return NextResponse.json(
        { error: `Claude API Error: ${error.message}` },
        { status: 500 }
      );
    }
  }
}
