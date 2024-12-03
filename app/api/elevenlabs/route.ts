import { NextResponse } from "next/server";

async function getSpeakerAudio(
  text: string,
  speakerId: number,
  apiKey: string,
  previousRequestIds: string[]
) {
  const voiceIds: { [key: number]: string } = {
    1: "UgBBYS2sOqTuMpoF3BR0", // Mark-> Male
    2: "kPzsL2i3teMYv0FxEYQ6", //Brittney ->Female
  };

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceIds[speakerId]}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2",
        voice_settings:
          speakerId === 1
            ? {
                stability: 0.5,
                similarity_boost: 0.5,
              }
            : {
                stability: 0.45,
                similarity_boost: 0.7,
              },
        previous_request_ids: previousRequestIds,
      }),
    }
  );

  return response;
}

export async function POST(req: Request) {
  try {
    if (!process.env.ELEVEN_LABS_API_KEY) {
      return NextResponse.json(
        { error: "ElevenLabs API key not configured" },
        { status: 500 }
      );
    }
    console.log("Starting podcast generation...");
    const podcast_script: any = await req.json();

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const previousRequestIds: string[] = [];

    (async () => {
      try {
        let segmentCount = 0;
        for (const entry of podcast_script) {
          segmentCount++;
          console.log(
            `Processing segment ${segmentCount}/${podcast_script.length}`
          );

          const response = await getSpeakerAudio(
            entry.text,
            entry.id,
            process.env.ELEVEN_LABS_API_KEY || "",
            previousRequestIds.slice(-3)
          );

          const requestId = response.headers.get("request-id");
          if (requestId) {
            previousRequestIds.push(requestId);
          }

          const audioData = await response.arrayBuffer();
          await writer.write(new Uint8Array(audioData));
        }
        console.log("Finished processing all segments");
      } catch (error) {
        console.error("Error processing audio segments:", error);
      } finally {
        console.log("Closing writer stream");
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Error in ElevenLabs API route:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
