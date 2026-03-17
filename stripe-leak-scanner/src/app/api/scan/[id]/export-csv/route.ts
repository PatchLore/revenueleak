import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { RevenueIntelligence } from '@/types';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: scanId } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: scan, error: scanError } = await supabase
    .from('scans')
    .select('id, user_id, analysis_results, users(plan)')
    .eq('id', scanId)
    .single();

  if (scanError || !scan || scan.user_id !== user.id) {
    return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
  }

  let usersRow = scan.users as { plan?: string } | null | undefined;
  if (!usersRow) {
    const { data: userRow } = await supabase.from('users').select('plan').eq('id', scan.user_id).single();
    usersRow = userRow ?? undefined;
  }
  const plan = (usersRow?.plan ?? 'free') as string;
  if (plan !== 'indie' && plan !== 'studio') {
    return NextResponse.json(
      { error: 'CSV export requires Indie or Studio plan' },
      { status: 403 }
    );
  }

  const analysis = scan.analysis_results as { revenueIntelligence?: RevenueIntelligence } | null | undefined;
  if (!analysis?.revenueIntelligence) {
    return NextResponse.json(
      { error: 'No revenue intelligence data available' },
      { status: 400 }
    );
  }

  const ri = analysis.revenueIntelligence;
  const currency = ri.mrr?.currency ?? ri.revenueLeaks?.currency ?? 'USD';

  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || value === null) return formatMoney(0, currency);
    return formatMoney(value, currency);
  };

  const formatPercent = (value: number | undefined): string => {
    if (value === undefined || value === null) return '0%';
    return `${Number(value).toFixed(1)}%`;
  };

  const rows: string[][] = [
    ['Metric', 'Value', 'Change', 'Period'],
    ['MRR', formatCurrency(ri.mrr?.current), formatPercent(ri.mrr?.percentChange), 'Current'],
    ['MRR (30d ago)', formatCurrency(ri.mrr?.thirtyDaysAgo), '', '30 days ago'],
    ['Active Subscriptions', String(ri.activeSubscriptions?.active ?? 0), '', 'Current'],
    ['Trialing', String(ri.activeSubscriptions?.trialing ?? 0), '', 'Current'],
    ['Past Due', String(ri.activeSubscriptions?.pastDue ?? 0), '', 'Current'],
    ['Canceled This Month', String(ri.activeSubscriptions?.canceledThisMonth ?? 0), '', 'Current'],
    ['Customer Churn Rate', formatPercent(ri.churn?.customerChurnRate), '', 'Last 30 days'],
    ['Revenue Churn Rate', formatPercent(ri.churn?.revenueChurnRate), '', 'Last 30 days'],
    ['LTV', formatCurrency(ri.ltv?.ltv), '', 'Average'],
    ['ARPU', formatCurrency(ri.ltv?.arpu), '', 'Current'],
    ['Trial Conversion Rate', formatPercent(ri.trialConversion?.conversionRate), '', 'Last 90 days'],
    ['Revenue at Risk', formatCurrency(ri.revenueLeaks?.totalAtRisk), '', 'Current'],
    [],
    ['Plan Breakdown', '', '', ''],
    ['Plan Name', 'Subscribers', 'MRR Contribution', 'Avg LTV', 'Churn Rate'],
    ...(ri.planBreakdown?.map((p) => [
      p.planName,
      String(p.subscribers),
      formatCurrency(p.mrrContribution),
      formatCurrency(p.avgLtv),
      formatPercent(p.churnRate),
    ]) ?? []),
    [],
    ['Revenue Leaks Detail', '', '', ''],
    ['Category', 'Customer', 'Amount at Risk', 'Days Overdue'],
    ...(ri.revenueLeaks?.items?.map((leak) => [
      leak.category,
      leak.customerEmail ?? 'Unknown',
      formatCurrency(leak.amountAtRisk),
      String(leak.daysOverdue ?? 'N/A'),
    ]) ?? []),
    [],
    ['MRR Movement (last 6 months)', '', '', ''],
    ['Month', 'New MRR', 'Expansion', 'Contraction', 'Churned', 'Net New MRR'],
    ...(ri.mrrMovement?.map((m) => [
      m.month,
      formatCurrency(m.newMrr),
      formatCurrency(m.expansionMrr),
      formatCurrency(m.contractionMrr),
      formatCurrency(m.churnedMrr),
      formatCurrency(m.netNewMrr),
    ]) ?? []),
    [],
    ['Churn Trend', '', '', ''],
    ['Month', 'Customer Churn %', 'Revenue Churn %'],
    ...(ri.churnSeries?.map((c) => [
      c.month,
      formatPercent(c.customerChurnRate),
      formatPercent(c.revenueChurnRate),
    ]) ?? []),
  ];

  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    )
    .join('\n');

  const headers = new Headers();
  headers.set('Content-Type', 'text/csv; charset=utf-8');
  headers.set(
    'Content-Disposition',
    `attachment; filename="revenue-intelligence-${scanId}.csv"`
  );

  return new NextResponse(csv, { headers });
}

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
