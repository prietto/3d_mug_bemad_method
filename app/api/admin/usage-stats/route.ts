import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getUTCDateKey, RATE_LIMITS } from '@/lib/rateLimiter'

/**
 * Admin API endpoint for querying AI generation usage statistics
 * Protected by ADMIN_API_KEY environment variable
 *
 * GET /api/admin/usage-stats
 * Authorization: Bearer <ADMIN_API_KEY>
 *
 * Returns:
 * - Today's total generations and remaining quota
 * - Top IPs by usage for today
 * - Last 7 days historical data
 */
export async function GET(request: NextRequest) {
  try {
    // Simple authentication check
    const authHeader = request.headers.get('authorization')
    const expectedKey = process.env.ADMIN_API_KEY

    if (!expectedKey) {
      console.error('ADMIN_API_KEY not configured')
      return NextResponse.json(
        { error: 'Admin API not configured' },
        { status: 500 }
      )
    }

    if (!authHeader || authHeader !== `Bearer ${expectedKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Initialize Supabase client
    const supabase = createServerClient()
    const today = getUTCDateKey()

    // Get today's global count
    const { data: globalCount, error: globalError } = await supabase
      .from('ai_generation_global_counter')
      .select('total_generations')
      .eq('date_key', today)
      .maybeSingle()

    if (globalError) {
      console.error('Error fetching global count:', globalError)
    }

    const totalToday = globalCount?.total_generations || 0
    const remaining = RATE_LIMITS.GLOBAL_DAILY_LIMIT - totalToday
    const percentUsed = ((totalToday / RATE_LIMITS.GLOBAL_DAILY_LIMIT) * 100).toFixed(1)

    // Get IP breakdown for today (top 10)
    const { data: ipBreakdown, error: ipError } = await supabase
      .from('ai_generation_limits')
      .select('ip_address, generation_count, last_generation_at')
      .eq('date_key', today)
      .order('generation_count', { ascending: false })
      .limit(10)

    if (ipError) {
      console.error('Error fetching IP breakdown:', ipError)
    }

    // Get last 7 days history
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]

    const { data: history, error: historyError } = await supabase
      .from('ai_generation_global_counter')
      .select('date_key, total_generations, last_updated_at')
      .gte('date_key', sevenDaysAgo)
      .order('date_key', { ascending: false })

    if (historyError) {
      console.error('Error fetching history:', historyError)
    }

    return NextResponse.json({
      today: {
        date: today,
        total: totalToday,
        limit: RATE_LIMITS.GLOBAL_DAILY_LIMIT,
        remaining,
        percentUsed: `${percentUsed}%`,
        status: remaining > 100 ? 'healthy' : remaining > 0 ? 'warning' : 'at_capacity'
      },
      topIPs: ipBreakdown || [],
      history: history || [],
      limits: {
        session: RATE_LIMITS.SESSION_LIMIT,
        ipDaily: RATE_LIMITS.IP_DAILY_LIMIT,
        globalDaily: RATE_LIMITS.GLOBAL_DAILY_LIMIT
      }
    })
  } catch (error) {
    console.error('Error in usage-stats API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
