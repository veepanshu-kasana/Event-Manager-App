"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatClient() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! Let's create a new event. Tell me, what would you like to do?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return alert("Please enter a message.");

    const userMessage: Message = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessages([...updatedMessages, { role: "assistant", content: data.reply }]);
      } else {
        setMessages([
          ...updatedMessages,
          { role: "assistant", content: "Error: " + (data.error || "Unknown error") },
        ]);
      }
    } catch (error) {
      setMessages([...updatedMessages, { role: "assistant", content: "Error connecting to chatbot." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-semibold">AI Chat with Gemini</h1>

      <div className="border rounded-md bg-gray-50 p-4 h-[400px] flex flex-col">
        <ScrollArea className="flex-grow mb-2">
          <div className="space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[80%] p-3 rounded-md ${
                  msg.role === "user"
                    ? "bg-primary/20 text-primary self-end"
                    : "bg-muted text-muted-foreground self-start"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
          </div>
        </ScrollArea>

        <form
          onSubmit={e => {
            e.preventDefault();
            if (!loading) sendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            aria-label="Chat message input"
            placeholder="Type your message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            autoFocus
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            {loading ? "Sending..." : "Send"}
          </Button>
        </form>
      </div>
    </div>
  );
}

