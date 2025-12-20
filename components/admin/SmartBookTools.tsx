'use client';

import { useState } from 'react';
import { Search, AlertCircle, Copy, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SmartBookTools() {
    const [issues, setIssues] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const findIssues = async () => {
        setLoading(true);
        const { data: books } = await supabase.from('books').select('*');

        const found: any[] = [];
        books?.forEach(book => {
            if (!book.cover_url) found.push({ type: 'Missing Cover', book });
            if (!book.description || book.description.length < 20) found.push({ type: 'Poor Description', book });
            if (!book.isbn) found.push({ type: 'No ISBN', book });
        });

        setIssues(found);
        setLoading(false);
    };

    return (
        <div className="space-y-4">
            <button onClick={findIssues} className="btn-primary" disabled={loading}>
                <Search size={18} /> {loading ? 'Scanning...' : 'Scan Books'}
            </button>

            {issues.length > 0 && (
                <div className="space-y-2">
                    <p className="text-white">Found {issues.length} issues</p>
                    {issues.slice(0, 10).map((issue, i) => (
                        <div key={i} className="bg-white/5 p-3 rounded-lg flex items-center gap-3">
                            <AlertCircle className="text-yellow-400" size={18} />
                            <span className="text-sm text-slate-300">{issue.type}: {issue.book.title}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
