import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<Response> {
  try {
    const { research, prompt } = await request.json();
    console.log("Main route received:", { research });

    if (!research) {
      return NextResponse.json(
        { error: "Missing research data" },
        { status: 400 }
      );
    }

    // Call Claude API with specific length requirements
    const claudeResponse = await fetch(
      `${process.env.VERCEL_URL || "http://localhost:3001"}/api/claude`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: `You are writing the main body of a podcast episode that provides deep, nuanced exploration of the topic.

        STRICT REQUIREMENTS:
        - You MUST write a minimum of 25,000 characters (approximately 5,000 words)
        - Break the content into 5 major sections
        - Each section must be at least 5,000 characters
        - Use a mix of dialogue between Speaker 1 and Speaker 2
        - Include detailed examples, case studies, and expert perspectives
        - Maintain an engaging, conversational tone throughout

        Topic Context: ${research.paragraph}
        Key Topics to Cover: ${research.analysis.topWords.join(", ")}

        Research Sources to Reference:
        ${research.web.results
          .map((result: any) => `- ${result.title}\n  ${result.description}`)
          .join("\n")}

        Additional Guidelines:
        1. Start each major section with a clear transition
        2. Include specific examples and real-world applications
        3. Address potential challenges and solutions
        4. Incorporate relevant statistics and expert opinions
        5. End each section with a bridge to the next topic

        Format the entire response as a dialogue between Speaker 1 and Speaker 2, with clear speaker labels.
        ${prompt ? `\nCustom Requirements: ${prompt}` : ""}

        IMPORTANT: Your response MUST be at least 25,000 characters long. Do not summarize or shorten the content.`,
          options: {
            temperature: 0.7, // Slightly increased for more creative responses
          },
        }),
      }
    );

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error("Claude API error:", errorText);
      throw new Error(
        `Claude API error: ${claudeResponse.status} ${errorText}`
      );
    }

    const mainResponse = await claudeResponse.json();
    const mainScript = mainResponse.content[0].text;

    // Verify length
    console.log("Main script length:", mainScript.length);
    if (mainScript.length < 25000) {
      console.warn("Script length below target:", mainScript.length);
    }

    return NextResponse.json({
      main_script: mainScript,
      script_length: mainScript.length,
    });
  } catch (error: any) {
    console.error("Main Content Generation Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate main content",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
