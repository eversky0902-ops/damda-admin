import { supabase } from '@/lib/supabase'

export interface SiteAnalyticsDay {
  metric_date: string
  daily_visits: number
  partner_cta_clicks: number
  signup_cta_clicks: number
}

export async function getSiteAnalytics(startDate: string, endDate: string): Promise<SiteAnalyticsDay[]> {
  // The RPC is deployed with the analytics migration; generated DB types lag behind it.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('get_site_analytics', {
    p_start_date: startDate,
    p_end_date: endDate,
  })

  if (error) throw new Error(error.message)

  return ((data || []) as SiteAnalyticsDay[]).map((row) => ({
    metric_date: row.metric_date,
    daily_visits: Number(row.daily_visits || 0),
    partner_cta_clicks: Number(row.partner_cta_clicks || 0),
    signup_cta_clicks: Number(row.signup_cta_clicks || 0),
  }))
}
