// file: api/submitReport.ts

import { createClient } from '@supabase/supabase-js';

// These should be set as Environment Variables in your Vercel project settings
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    // 1. Authenticate the user with the edge-compatible Supabase client
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid token' }), { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('Authentication error:', userError?.message);
      return new Response(JSON.stringify({ error: 'Authentication failed' }), { status: 401 });
    }
    
    // 2. Extract data from the request body
    const { report_type, title, description, page_context } = await request.json();

    if (!report_type || !title) {
        return new Response(JSON.stringify({ error: "Report type and title are required" }), { status: 400 });
    }

    // 3. Use the Admin client (with service key) to insert data, bypassing RLS
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { error: insertError } = await supabaseAdmin.from('reports').insert({
      user_id: user.id, // Use the authenticated user's ID
      report_type,
      title,
      description,
      page_context
    });

    if (insertError) {
        console.error('Supabase insert error:', insertError);
        throw new Error(insertError.message);
    }

    return new Response(JSON.stringify({ message: 'Report submitted successfully' }), { status: 200 });

  } catch (error: any) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'An internal error occurred' }), { status: 500 });
  }
}