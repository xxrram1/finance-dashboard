// file: api/submitReport.ts

import { createClient } from '@supabase/supabase-js';

// UPDATED: Use the correct variable names from your Vercel setup
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!; // Assuming you have this key with this name
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!; // CHANGED from NEXT_PUBLIC_... to VITE_...

// This is still needed for JWT verification if you choose to implement it later
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET!; 

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  // Check if all required environment variables are set
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY) {
    return new Response(JSON.stringify({ error: 'Supabase environment variables are not fully configured on Vercel.' }), { status: 500 });
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
      console.error('Authentication error:', userError?.message);
      return new Response(JSON.stringify({ error: 'Authentication failed. Please log in again.' }), { status: 401 });
    }
    
    const { report_type, title, description, page_context } = await request.json();

    if (!report_type || !title) {
        return new Response(JSON.stringify({ error: "Report type and title are required" }), { status: 400 });
    }

    // Use the Admin client (with service key) to insert data, bypassing RLS
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { error: insertError } = await supabaseAdmin.from('reports').insert({
      user_id: user.id,
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