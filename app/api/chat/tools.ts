import { SchemaType } from "@google/generative-ai";

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

