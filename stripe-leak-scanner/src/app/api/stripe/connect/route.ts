import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createOAuthLink } from '@/lib/stripe-oauth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Redirect to login if not authenticated
      return NextResponse.redirect('/login');
    }

    // Create state with user ID for security
    const state = Buffer.from(JSON.stringify({ 
      userId: user.id,
      nonce: Math.random().toString(36).substring(7)
    })).toString('base64');
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.STRIPE_CONNECT_CLIENT_ID!,
      scope: 'read_only',
      state: state,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/callback`,
    });

    return NextResponse.redirect(`https://connect.stripe.com/oauth/authorize?${params.toString()}`);
  } catch (error: any) {
    console.error('Stripe Connect Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate OAuth link',
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}

// Optional: POST method for additional parameters
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { returnUrl } = body;

    // Create state with additional context
    const state = Buffer.from(JSON.stringify({ 
      userId: user.id,
      timestamp: Date.now(),
      nonce: Math.random().toString(36).substring(2),
      returnUrl: returnUrl || '/dashboard',
    })).toString('base64');
    
    const url = await createOAuthLink(state);

    return NextResponse.json({ 
      url,
      success: true,
      redirectTo: url,
    });
  } catch (error: any) {
    console.error('Stripe Connect POST Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate OAuth link',
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}