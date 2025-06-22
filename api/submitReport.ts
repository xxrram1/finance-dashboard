// file: api/submitReport.ts

import { createClient } from '@supabase/supabase-js';

// Use the corrected and secure environment variable names
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  // Check if all required environment variables are set
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY) {
    let missingKeys = [];
    if (!SUPABASE_URL) missingKeys.push("VITE_SUPABASE_URL");
    if (!SUPABASE_ANON_KEY) missingKeys.push("VITE_SUPABASE_PUBLISHABLE_KEY");
    if (!SUPABASE_SERVICE_KEY) missingKeys.push("SUPABASE_SERVICE_KEY");
    
    const errorMessage = `Supabase environment variables are not fully configured. Missing: ${missingKeys.join(', ')}`;
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }

  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid token' }), { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    // Authenticate user with the public (anon) key
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Authentication failed' }), { status: 401 });
    }
    
    const { report_type, title, description, page_context } = await request.json();

    if (!report_type || !title) {
        return new Response(JSON.stringify({ error: "Report type and title are required" }), { status: 400 });
    }

    // Use the Admin client (with the secure service key) to insert data
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { error: insertError } = await supabaseAdmin.from('reports').insert({
      user_id: user.id, report_type, title, description, page_context
    });

    if (insertError) {
        throw new Error(insertError.message);
    }

    return new Response(JSON.stringify({ message: 'Report submitted successfully' }), { status: 200 });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'An internal error occurred' }), { status: 500 });
  }
}