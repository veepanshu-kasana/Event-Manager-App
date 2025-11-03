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
    let options = "Multiple events found:\n";
    rows.forEach((e, index) => {
      options += `${index + 1}. **${e.title}** - ${new Date(e.date).toLocaleDateString()}\n   ID: \`${e.id}\`\n`;
    });
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
      return `❌ ${error.message}`;
    } else if (!data || data.length === 0) {
      return `No events found.`;
    } else {
      const now = new Date();
      const upcomingEvents = data.filter(e => new Date(e.date) >= now);
      const pastEvents = data.filter(e => new Date(e.date) < now);
      
      let result = `**${data.length} Events**\n\n`;
      
      if (upcomingEvents.length > 0) {
        result += `📅 **Upcoming (${upcomingEvents.length})**\n`;
        upcomingEvents.forEach((e, index) => {
          result += `${index + 1}. **${e.title}** - ${new Date(e.date).toLocaleDateString()}\n   ID: \`${e.id}\`\n`;
        });
        result += '\n';
      }
      
      if (pastEvents.length > 0) {
        result += `🕒 **Past (${pastEvents.length})**\n`;
        pastEvents.forEach((e, index) => {
          result += `${index + 1}. **${e.title}** - ${new Date(e.date).toLocaleDateString()}\n   ID: \`${e.id}\`\n`;
        });
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
      return `❌ ${error.message}`;
    } else if (!data || data.length === 0) {
      return `No ${eventType} events.`;
    } else {
      let result = `${eventType === 'upcoming' ? '📅' : '🕒'} **${data.length} ${eventType} events**\n\n`;
      
      data.forEach((e, index) => {
        result += `${index + 1}. **${e.title}** - ${new Date(e.date).toLocaleDateString()}\n   ID: \`${e.id}\`\n`;
      });
      
      return result;
    }
  }
}

export async function createEvent(
  title: string, 
  description: string, 
  date: string, 
  banner_url: string
): Promise<string> {
  // Validate all required fields are provided
  if (!title || !description || !date || !banner_url) {
    const missing = [];
    if (!title) missing.push('title');
    if (!description) missing.push('description');
    if (!date) missing.push('date');
    if (!banner_url) missing.push('banner_url');
    return `❌ Missing required fields: ${missing.join(', ')}. Please provide all information.`;
  }

  const supabase = await createClient();
  const parsedDate = parseDate(date);
  
  if (!parsedDate) {
    return "❌ Invalid date format. Try: `2025-12-25 18:00` or `tomorrow 5pm`";
  }
  
  const { error } = await supabase.from("events").insert([{
    title,
    description,
    date: parsedDate.toISOString(),
    banner_url
  }]);
  
  if (error) {
    return `❌ ${error.message}`;
  } else {
    return `✅ **${title}** created for ${parsedDate.toLocaleDateString()}`;
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
    return `❌ ${resolveError}`;
  } else if (!id) {
    return "❌ Could not find event.";
  }
  
  let valueToUpdate: string = value;
  if (field === "date") {
    const parsedDate = parseDate(value);
    if (!parsedDate) {
      return "❌ Invalid date. Try: `2025-12-25 18:00` or `tomorrow 5pm`";
    }
    valueToUpdate = parsedDate.toISOString();
  }
  
  const { error } = await supabase
    .from("events")
    .update({ [field]: valueToUpdate })
    .eq("id", id);
  
  if (error) {
    return `❌ ${error.message}`;
  } else {
    return `✅ Updated **${field}** successfully`;
  }
}

export async function deleteEvent(event_id?: string, event_name?: string): Promise<string> {
  const supabase = await createClient();
  const { id, error: resolveError } = await resolveEventId(supabase, event_id, event_name);
  
  if (resolveError) {
    return `❌ ${resolveError}`;
  } else if (!id) {
    return "❌ Could not find event.";
  }
  
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id);
  
  if (error) {
    return `❌ ${error.message}`;
  } else {
    return `✅ Event deleted successfully`;
  }
}

export async function getEventDetails(event_id?: string, event_name?: string): Promise<string> {
  const supabase = await createClient();
  const { id, error: resolveError } = await resolveEventId(supabase, event_id, event_name);
  
  if (resolveError) {
    return `❌ ${resolveError}`;
  } else if (!id) {
    return "❌ Could not find event.";
  }
  
  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) {
    return `❌ ${error.message}`;
  }
  
  if (!event) {
    return "❌ Event not found.";
  }
  
  const eventDate = new Date(event.date);
  const fullDate = eventDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const time = eventDate.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const { count: registrationCount } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', id);
  
  let result = `## 📅 ${event.title}\n\n`;
  result += `**Description:**\n${event.description || 'No description provided'}\n\n`;
  result += `**Date:** ${fullDate}\n\n`;
  result += `**Time:** ${time}\n\n`;
  if (registrationCount !== null) {
    result += `**Registrations:** ${registrationCount}\n\n`;
  }
  if (event.banner_url) {
    result += `**Banner URL:** ${event.banner_url}\n\n`;
  }
  result += `**Event ID:** \`${event.id}\`\n`;
  
  return result;
}

export async function getEventRegistrations(event_id?: string, event_name?: string): Promise<string> {
  const supabase = await createClient();
  const { id, error: resolveError } = await resolveEventId(supabase, event_id, event_name);
  
  if (resolveError) {
    return `❌ ${resolveError}`;
  } else if (!id) {
    return "❌ Could not find event.";
  }
  
  // Get event details
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("title")
    .eq("id", id)
    .single();
  
  if (eventError || !event) {
    return "❌ Event not found.";
  }
  
  // Get registrations with user details
  const { data: registrations, error } = await supabase
    .from('registrations')
    .select(`
      user_id,
      users (
        id,
        email,
        role
      )
    `)
    .eq('event_id', id);
  
  if (error) {
    return `❌ ${error.message}`;
  }
  
  if (!registrations || registrations.length === 0) {
    return `📋 No users registered for **${event.title}** yet.`;
  }
  
  let result = `## 👥 Registered Users for "${event.title}"\n\n`;
  result += `**Total Registrations:** ${registrations.length}\n\n`;
  
  registrations.forEach((reg, index) => {
    const user = reg.users;
    if (user && typeof user === 'object' && !Array.isArray(user)) {
      const typedUser = user as { id: string; email: string; role: string };
      result += `${index + 1}. **${typedUser.email}**\n\n`;
      result += `   🎭 Role: ${typedUser.role}\n\n`;
      result += `   ID: \`${typedUser.id}\`\n\n`;
    }
  });
  
  return result;
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
  },
  {
    name: "get_event_details",
    description: "Gets detailed information about a specific event by name or ID. Use this when user asks to show details of an event",
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
    name: "get_event_registrations",
    description: "Shows all registered users for a specific event by name or ID. Use this when user asks to see who is registered or show registered users for an event",
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
  }
];
