import { createClient } from "@/lib/supabase/server";
import { processChat } from "./chat";

interface Message {
  role: string;
  content: string;
}

interface RequestBody {
  messages: Message[];
}

export async function POST(req: Request) {
  try {
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

    const { messages } = (await req.json()) as RequestBody;
    
    if (!messages) {
      return new Response(JSON.stringify({ error: "Messages required" }), { status: 400 });
    }

    const reply = await processChat(messages);
    return new Response(JSON.stringify({ reply }), { status: 200 });
    
  } catch (error) {
    console.error("Chat API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    if (errorMessage.includes("GEMINI_API_KEY")) {
      return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), { status: 503 });
    }
    
    return new Response(JSON.stringify({ error: "Internal server error: " + errorMessage }), { status: 500 });
  }
}
