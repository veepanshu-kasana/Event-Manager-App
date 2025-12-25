import { GoogleGenerativeAI } from "@google/generative-ai";
import { tools, listEvents, createEvent, updateEvent, deleteEvent, getEventDetails, getEventRegistrations } from "./tools";

interface Message {
  role: string;
  content: string;
}

const SYSTEM_INSTRUCTION = {
  role: "system",
  parts: [{
    text: "You are a concise event management assistant. Keep responses SHORT and conversational. When creating events, gather ALL required information (title, description, date, banner_url) before calling create_event. Ask for one piece at a time. Use Markdown formatting with emojis."
  }]
};

function buildChatHistory(messages: Message[]) {
  const historyMessages = messages.slice(0, -1);
  return historyMessages
    .filter((_, index) => index > 0 || historyMessages[0].role === "user")
    .map(m => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }]
    }));
}

async function executeFunctionCall(functionName: string, args: Record<string, string>): Promise<string> {
  switch (functionName) {
    case "list_events":
      return await listEvents(args.event_type);
    
    case "create_event":
      return await createEvent(
        args.title,
        args.description,
        args.date,
        args.banner_url
      );
    
    case "update_event":
      return await updateEvent(
        args.field,
        args.value,
        args.event_id,
        args.event_name
      );
    
    case "delete_event":
      return await deleteEvent(args.event_id, args.event_name);
    
    case "get_event_details":
      return await getEventDetails(args.event_id, args.event_name);
    
    case "get_event_registrations":
      return await getEventRegistrations(args.event_id, args.event_name);
    
    default:
      return "Function not found";
  }
}

export async function processChat(messages: Message[]): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash"
  });

  const history = buildChatHistory(messages);
  
  const chat = model.startChat({
    history,
    generationConfig: {
      temperature: 0.7,
    },
    tools: [{ functionDeclarations: tools as never }],
    systemInstruction: SYSTEM_INSTRUCTION as never,
  });

  const lastMessage = messages[messages.length - 1].content;
  const result = await chat.sendMessage(lastMessage);
  const response = result.response;

  const candidate = response.candidates?.[0];
  const functionCall = candidate?.content?.parts?.find((part: { functionCall?: unknown }) => part.functionCall);
  
  if (!functionCall || !functionCall.functionCall) {
    return response.text();
  }

  const { name: functionName, args } = functionCall.functionCall as { name: string; args: Record<string, string> };
  return await executeFunctionCall(functionName, args);
}

