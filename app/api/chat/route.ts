import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, context, session_id } = body;

    // Get secret key from environment variable (backend usage)
    const secretKey = process.env.THIRDWEB_SECRET_KEY;

    if (!secretKey) {
      return new Response(
        JSON.stringify({
          error:
            "Thirdweb secret key is required. Set THIRDWEB_SECRET_KEY environment variable.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Prepare request to thirdweb API
    const thirdwebResponse = await fetch("https://api.thirdweb.com/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-secret-key": secretKey,
      },
      body: JSON.stringify({
        messages,
        context,
        session_id,
        stream: true,
      }),
    });

    if (!thirdwebResponse.ok) {
      const errorText = await thirdwebResponse.text();
      return new Response(
        JSON.stringify({ error: `Thirdweb API error: ${errorText}` }),
        {
          status: thirdwebResponse.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Stream the response back to the client
    const stream = new ReadableStream({
      async start(controller) {
        const reader = thirdwebResponse.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              controller.close();
              break;
            }

            // Decode and forward the chunk
            const chunk = decoder.decode(value, { stream: true });
            controller.enqueue(new TextEncoder().encode(chunk));
          }
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
