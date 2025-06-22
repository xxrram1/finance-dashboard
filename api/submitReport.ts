// file: api/submitReport.ts

import { createClient } from '@supabase/supabase-js';
import { verify } from 'jsonwebtoken';

// These should be set as Environment Variables in your Vercel project settings
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET!;

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    // Authenticate the user from the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid token' }), { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = verify(token, JWT_SECRET) as { sub: string };
    const userId = decoded.sub;

    const { report_type, title, description, page_context } = await request.json();

    if (!report_type || !title) {
        return new Response(JSON.stringify({ error: "Report type and title are required" }), { status: 400 });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { error } = await supabaseAdmin.from('reports').insert({
      user_id: userId,
      report_type,
      title,
      description,
      page_context
    });

    if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message);
    }

    return new Response(JSON.stringify({ message: 'Report submitted successfully' }), { status: 200 });

  } catch (error: any) {
    console.error('API Error:', error);
    if (error.name === 'JsonWebTokenError') {
        return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
    }
    return new Response(JSON.stringify({ error: error.message || 'An internal error occurred' }), { status: 500 });
  }
}