'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { ArrowLeft, Heart, Book, Trash2 } from 'lucide-react';

interface SavedListing {
    id: string;
    listing_id: string;
    textbook_listings: {
        id: string;
        title: string;
        author: string;
        condition: string;
        price: number;
        status: string;
    };
}

export default function SavedListingsPage() {
    const router = useRouter();
    const [savedListings, setSavedListings] = useState<SavedListing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSavedListings();
    }, []);

    const fetchSavedListings = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data, error } = await supabase
                .from('saved_listings')
                .select('*, textbook_listings(*)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSavedListings(data || []);
        } catch (error: any) {
            toast.error('Failed to load saved listings');
        } finally {
            setLoading(false);
        }
    };

    const handleUnsave = async (savedId: string) => {
        try {
            const { error } = await supabase
                .from('saved_listings')
                .delete()
                .eq('id', savedId);

            if (error) throw error;

            toast.success('Removed from saved');
            fetchSavedListings();
        } catch (error: any) {
            toast.error('Failed to remove');
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-page flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-page py-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <button
                    onClick={() => router.push('/textbook-exchange')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft size={20} />
                    Back to Marketplace
                </button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-pink-600 flex items-center justify-center">
                        <Heart size={32} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-1">Saved Listings</h1>
                        <p className="text-slate-400">Your bookmarked textbooks</p>
                    </div>
                </div>

                {/* Listings Grid */}
                {savedListings.length === 0 ? (
                    <div className="glass-strong rounded-2xl p-12 text-center">
                        <div className="text-6xl mb-4">💝</div>
                        <h3 className="text-2xl font-bold text-white mb-2">No saved listings</h3>
                        <p className="text-slate-400 mb-6">Save textbooks you're interested in!</p>
                        <button
                            onClick={() => router.push('/textbook-exchange')}
                            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all"
                        >
                            Browse Marketplace
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {savedListings.map((saved) => {
                            const listing = saved.textbook_listings;
                            return (
                                <div
                                    key={saved.id}
                                    className="glass-strong rounded-2xl p-6 hover:border-green-500/30 transition-all border border-white/10"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <span className={`px-3 py-1 text-sm rounded-lg capitalize ${getConditionColor(listing.condition)}`}>
                                            {listing.condition}
                                        </span>
                                        <button
                                            onClick={() => handleUnsave(saved.id)}
                                            className="text-red-400 hover:text-red-300 transition-colors"
                                        >
                                            <Heart size={20} fill="currentColor" />
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
                                        {listing.status === 'available' ? (
                                            <button
                                                onClick={() => router.push(`/textbook-exchange/${listing.id}`)}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all text-sm font-medium"
                                            >
                                                View Details
                                            </button>
                                        ) : (
                                            <span className="px-4 py-2 bg-slate-600/20 text-slate-400 rounded-lg text-sm">
                                                Sold
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
