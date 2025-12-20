'use client';

import { Download } from 'lucide-react';
import { exportBooksToPDF } from '@/lib/pdf-export';

export default function ReportsGenerator({ books, users }: any) {
    const generateUserReport = () => {
        const csv = `Email,Name,Role,Created\n${users.map((u: any) =>
            `${u.email},${u.name},${u.role},${u.created_at}`
        ).join('\n')}`;

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-report-${Date.now()}.csv`;
        a.click();
    };

    return (
        <div className="flex gap-4">
            <button
                onClick={() => exportBooksToPDF(books)}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-medium shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
            >
                <Download size={18} />
                <span>Books Report (PDF)</span>
            </button>
            <button
                onClick={generateUserReport}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium border border-white/10 hover:border-white/20 transition-all flex items-center gap-2"
            >
                <Download size={18} />
                <span>Users Report (CSV)</span>
            </button>
        </div>
    );
}
