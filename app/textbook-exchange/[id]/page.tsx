'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { ArrowLeft, Book, DollarSign, Heart, User } from 'lucide-react';

interface Listing {
    id: string;
    title: string;
    author: string;
    isbn: string;
    edition: string;
    condition: string;
    price: number;
    description: string;
    seller_id: string;
    status: string;
    created_at: string;
}

export default function ListingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const listingId = params.id as string;

    const [listing, setListing] = useState<Listing | null>(null);
    const [loading, setLoading] = useState(true);
    const [showOfferModal, setShowOfferModal] = useState(false);
    const [offerPrice, setOfferPrice] = useState('');
    const [offerMessage, setOfferMessage] = useState('');

    useEffect(() => {
        fetchListing();
    }, [listingId]);

    const fetchListing = async () => {
        try {
            const { data, error } = await supabase
                .from('textbook_listings')
                .select('*')
                .eq('id', listingId)
                .single();

            if (error) throw error;
            setListing(data);
            setOfferPrice(data.price.toString());
        } catch (error: any) {
            toast.error('Failed to load listing');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveListing = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { error } = await supabase
                .from('saved_listings')
                .insert({
                    user_id: user.id,
                    listing_id: listingId
                });

            if (error) throw error;
            toast.success('Listing saved!');
        } catch (error: any) {
            toast.error('Failed to save listing');
        }
    };

    const handleMakeOffer = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { error } = await supabase
                .from('textbook_offers')
                .insert({
                    listing_id: listingId,
                    buyer_id: user.id,
                    offered_price: parseFloat(offerPrice),
                    message: offerMessage,
                    status: 'pending'
                });

            if (error) throw error;

            toast.success('Offer sent!');
            setShowOfferModal(false);
            setOfferMessage('');
        } catch (error: any) {
            toast.error('Failed to send offer');
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

    if (!listing) {
        return (
            <div className="min-h-screen bg-gradient-page flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Listing not found</h2>
                    <button onClick={() => router.push('/textbook-exchange')} className="text-green-400 hover:underline">
                        Go back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-page py-12 px-4">
            <div className="max-w-5xl mx-auto">
                <button
                    onClick={() => router.push('/textbook-exchange')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft size={20} />
                    Back to Marketplace
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        <div className="glass-strong rounded-2xl p-8">
                            <div className="flex items-center justify-between mb-6">
                                <span className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${getConditionColor(listing.condition)}`}>
                                    {listing.condition}
                                </span>
                                <button
                                    onClick={handleSaveListing}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-all"
                                >
                                    <Heart size={24} className="text-red-400" />
                                </button>
                            </div>

                            <div className="flex items-center gap-4 mb-6">
                                <Book size={64} className="text-green-400" />
                                <div>
                                    <h1 className="text-3xl font-bold text-white mb-2">{listing.title}</h1>
                                    <p className="text-xl text-slate-300">{listing.author}</p>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                {listing.isbn && (
                                    <div>
                                        <p className="text-sm text-slate-400">ISBN</p>
                                        <p className="text-white">{listing.isbn}</p>
                                    </div>
                                )}
                                {listing.edition && (
                                    <div>
                                        <p className="text-sm text-slate-400">Edition</p>
                                        <p className="text-white">{listing.edition}</p>
                                    </div>
                                )}
                                {listing.description && (
                                    <div>
                                        <p className="text-sm text-slate-400 mb-2">Description</p>
                                        <p className="text-white">{listing.description}</p>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-white/10 pt-6">
                                <p className="text-sm text-slate-400 mb-1">Listed on</p>
                                <p className="text-white">{new Date(listing.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Price & Actions */}
                    <div className="lg:col-span-1">
                        <div className="glass-strong rounded-2xl p-6 sticky top-6">
                            {/* Price */}
                            <div className="mb-8">
                                <p className="text-sm text-slate-400 mb-1">Price</p>
                                <p className="text-5xl font-bold text-green-400">${listing.price}</p>
                            </div>

                            {/* Contact Seller */}
                            {listing.status === 'available' && (
                                <div className="mb-6">
                                    <button
                                        onClick={() => {
                                            toast.success('Seller will be notified of your interest!');
                                        }}
                                        className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all font-medium text-lg"
                                    >
                                        Contact Seller
                                    </button>
                                    <p className="text-xs text-slate-400 mt-2 text-center">
                                        Seller contact details will be shared after confirmation
                                    </p>
                                </div>
                            )}

                            {/* Payment Info */}
                            <div className="glass-strong rounded-xl p-4 mb-6">
                                <h3 className="text-sm font-semibold text-white mb-2">💳 Payment</h3>
                                <p className="text-xs text-slate-400">
                                    Payment is peer-to-peer. Common methods: Venmo, Zelle, PayPal, or cash.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => setShowOfferModal(true)}
                                    className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all font-medium"
                                >
                                    Make an Offer
                                </button>
                                <button
                                    onClick={handleSaveListing}
                                    className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-medium flex items-center justify-center gap-2"
                                >
                                    <Heart size={20} />
                                    Save Listing
                                </button>
                            </div>

                            <div className="mt-6 pt-6 border-t border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
                                        <User size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-400">Seller</p>
                                        <p className="text-white font-medium">Student</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Offer Modal */}
                {showOfferModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="glass-strong rounded-2xl p-8 max-w-md w-full">
                            <h2 className="text-2xl font-bold text-white mb-6">Make an Offer</h2>

                            <form onSubmit={handleMakeOffer} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Your Offer ($)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={offerPrice}
                                        onChange={(e) => setOfferPrice(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-green-500/50"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Message (Optional)
                                    </label>
                                    <textarea
                                        value={offerMessage}
                                        onChange={(e) => setOfferMessage(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-green-500/50"
                                        placeholder="Add a message to the seller..."
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowOfferModal(false)}
                                        className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all"
                                    >
                                        Send Offer
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
