"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Event = {
  id: string;
  title: string;
  date: string;
};

export default function ChatClient() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I can help you manage events. I can:\n• CREATE new events\n• UPDATE existing events\n• DELETE events\n• SHOW events (upcoming by default, or past/all events)\n\nWhat would you like to do?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchEvents() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('events')
      .select('id, title, date')
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Error fetching events:', error);
      console.error('Error details:', error.message, error.code);
      return;
    }
    
    if (data) {
      console.log('Fetched events successfully:', data.length, 'events');
      setEvents(data);
    } else {
      console.log('No events data returned');
    }
  }

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
        // Refresh events list after successful operation
        if (data.reply.includes("successfully")) {
          fetchEvents();
        }
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

  function resetChat() {
    setMessages([
      {
        role: "assistant",
        content: "Hi! I can help you manage events. I can:\n• CREATE new events\n• UPDATE existing events\n• DELETE events\n• SHOW events (upcoming by default, or past/all events)\n\nWhat would you like to do?",
      },
    ]);
    setInput("");
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold">AI Event Manager</h1>
        <Button onClick={resetChat} variant="outline">Reset Chat</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Events List */}
        <div className="md:col-span-1 border rounded-md p-4 bg-card">
          <h2 className="font-semibold mb-3">Current Events</h2>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events yet</p>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="p-2 bg-muted rounded text-xs">
                    <p className="font-medium">ID: {event.id}</p>
                    <p className="truncate">{event.title}</p>
                    <p className="text-muted-foreground">{new Date(event.date).toLocaleDateString()}</p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="md:col-span-2 border rounded-md bg-card p-4 h-[500px] flex flex-col">
        <ScrollArea className="h-[400px] mb-4">
          <div className="space-y-3 pr-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[80%] p-3 rounded-md ${
                  msg.role === "user"
                    ? "bg-primary/20 text-primary ml-auto"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
            <div ref={messagesEndRef} />
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
    </div>
  );
}

