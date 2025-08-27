import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./shared/cors.ts";

serve(async (req) => {
  return new Response(JSON.stringify({ message: "Supabase function works!" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
