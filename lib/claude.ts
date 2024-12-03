interface ClaudeResponse {
  content: Array<{ text: string }>;
  error?: string;
}

interface ClaudeOptions {
  temperature?: number;
  maxTokens?: number;
  system?: string;
  model?: string;
}

export async function askClaude(
  prompt: string,
  options: Partial<ClaudeOptions> = {}
): Promise<ClaudeResponse> {
  try {
    const response = await fetch("http://localhost:3001/api/claude", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        options: {
          temperature: 0.7,
          maxTokens: 4000,
          model: "claude-3-sonnet-20240229",
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in askClaude:", error);
    throw error;
  }
}

// Usage example:
/*
try {
  const response = await askClaude('What is 2+2?', {
    temperature: 0.5,
    maxTokens: 500
  });
  console.log(response.content[0].text);
} catch (error) {
  console.error('Failed to get response:', error);
}
*/
