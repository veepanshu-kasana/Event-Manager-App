import { SchemaType } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { parseDate } from "chrono-node";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// Helper function to resolve event ID from name
async function resolveEventId(
  supabase: SupabaseClient, 
  eventId?: string, 
  eventName?: string
): Promise<{ id?: string; error?: string }> {
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

// Function implementations
export async function listEvents(eventType: string): Promise<string> {
  const supabase = await createClient();
  
  if (eventType === "all") {
    const { data, error } = await supabase
      .from("events")
      .select("id,title,date,description,banner_url")
      .order("date", { ascending: true });
    
    if (error) {
      return `Error loading all events: ${error.message}`;
    } else if (!data || data.length === 0) {
      return `There are no events in the system.`;
    } else {
      const now = new Date();
      const upcomingEvents = data.filter(e => new Date(e.date) >= now);
      const pastEvents = data.filter(e => new Date(e.date) < now);
      
      let result = `Here are all events (${data.length} total):\n\n`;
      
      if (upcomingEvents.length > 0) {
        result += `📅 UPCOMING EVENTS (${upcomingEvents.length}):\n` + upcomingEvents.map(e =>
          `• ID: ${e.id}\n  Title: ${e.title}\n  Date: ${new Date(e.date).toLocaleString()}\n  Description: ${e.description || "N/A"}\n`
        ).join("\n");
      }
      
      if (pastEvents.length > 0) {
        result += `\n🕒 PAST EVENTS (${pastEvents.length}):\n` + pastEvents.map(e =>
          `• ID: ${e.id}\n  Title: ${e.title}\n  Date: ${new Date(e.date).toLocaleString()}\n  Description: ${e.description || "N/A"}\n`
        ).join("\n");
      }
      
      return result;
    }
  } else {
    const isPast = eventType === "past";
    
    const { data, error } = await supabase
      .from("events")
      .select("id,title,date,description,banner_url")
      [isPast ? "lt" : "gte"]("date", new Date().toISOString())
      .order("date", { ascending: !isPast });
    
    if (error) {
      return `Error loading ${eventType} events: ${error.message}`;
    } else if (!data || data.length === 0) {
      return `There are no ${eventType} events.`;
    } else {
      return `Here are ${eventType} events (${data.length} total):\n\n` + data.map(e =>
        `• ID: ${e.id}\n  Title: ${e.title}\n  Date: ${new Date(e.date).toLocaleString()}\n  Description: ${e.description || "N/A"}\n`
      ).join("\n");
    }
  }
}

export async function createEvent(
  title: string, 
  description: string, 
  date: string, 
  banner_url: string
): Promise<string> {
  const supabase = await createClient();
  const parsedDate = parseDate(date);
  
  if (!parsedDate) {
    return "Sorry, I couldn't understand the event date. Please use format like '2025-10-20 20:00'.";
  }
  
  const { error } = await supabase.from("events").insert([{
    title,
    description,
    date: parsedDate.toISOString(),
    banner_url
  }]);
  
  if (error) {
    return `Failed to create event: ${error.message}`;
  } else {
    return `Event "${title}" created successfully!`;
  }
}

export async function updateEvent(
  field: string, 
  value: string, 
  event_id?: string, 
  event_name?: string
): Promise<string> {
  const supabase = await createClient();
  const { id, error: resolveError } = await resolveEventId(supabase, event_id, event_name);
  
  if (resolveError) {
    return resolveError;
  } else if (!id) {
    return "Could not determine event ID.";
  }
  
  let valueToUpdate: string = value;
  if (field === "date") {
    const parsedDate = parseDate(value);
    if (!parsedDate) {
      return "Couldn't parse the date. Use format like '2025-10-20 20:00'.";
    }
    valueToUpdate = parsedDate.toISOString();
  }
  
  const { error } = await supabase
    .from("events")
    .update({ [field]: valueToUpdate })
    .eq("id", id);
  
  if (error) {
    return `Failed to update event: ${error.message}`;
  } else {
    return `Event updated successfully.`;
  }
}

export async function deleteEvent(event_id?: string, event_name?: string): Promise<string> {
  const supabase = await createClient();
  const { id, error: resolveError } = await resolveEventId(supabase, event_id, event_name);
  
  if (resolveError) {
    return resolveError;
  } else if (!id) {
    return "Could not determine event ID.";
  }
  
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id);
  
  if (error) {
    return `Failed to delete event: ${error.message}`;
  } else {
    return `Event deleted successfully.`;
  }
}

// Tool definitions for Gemini
export const tools = [
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
