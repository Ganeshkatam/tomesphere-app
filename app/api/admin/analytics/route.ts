import { NextResponse } from 'next/server';
import { getLiveAnalytics, getUserGrowthData, getGenreDistribution } from '@/lib/admin-analytics';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        if (type === 'live') {
            const data = await getLiveAnalytics();
            return NextResponse.json(data);
        }

        if (type === 'growth') {
            const days = parseInt(searchParams.get('days') || '30');
            const data = await getUserGrowthData(days);
            return NextResponse.json(data);
        }

        if (type === 'genres') {
            const data = await getGenreDistribution();
            return NextResponse.json(data);
        }

        // Default: return all analytics
        const [live, growth, genres] = await Promise.all([
            getLiveAnalytics(),
            getUserGrowthData(30),
            getGenreDistribution(),
        ]);

        return NextResponse.json({
            live,
            growth,
            genres,
        });
    } catch (error) {
        console.error('Analytics API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}
