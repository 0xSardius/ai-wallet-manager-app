"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatUI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    // Add user message to chat
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(newMessages);

    // Initialize assistant message
    let assistantMessage = "";
    const assistantMessageIndex = newMessages.length;
    setMessages([...newMessages, { role: "assistant", content: "" }]);

    try {
      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          session_id: sessionId,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      // Process stream (SSE format)
      let buffer = "";
      let currentEvent = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        // Keep the last incomplete line in buffer
        buffer = lines.pop() || "";

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();

          // Skip empty lines
          if (!line) continue;

          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
            continue;
          }

          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();

            if (dataStr === "[DONE]" || dataStr === "") {
              continue;
            }

            try {
              const data = JSON.parse(dataStr);

              // Check if data itself contains event field (alternative format)
              const eventType = data.event || currentEvent;

              // Handle delta events (text chunks)
              if (eventType === "delta") {
                // The data might be the v field directly or an object with v field
                const textChunk =
                  data.v || (typeof data === "string" ? data : "");
                if (typeof textChunk === "string" && textChunk) {
                  assistantMessage += textChunk;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[assistantMessageIndex] = {
                      role: "assistant",
                      content: assistantMessage,
                    };
                    return updated;
                  });
                }
              }

              // Handle init event (get session_id)
              // According to docs: data object contains session_id, chain_ids, networks, wallet_address
              if (eventType === "init") {
                if (data.session_id) {
                  setSessionId(data.session_id);
                }
              }

              // Handle done event
              if (eventType === "done") {
                break;
              }

              // Handle error event
              if (eventType === "error") {
                const errorMsg =
                  data.message || data.error || data.data || "Unknown error";
                throw new Error(
                  typeof errorMsg === "string"
                    ? errorMsg
                    : JSON.stringify(errorMsg)
                );
              }
            } catch {
              // Skip invalid JSON lines (might be partial data)
              continue;
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request aborted");
        return;
      }

      console.error("Chat error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to get response from AI";
      setMessages((prev) => {
        const updated = [...prev];
        updated[assistantMessageIndex] = {
          role: "assistant",
          content: `Error: ${errorMessage}`,
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-background">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold">AI Wallet Manager</h2>
              <p className="text-muted-foreground">
                Ask me anything about your wallet, transactions, or Web3
                operations.
              </p>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <p className="whitespace-pre-wrap break-words">
                {message.content}
              </p>
            </div>
          </div>
        ))}

        {isLoading && messages.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-muted text-muted-foreground rounded-lg px-4 py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      {mounted && (
        <div className="border-t border-border p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your wallet..."
              className="flex-1 px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
