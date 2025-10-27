import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server"; // Import Supabase server client
import { parseDate } from "chrono-node";

interface Message {
  role: string;
  content: string;
}

interface RequestBody {
  messages: Message[];
}

// Helper: Extract details for different actions from Gemini output
function extractEventDetails(text: string) {
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

function extractUpdateDetails(text: string) {
  const details: { id?: string; field?: string; value?: string } = {};
  const lines = text.split("\n");
  for (const line of lines) {
    if (line.toLowerCase().startsWith("event id:")) {
      details.id = line.split(":").slice(1).join(":").trim();
    } else if (line.toLowerCase().startsWith("field:")) {
      details.field = line.split(":").slice(1).join(":").trim();
    } else if (line.toLowerCase().startsWith("new value:")) {
      details.value = line.split(":").slice(1).join(":").trim();
    }
  }
  return details;
}

function extractDeleteDetails(text: string) {
  const details: { id?: string } = {};
  const lines = text.split("\n");
  for (const line of lines) {
    if (line.toLowerCase().startsWith("event id:")) {
      details.id = line.split(":").slice(1).join(":").trim();
    }
  }
  return details;
}

export async function POST(req: Request) {
  try {
    // Check admin
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

    // Parse chat
    const { messages } = (await req.json()) as RequestBody;
    if (!messages) return new Response(JSON.stringify({ error: "Messages required" }), { status: 400 });

    const history = messages.map((m) => `${m.role}: ${m.content}`).join("\n");

    // UPDATED SYSTEM PROMPT
    const prompt = `
You are an event management AI assistant for admins.
Your tasks are: CREATE, UPDATE, DELETE events in Supabase.
Follow these rules:
- For 'create event', ask for: title, description, date, banner_url. When ready, say 'I have all the details needed to create your event.' and summarize in this format:
Event Title: [title]
Description: [description]
Date: [date]
Banner URL: [banner_url]

- For 'update event', ask for: event ID, which field to update (title OR description OR date OR banner_url), and its new value. When ready, say 'I have all the details needed to update your event.' and summarize in this format:
Event ID: [id]
Field: [field]
New Value: [value]

- For 'delete event', ask for the event ID only. When ready, say 'I have all the details needed to delete your event.' and summarize in this format:
Event ID: [id]

ALWAYS follow the structured summary exactly, no extra text.
Here's the conversation so far:
${history}
`;

    // Gemini response
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent([prompt]);
    const text = result.response.text();

    // CREATE Event
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
            reply: "Sorry, I couldn't understand the event date you provided. Please use format like '2025-10-20 20:00'."
          }),
          { status: 200 }
        );
      }
      // Convert to ISO string (Postgres compatible)
      const isoDate = parsedDate.toISOString();
      // Insert event into Supabase
      const { error } = await supabase.from("events").insert([{
        title: eventDetails.title,
        description: eventDetails.description,
        date: isoDate,
        banner_url: eventDetails.banner_url
      }]);
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

    // UPDATE Event
    if (text.includes("I have all the details needed to update your event.")) {
      const updateDetails = extractUpdateDetails(text);
      if (!updateDetails.id || !updateDetails.field || !updateDetails.value) {
        return new Response(
          JSON.stringify({ reply: "Missing details. Please specify event ID, field and new value for update." }),
          { status: 200 }
        );
      }
      
      // Whitelist allowed fields for security
      const allowedFields = ['title', 'description', 'date', 'banner_url'];
      if (!allowedFields.includes(updateDetails.field)) {
        return new Response(
          JSON.stringify({ reply: `Invalid field. Only these fields can be updated: ${allowedFields.join(', ')}` }),
          { status: 200 }
        );
      }
      
      // Special handling for date
      let valueToUpdate: string | Date = updateDetails.value;
      if (updateDetails.field === "date") {
        const parsedDate = parseDate(updateDetails.value);
        if (!parsedDate) {
          return new Response(
            JSON.stringify({
              reply: "Sorry, I couldn't understand the updated date. Please use format like '2025-10-20 20:00'."
            }),
            { status: 200 }
          );
        }
        valueToUpdate = parsedDate.toISOString();
      }
      const { error } = await supabase
        .from("events")
        .update({ [updateDetails.field]: valueToUpdate })
        .eq("id", updateDetails.id);
      if (error) {
        console.error("Supabase update error:", error);
        return new Response(
          JSON.stringify({ reply: `Failed to update event: ${error.message}` }),
          { status: 200 }
        );
      }
      return new Response(
        JSON.stringify({ reply: `Event updated successfully.` }),
        { status: 200 }
      );
    }

    // DELETE Event
    if (text.includes("I have all the details needed to delete your event.")) {
      const deleteDetails = extractDeleteDetails(text);
      if (!deleteDetails.id) {
        return new Response(
          JSON.stringify({ reply: "Missing event ID for delete." }),
          { status: 200 }
        );
      }
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", deleteDetails.id);
      if (error) {
        console.error("Supabase delete error:", error);
        return new Response(
          JSON.stringify({ reply: `Failed to delete event: ${error.message}` }),
          { status: 200 }
        );
      }
      return new Response(
        JSON.stringify({ reply: `Event deleted successfully.` }),
        { status: 200 }
      );
    }

    // Default: return Gemini's chat response
    return new Response(JSON.stringify({ reply: text }), { status: 200 });
  } catch (error) {
    console.error("Chat API Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}
