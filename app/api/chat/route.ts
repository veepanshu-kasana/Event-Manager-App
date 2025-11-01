import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { tools, listEvents, createEvent, updateEvent, deleteEvent } from "./tools";

interface Message {
  role: string;
  content: string;
}

interface RequestBody {
  messages: Message[];
}

export async function POST(req: Request) {
  try {
    // Admin check
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
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
        text: "You are a concise event management assistant. Keep responses SHORT and conversational. When creating events, gather ALL required information (title, description, date, banner_url) before calling create_event. Ask for one piece at a time. Use Markdown formatting with emojis."
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
      functionResult = await listEvents(args.event_type);
    }
    else if (functionName === "create_event") {
      functionResult = await createEvent(
        args.title,
        args.description,
        args.date,
        args.banner_url
      );
    }
    else if (functionName === "update_event") {
      functionResult = await updateEvent(
        args.field,
        args.value,
        args.event_id,
        args.event_name
      );
    }
    else if (functionName === "delete_event") {
      functionResult = await deleteEvent(args.event_id, args.event_name);
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
