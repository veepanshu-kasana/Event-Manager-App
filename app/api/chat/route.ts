import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server"; // Import Supabase server client
import { parse, parseDate } from "chrono-node";

interface Message {
  role: string;
  content: string;
}

interface RequestBody {
  messages: Message[];
}

// Helper: Extract event details from the AI's response text
function extractEventDetails(text: string) {
  // We'll expect AI to summarize details like this:
  // Event Title: XXX
  // Description: XXX
  // Date: YYYY-MM-DD (or any parseable format)
  // Banner URL: XXX
  // This simple parsing expects the AI's exact format.
  const details: { title?: string; description?: string; date?: string; banner_url?: string } = {};

  const lines = text.split("\n");
  for (const line of lines) {
    if (line.toLowerCase().startsWith("event title:")) {
      details.title = line.split(":").slice(1).join(":").trim();
    } else if (line.toLowerCase().startsWith("description:")) {
      details.description = line.split(":").slice(1).join(":").trim();
    } else if (line.toLowerCase().startsWith("date:")) {
      details.date = line.split(":").slice(1).join(":").trim();
    } else if (line.toLowerCase().startsWith("banner url:")) {
      details.banner_url = line.split(":").slice(1).join(":").trim();
    }
  }

  return details;
}

export async function POST(req: Request) {
  try {
    // Check if user is admin
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userData?.role !== 'admin') {
      return new Response(JSON.stringify({ error: "Forbidden: Admin access required" }), { status: 403 });
    }

    const { messages } = (await req.json()) as RequestBody;
    if (!messages) return new Response(JSON.stringify({ error: "Messages required" }), { status: 400 });

    const history = messages.map((m) => `${m.role}: ${m.content}`).join("\n");

    // Instruct AI to say the specific phrase when ready and summarize details.
    const prompt = `You are an AI assistant designed to help users create events by asking clear, step-by-step questions and saving the answers. Always ask only one event-related question at a time. When all the required data is collected, say 'I have all the details needed to create your event.' and then summarize the collected details in this exact format (do not add anything else):

Event Title: [title]
Description: [description]
Date: [date]
Banner URL: [banner_url]

Here is the conversation so far:
${history}`;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent([prompt]);

    const text = result.response.text();

    // Check if AI signals readiness to create event
    if (text.includes("I have all the details needed to create your event.")) {
      const eventDetails = extractEventDetails(text);

      // Validate required fields
      if (!eventDetails.title || !eventDetails.description || !eventDetails.date || !eventDetails.banner_url) {
        return new Response(
          JSON.stringify({ reply: "It seems some event details are missing, please provide all required information." }),
          { status: 200 }
        );
      }

      // Parse natural language date to JS Date using chrono-node
      const parsedDate = parseDate(eventDetails.date);

      if (!parsedDate) {
        return new Response(
          JSON.stringify({
            reply:
              "Sorry, I couldn't understand the event date you provided. Please give it in a clear format like '2025-10-20 20:00'.",
          }),
          { status: 200 }
        );
      }

      // Convert to ISO string (Postgres compatible)
      const isoDate = parsedDate.toISOString();

      // Insert event (supabase client already created at the start)
      const { error } = await supabase.from("events").insert([
        {
          title: eventDetails.title,
          description: eventDetails.description,
          date: isoDate,
          banner_url: eventDetails.banner_url,
        },
      ]);

      if (error) {
        console.error("Supabase insert error:", error);
        return new Response(
          JSON.stringify({ reply: `Failed to create event: ${error.message}` }),
          { status: 200 }
        );
      }

      return new Response(
        JSON.stringify({ reply: `Event "${eventDetails.title}" created successfully!` }),
        { status: 200 }
      );
    }

    // Normal conversation response if not ready to create event yet
    return new Response(JSON.stringify({ reply: text }), { status: 200 });
  } catch (error) {
    console.error("Chat API Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}
