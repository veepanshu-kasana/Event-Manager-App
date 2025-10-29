import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { parseDate } from "chrono-node";

interface Message {
  role: string;
  content: string;
}

interface RequestBody {
  messages: Message[];
}

// Define function declarations for Gemini (flat array structure)
const tools = [
  {
    name: "create_event",
    description: "Creates a new event with title, description, date, and banner URL",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: {
          type: SchemaType.STRING,
          description: "The event title"
        },
        description: {
          type: SchemaType.STRING,
          description: "The event description"
        },
        date: {
          type: SchemaType.STRING,
          description: "The event date in natural language format (e.g., '2025-10-20 20:00' or 'tomorrow at 5pm')"
        },
        banner_url: {
          type: SchemaType.STRING,
          description: "The URL of the event banner image"
        }
      },
      required: ["title", "description", "date", "banner_url"]
    }
  },
  {
    name: "update_event",
    description: "Updates an existing event by ID or name",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        event_id: {
          type: SchemaType.STRING,
          description: "The event ID (UUID)"
        },
        event_name: {
          type: SchemaType.STRING,
          description: "The event name/title (if ID not provided)"
        },
        field: {
          type: SchemaType.STRING,
          description: "Field to update: title, description, date, or banner_url",
          enum: ["title", "description", "date", "banner_url"]
        },
        value: {
          type: SchemaType.STRING,
          description: "The new value for the field"
        }
      },
      required: ["field", "value"]
    }
  },
  {
    name: "delete_event",
    description: "Deletes an event by ID or name",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        event_id: {
          type: SchemaType.STRING,
          description: "The event ID (UUID)"
        },
        event_name: {
          type: SchemaType.STRING,
          description: "The event name/title (if ID not provided)"
        }
      }
    }
  },
  {
    name: "list_events",
    description: "Lists events based on time filter",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        event_type: {
          type: SchemaType.STRING,
          description: "Type of events to list: 'upcoming' (default), 'past', or 'all'",
          enum: ["upcoming", "past", "all"]
        }
      },
      required: ["event_type"]
    }
  }
];

// Helper function to resolve event ID from name
async function resolveEventId(supabase: Awaited<ReturnType<typeof createClient>>, eventId?: string, eventName?: string): Promise<{ id?: string; error?: string }> {
  if (eventId) return { id: eventId };
  
  if (!eventName) return { error: "Either event_id or event_name must be provided" };
  
  const { data: rows, error } = await supabase
    .from("events")
    .select("id,title,date")
    .ilike("title", eventName.trim());
  
  if (error) return { error: `Event lookup failed: ${error.message}` };
  if (!rows || rows.length === 0) return { error: "No event found with that name." };
  
  if (rows.length > 1) {
    const options = "Multiple events found with that name. Please specify by ID:\n" +
      rows.map(e => `• ${e.title} (${new Date(e.date).toLocaleString()}) [ID: ${e.id}]`).join("\n");
    return { error: options };
  }
  
  return { id: rows[0].id };
}

