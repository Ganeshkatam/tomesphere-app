'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

import { ArrowLeft, DollarSign, Book, Heart, ShoppingBag } from 'lucide-react';
import VoiceInput from '@/components/ui/VoiceInput';

interface Listing {
    id: string;
    title: string;
    author: string;
    condition: string;
    price: number;
    seller_id: string;
    status: string;
}

export default function TextbookExchangePage() {
    const router = useRouter();
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [conditionFilter, setConditionFilter] = useState('All');

    const conditions = ['All', 'new', 'like-new', 'good', 'fair'];

    useEffect(() => {
        fetchListings();
    }, [conditionFilter]);

    const fetchListings = async () => {
        try {
            let query = supabase
                .from('textbook_listings')
                .select('*')
                .eq('status', 'available');

            if (conditionFilter !== 'All') {
                query = query.eq('condition', conditionFilter);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            setListings(data || []);
        } catch (error: any) {
            toast.error('Failed to load listings');
        } finally {
            setLoading(false);
        }
    };

    const getConditionColor = (condition: string) => {
        switch (condition) {
            case 'new': return 'text-green-400 bg-green-600/20';
            case 'like-new': return 'text-blue-400 bg-blue-600/20';
            case 'good': return 'text-yellow-400 bg-yellow-600/20';
            case 'fair': return 'text-orange-400 bg-orange-600/20';
            default: return 'text-slate-400 bg-slate-600/20';
        }
    };

    const filteredListings = listings.filter(listing =>
        listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.author?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-page py-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push('/home')}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft size={20} />
                        Back to Home
                    </button>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
                                <ShoppingBag size={32} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-white mb-1">Textbook Exchange</h1>
                                <p className="text-slate-400">Buy and sell textbooks with fellow students</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => router.push('/textbook-exchange/my-listings')}
                                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all flex items-center gap-2"
                            >
                                <DollarSign size={20} />
                                My Listings
                            </button>
                            <button
                                onClick={() => router.push('/textbook-exchange/saved')}
                                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all flex items-center gap-2"
                            >
                                <Heart size={20} />
                                Saved
                            </button>
                            <button
                                onClick={() => router.push('/textbook-exchange/create')}
                                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all flex items-center gap-2"
                            >
                                <DollarSign size={20} />
                                Sell Textbook
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="mb-6 flex gap-2 relative">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by title or author..."
                        className="flex-1 px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-green-500/50"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <VoiceInput onTranscript={setSearchTerm} />
                    </div>
                </div>

                {/* Condition Filter */}
                <div className="mb-8">
                    <div className="flex flex-wrap gap-2">
                        {conditions.map(condition => (
                            <button
                                key={condition}
                                onClick={() => setConditionFilter(condition)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${conditionFilter === condition
                                    ? 'bg-green-600 text-white'
                                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                                    }`}
                            >
                                {condition}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Listings Grid */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
                    </div>
                ) : filteredListings.length === 0 ? (
                    <div className="text-center py-20 glass-strong rounded-2xl">
                        <div className="text-6xl mb-4">📚</div>
                        <h3 className="text-2xl font-bold text-white mb-2">No textbooks found</h3>
                        <p className="text-slate-400 mb-6">
                            {searchTerm ? 'Try a different search' : 'Be the first to list a textbook!'}
                        </p>
                        <button
                            onClick={() => router.push('/textbook-exchange/create')}
                            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all"
                        >
                            Sell Textbook
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredListings.map(listing => (
                            <div
                                key={listing.id}
                                onClick={() => router.push(`/textbook-exchange/${listing.id}`)}
                                className="glass-strong rounded-2xl p-6 hover:border-green-500/30 transition-all cursor-pointer border border-white/10"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <span className={`px-3 py-1 text-sm rounded-lg capitalize ${getConditionColor(listing.condition)}`}>
                                        {listing.condition}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toast.success('Saved!');
                                        }}
                                        className="text-slate-400 hover:text-red-400 transition-colors"
                                    >
                                        <Heart size={20} />
                                    </button>
                                </div>

                                <div className="mb-4">
                                    <Book size={48} className="text-green-400 mb-3" />
                                    <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">
                                        {listing.title}
                                    </h3>
                                    <p className="text-slate-400 text-sm line-clamp-1">
                                        {listing.author}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                    <span className="text-2xl font-bold text-green-400">
                                        ${listing.price}
                                    </span>
                                    <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all text-sm font-medium">
                                        View
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
