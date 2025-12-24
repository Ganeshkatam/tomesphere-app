'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { showError, showSuccess } from '@/lib/toast';
import { ArrowLeft, Edit, Trash2, Eye, DollarSign } from 'lucide-react';

interface Listing {
    id: string;
    title: string;
    author: string;
    condition: string;
    price: number;
    status: string;
    created_at: string;
    offers_count?: number;
}

export default function MyListingsPage() {
    const router = useRouter();
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyListings();
    }, []);

    const fetchMyListings = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data, error } = await supabase
                .from('textbook_listings')
                .select('*')
                .eq('seller_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setListings(data || []);
        } catch (error: any) {
            showError('Failed to load listings');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (listingId: string) => {
        if (!confirm('Are you sure you want to delete this listing?')) return;

        try {
            const { error } = await supabase
                .from('textbook_listings')
                .delete()
                .eq('id', listingId);

            if (error) throw error;

            showSuccess('Listing deleted');
            fetchMyListings();
        } catch (error: any) {
            showError('Failed to delete listing');
        }
    };

    const handleMarkSold = async (listingId: string) => {
        try {
            const { error } = await supabase
                .from('textbook_listings')
                .update({ status: 'sold' })
                .eq('id', listingId);

            if (error) throw error;

            showSuccess('Marked as sold');
            fetchMyListings();
        } catch (error: any) {
            showError('Failed to update listing');
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return 'text-green-400 bg-green-600/20';
            case 'sold': return 'text-slate-400 bg-slate-600/20';
            case 'pending': return 'text-yellow-400 bg-yellow-600/20';
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
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <button
                            onClick={() => router.push('/textbook-exchange')}
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
                        >
                            <ArrowLeft size={20} />
                            Back to Marketplace
                        </button>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
                                <DollarSign size={32} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-white mb-1">My Listings</h1>
                                <p className="text-slate-400">Manage your textbook listings</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push('/textbook-exchange/create')}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all"
                    >
                        Add New Listing
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="glass-strong rounded-2xl p-6">
                        <p className="text-sm text-slate-400 mb-1">Total Listings</p>
                        <p className="text-3xl font-bold text-white">{listings.length}</p>
                    </div>
                    <div className="glass-strong rounded-2xl p-6">
                        <p className="text-sm text-slate-400 mb-1">Available</p>
                        <p className="text-3xl font-bold text-green-400">
                            {listings.filter(l => l.status === 'available').length}
                        </p>
                    </div>
                    <div className="glass-strong rounded-2xl p-6">
                        <p className="text-sm text-slate-400 mb-1">Sold</p>
                        <p className="text-3xl font-bold text-slate-400">
                            {listings.filter(l => l.status === 'sold').length}
                        </p>
                    </div>
                </div>

                {/* Listings */}
                {listings.length === 0 ? (
                    <div className="glass-strong rounded-2xl p-12 text-center">
                        <div className="text-6xl mb-4">📚</div>
                        <h3 className="text-2xl font-bold text-white mb-2">No listings yet</h3>
                        <p className="text-slate-400 mb-6">Start selling your textbooks!</p>
                        <button
                            onClick={() => router.push('/textbook-exchange/create')}
                            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all"
                        >
                            Create First Listing
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {listings.map((listing) => (
                            <div key={listing.id} className="glass-strong rounded-2xl p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-bold text-white">{listing.title}</h3>
                                            <span className={`px-3 py-1 rounded-lg text-xs capitalize ${getStatusColor(listing.status)}`}>
                                                {listing.status}
                                            </span>
                                            <span className={`px-3 py-1 rounded-lg text-xs capitalize ${getConditionColor(listing.condition)}`}>
                                                {listing.condition}
                                            </span>
                                        </div>
                                        <p className="text-slate-400 mb-3">{listing.author}</p>
                                        <div className="flex items-center gap-6 text-sm">
                                            <div>
                                                <span className="text-slate-500">Price: </span>
                                                <span className="text-green-400 font-bold text-lg">${listing.price}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500">Listed: </span>
                                                <span className="text-white">{new Date(listing.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => router.push(`/textbook-exchange/${listing.id}`)}
                                            className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-all"
                                            title="View"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        {listing.status === 'available' && (
                                            <>
                                                <button
                                                    onClick={() => handleMarkSold(listing.id)}
                                                    className="px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition-all text-sm"
                                                >
                                                    Mark Sold
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(listing.id)}
                                                    className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