export async function POST(req: Request) {
  try {
    // Admin check
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

    // Parse request
    const { messages } = (await req.json()) as RequestBody;
    if (!messages) return new Response(JSON.stringify({ error: "Messages required" }), { status: 400 });

    // Add validation before API key usage
    if (!process.env.GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable" }), 
        { status: 503 }
      );
    }

    // Initialize Gemini with function calling
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash"
    });

    // Build conversation history for Gemini (skip initial assistant greeting)
    const historyMessages = messages.slice(0, -1);
    const history = historyMessages
      .filter((_, index) => index > 0 || historyMessages[0].role === "user") // Skip first message if it's assistant
      .map(m => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      }));

    const systemInstruction = {
      role: "system",
      parts: [{
        text: `You are an AI event management assistant for admins. Be conversational, helpful, and adapt to the admin's needs.

CORE RULES:
1. ALWAYS ask for information ONE field at a time
2. WAIT for the user's response before asking the next field
3. NEVER guess or assume information
4. Only call functions when you have ALL required information
5. Be flexible and understand natural language requests

For CREATE event operation:
- Guide step-by-step through: title → description → date → banner URL
- Accept natural language dates ("tomorrow at 5pm", "next Friday 6pm", "2025-12-25 18:00")
- Only call create_event when all 4 fields are collected

For UPDATE event operation:
- Ask for: event identifier (ID or name) → field to update → new value
- Fields: title, description, date, or banner_url
- Only call update_event with all 3 pieces of information

For DELETE event operation:
- Ask for event identifier (ID or name)
- Call delete_event after confirmation

For LISTING events (MOST IMPORTANT):
- When admin says "show events", "list events", "what events", "see events" WITHOUT specifying time:
  → Call list_events with event_type: "upcoming" (DEFAULT)
  
- When admin specifically asks for "past events", "old events", "previous events", "events that happened":
  → Call list_events with event_type: "past"
  
- When admin asks for "all events", "both events", "all upcoming and past events", "every event":
  → Call list_events with event_type: "all"

FLEXIBILITY:
- Understand variations in how admins ask for things
- "Show me events" = upcoming events (default)
- "What events do we have?" = upcoming events (default)
- "Past events" = past events only
- "Show everything" = all events
- Be helpful and don't ask unnecessary questions when the intent is clear`
      }]
    };

    const chat = model.startChat({
      history,
      generationConfig: {
        temperature: 0.7,
      },
      tools: [{ functionDeclarations: tools as never }],
      systemInstruction: systemInstruction as never,
    });

    // Send latest message
    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(lastMessage);
    const response = result.response;

    // Check for function calls in the response
    const candidate = response.candidates?.[0];
    const functionCall = candidate?.content?.parts?.find((part: { functionCall?: unknown }) => part.functionCall);
    
    if (!functionCall || !functionCall.functionCall) {
      // No function call - return text response
      return new Response(JSON.stringify({ reply: response.text() }), { status: 200 });
    }

    // Handle function call
    const { name: functionName, args } = functionCall.functionCall as { name: string; args: Record<string, string> };

    // Execute the appropriate function
    let functionResult = "";
    
    if (functionName === "list_events") {
      const eventType = args.event_type;
      
      if (eventType === "all") {
        // Fetch all events (both upcoming and past)
        const { data, error } = await supabase
          .from("events")
          .select("id,title,date,description,banner_url")
          .order("date", { ascending: true });
        
        if (error) {
          functionResult = `Error loading all events: ${error.message}`;
        } else if (!data || data.length === 0) {
          functionResult = `There are no events in the system.`;
        } else {
          const now = new Date();
          const upcomingEvents = data.filter(e => new Date(e.date) >= now);
          const pastEvents = data.filter(e => new Date(e.date) < now);
          
          functionResult = `Here are all events (${data.length} total):\n\n`;
          
          if (upcomingEvents.length > 0) {
            functionResult += `📅 UPCOMING EVENTS (${upcomingEvents.length}):\n` + upcomingEvents.map(e =>
              `• ID: ${e.id}\n  Title: ${e.title}\n  Date: ${new Date(e.date).toLocaleString()}\n  Description: ${e.description || "N/A"}\n`
            ).join("\n");
          }
          
          if (pastEvents.length > 0) {
            functionResult += `\n🕒 PAST EVENTS (${pastEvents.length}):\n` + pastEvents.map(e =>
              `• ID: ${e.id}\n  Title: ${e.title}\n  Date: ${new Date(e.date).toLocaleString()}\n  Description: ${e.description || "N/A"}\n`
            ).join("\n");
          }
        }
      } else {
        // Fetch upcoming or past events only
        const isPast = eventType === "past";
        
        const { data, error } = await supabase
          .from("events")
          .select("id,title,date,description,banner_url")
          [isPast ? "lt" : "gte"]("date", new Date().toISOString())
          .order("date", { ascending: !isPast });
        
        if (error) {
          functionResult = `Error loading ${eventType} events: ${error.message}`;
        } else if (!data || data.length === 0) {
          functionResult = `There are no ${eventType} events.`;
        } else {
          functionResult = `Here are ${eventType} events (${data.length} total):\n\n` + data.map(e =>
            `• ID: ${e.id}\n  Title: ${e.title}\n  Date: ${new Date(e.date).toLocaleString()}\n  Description: ${e.description || "N/A"}\n`
          ).join("\n");
        }
      }
    }
    
    else if (functionName === "create_event") {
      const { title, description, date, banner_url } = args;
      
      const parsedDate = parseDate(date);
      if (!parsedDate) {
        functionResult = "Sorry, I couldn't understand the event date. Please use format like '2025-10-20 20:00'.";
      } else {
      const { error } = await supabase.from("events").insert([{
          title,
          description,
          date: parsedDate.toISOString(),
          banner_url
        }]);
        
      if (error) {
          functionResult = `Failed to create event: ${error.message}`;
        } else {
          functionResult = `Event "${title}" created successfully!`;
        }
      }
    }
    
    else if (functionName === "update_event") {
      const { event_id, event_name, field, value } = args;
      
      const { id, error: resolveError } = await resolveEventId(supabase, event_id, event_name);
      
      if (resolveError) {
        functionResult = resolveError;
      } else if (!id) {
        functionResult = "Could not determine event ID.";
      } else {
        let valueToUpdate: string = value;
        if (field === "date") {
          const parsedDate = parseDate(value);
        if (!parsedDate) {
            functionResult = "Couldn't parse the date. Use format like '2025-10-20 20:00'.";
            return new Response(JSON.stringify({ reply: functionResult }), { status: 200 });
        }
        valueToUpdate = parsedDate.toISOString();
      }
        
      const { error } = await supabase
        .from("events")
          .update({ [field]: valueToUpdate })
          .eq("id", id);
        
      if (error) {
          functionResult = `Failed to update event: ${error.message}`;
        } else {
          functionResult = `Event updated successfully.`;
        }
      }
    }
    
    else if (functionName === "delete_event") {
      const { event_id, event_name } = args;
      
      const { id, error: resolveError } = await resolveEventId(supabase, event_id, event_name);
      
      if (resolveError) {
        functionResult = resolveError;
      } else if (!id) {
        functionResult = "Could not determine event ID.";
      } else {
      const { error } = await supabase
        .from("events")
        .delete()
          .eq("id", id);
        
      if (error) {
          functionResult = `Failed to delete event: ${error.message}`;
        } else {
          functionResult = `Event deleted successfully.`;
        }
      }
    }

    // Return the function result directly as the assistant's reply
    return new Response(JSON.stringify({ reply: functionResult }), { status: 200 });
  } catch (error) {
    console.error("Chat API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error details:", errorMessage);
    return new Response(JSON.stringify({ error: "Internal server error: " + errorMessage }), { status: 500 });
  }
}
