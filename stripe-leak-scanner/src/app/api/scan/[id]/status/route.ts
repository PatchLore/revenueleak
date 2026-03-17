import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: scan } = await supabase
    .from('scans')
    .select('*, users(email, plan)')
    .eq('id', id)
    .single();

  if (!scan || scan.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let usersRow = scan.users as { email?: string; plan?: string } | null | undefined;
  if (!usersRow) {
    const { data: userRow } = await supabase.from('users').select('plan').eq('id', scan.user_id).single();
    usersRow = userRow ?? undefined;
  }
  const plan = (usersRow?.plan ?? 'free') as 'free' | 'indie' | 'studio';

  return NextResponse.json({
    analysis: scan.analysis_results,
    aiReport: scan.ai_report,
    paid: scan.payment_status === 'paid',
    plan,
    status: scan.status,
    ...(scan.status === 'error' && { error_message: scan.error_message ?? 'Analysis failed' }),
  });
}