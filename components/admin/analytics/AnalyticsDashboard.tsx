'use client';

import LiveMetrics from './LiveMetrics';
import UserGrowthChart from './UserGrowthChart';
import GenreDistribution from './GenreDistribution';

export default function AnalyticsDashboard() {
    return (
        <div className="space-y-8">
            {/* Live Metrics */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-6">Live Metrics</h2>
                <LiveMetrics />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <UserGrowthChart />
                <GenreDistribution />
            </div>
        </div>
    );
}
