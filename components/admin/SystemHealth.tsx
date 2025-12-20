'use client';

import { useState, useEffect } from 'react';
import { Activity, Database, Zap, Server } from 'lucide-react';

export default function SystemHealth() {
    const [health, setHealth] = useState({ db: 'good', api: 'good', storage: 'good' });

    useEffect(() => {
        // Simulate health checks
        const interval = setInterval(() => {
            setHealth({
                db: Math.random() > 0.1 ? 'good' : 'warning',
                api: 'good',
                storage: 'good'
            });
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                    <Database size={24} className={health.db === 'good' ? 'text-green-400' : 'text-yellow-400'} />
                    <span className="text-white font-medium">Database</span>
                </div>
                <div className="text-sm text-slate-400">{health.db === 'good' ? 'Healthy' : 'Slow Response'}</div>
            </div>

            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                    <Zap size={24} className="text-green-400" />
                    <span className="text-white font-medium">API</span>
                </div>
                <div className="text-sm text-slate-400">Operational</div>
            </div>

            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                    <Server size={24} className="text-green-400" />
                    <span className="text-white font-medium">Storage</span>
                </div>
                <div className="text-sm text-slate-400">Available</div>
            </div>
        </div>
    );
}
