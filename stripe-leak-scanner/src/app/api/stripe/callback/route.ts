import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { encrypt } from '@/lib/encryption';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' });
export async function GET(req: NextRequest) {
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

    // Get OAuth parameters
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors
    if (error) {
      console.error('Stripe OAuth Error:', { error, errorDescription });
      return NextResponse.redirect(
        new URL(`/error?message=${encodeURIComponent(errorDescription || error || 'Unknown error')}`, req.url)
      );
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect('/error?message=Invalid callback parameters');
    }

    // Decode state
    let stateData;
    try {
        stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      } catch (error) {
        console.error('Failed to parse state:', error);
      return NextResponse.redirect('/error?message=Invalid state parameter');
      }

    const { userId } = stateData;

    if (!userId) {
      return NextResponse.redirect('/error?message=Missing user ID in state');
    }

    // Verify user session matches state
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return NextResponse.redirect('/login?message=Session expired. Please login again.');
    }

    // Exchange authorization code for Stripe account ID
    const response = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code: code!,
    });

    const accountId = response.stripe_user_id;
    if (!accountId) {
      return NextResponse.redirect('/error?message=Failed to get Stripe account ID');
    }
    
    // Encrypt and store account ID
    const encryptedAccountId = encrypt(accountId);

    // Update user record with encrypted Stripe account ID
    const { error: updateError } = await supabase
      .from('users')
      .update({
        stripe_account_id: encryptedAccountId,
        stripe_connected_at: new Date().toISOString(),
        stripe_account_status: 'connected'
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to update user:', updateError);
      return NextResponse.redirect('/error?message=Failed to save Stripe connection');
    }

    // Create initial scan record
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .insert({
        user_id: userId,
        stripe_account_id: accountId, // Store unencrypted for API calls (will be encrypted in production)
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (scanError) {
      console.error('Failed to create scan record:', scanError);
      // Continue anyway, user can create scan manually
      return NextResponse.redirect('/dashboard?success=true&accountId=' + accountId);
    }

    // Redirect to scan page
    return NextResponse.redirect(`/scan/${scan.id}`);
  } catch (error: any) {
    console.error('Stripe Callback Error:', error);
    
    return NextResponse.redirect(
      new URL(`/error?message=${encodeURIComponent(error.message || 'Unknown error')}`, req.url)
    );
  }
}