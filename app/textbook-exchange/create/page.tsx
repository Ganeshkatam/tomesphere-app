'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { ArrowLeft, DollarSign } from 'lucide-react';

export default function CreateListingPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        title: '',
        author: '',
        isbn: '',
        edition: '',
        condition: 'good',
        price: 0,
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!form.title.trim()) newErrors.title = 'Title is required';
        if (!form.author.trim()) newErrors.author = 'Author is required';
        if (!form.condition) newErrors.condition = 'Please select a condition';
        if (!form.price || form.price <= 0) newErrors.price = 'Price must be greater than 0';
        if (form.isbn && !/^\d{10}(\d{3})?$/.test(form.isbn.replace(/-/g, ''))) {
            newErrors.isbn = 'Invalid ISBN format';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            toast.error('Please fix the errors in the form');
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { error } = await supabase.from('textbook_listings').insert({
                seller_id: user.id,
                title: form.title,
                author: form.author,
                isbn: form.isbn,
                edition: form.edition,
                condition: form.condition,
                price: form.price,
                description: form.description,
                status: 'available'
            });

            if (error) throw error;

            toast.success('Listing created!');
            router.push('/textbook-exchange');
        } catch (error: any) {
            toast.error('Failed to create listing');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-page py-12 px-4">
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={() => router.push('/textbook-exchange')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft size={20} />
                    Back to Marketplace
                </button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
                        <DollarSign size={32} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-1">Sell Textbook</h1>
                        <p className="text-slate-400">List your textbook for sale</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="glass-strong rounded-2xl p-8">
                    <div className="space-y-6">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Book Title *
                            </label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                placeholder="Introduction to Algorithms"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-green-500/50"
                                required
                            />
                        </div>

                        {/* Author */}
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Author
                            </label>
                            <input
                                type="text"
                                value={form.author}
                                onChange={(e) => setForm({ ...form, author: e.target.value })}
                                placeholder="Thomas H. Cormen"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-green-500/50"
                            />
                        </div>

                        {/* ISBN & Edition */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    ISBN
                                </label>
                                <input
                                    type="text"
                                    value={form.isbn}
                                    onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                                    placeholder="978-0262033848"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-green-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Edition
                                </label>
                                <input
                                    type="text"
                                    value={form.edition}
                                    onChange={(e) => setForm({ ...form, edition: e.target.value })}
                                    placeholder="3rd"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-green-500/50"
                                />
                            </div>
                        </div>

                        {/* Condition & Price */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Condition *
                                </label>
                                <select
                                    value={form.condition}
                                    onChange={(e) => setForm({ ...form, condition: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-green-500/50"
                                >
                                    <option value="new">New</option>
                                    <option value="like-new">Like New</option>
                                    <option value="good">Good</option>
                                    <option value="fair">Fair</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Price ($) *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={form.price}
                                    onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                                    placeholder="50.00"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-green-500/50"
                                    required
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Description
                            </label>
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Describe the condition and any notes about the book..."
                                rows={4}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-green-500/50"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="mt-8 flex gap-4">
                        <button
                            type="button"
                            onClick={() => router.push('/textbook-exchange')}
                            className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Listing'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
