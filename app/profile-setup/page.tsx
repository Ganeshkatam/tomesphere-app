'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { showError, showSuccess } from '@/lib/toast';

export default function ProfileSetupPage() {
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        favoriteGenres: [] as string[],
        readingGoal: 12,
    });
    const router = useRouter();

    const genres = ['Fiction', 'Non-Fiction', 'Mystery', 'Sci-Fi', 'Romance', 'Thriller', 'Biography', 'History', 'Fantasy', 'Self-Help'];

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            router.push('/login');
            return;
        }
        setUser(session.user);

        // Pre-fill name if available
        const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', session.user.id)
            .single();

        if (profile?.name) {
            setFormData(prev => ({ ...prev, name: profile.name }));
        }
    };

    const toggleGenre = (genre: string) => {
        setFormData(prev => ({
            ...prev,
            favoriteGenres: prev.favoriteGenres.includes(genre)
                ? prev.favoriteGenres.filter(g => g !== genre)
                : [...prev.favoriteGenres, genre]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            showError('Please check your network settings');
            return;
        }

        if (formData.favoriteGenres.length === 0) {
            showError('Please select at least one favorite genre');
            return;
        }

        setLoading(true);

        try {
            // Update profile with complete information
            const { error } = await supabase
                .from('profiles')
                .update({
                    name: formData.name,
                    bio: formData.bio || null,
                    favorite_genres: formData.favoriteGenres,
                    reading_goal: formData.readingGoal,
                    profile_completed: true,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (error) throw error;

            showSuccess('Profile setup complete!');

            setTimeout(() => {
                router.push('/home');
            }, 1000);
        } catch (error: any) {
            console.error('Error:', error);
            showError(error.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-page flex items-start justify-center p-4 sm:p-6 md:py-12">
            {/* <Toaster position="top-right" /> */}

            <div className="w-full max-w-2xl">
                <div className="text-center mb-8 animate-fadeIn">
                    <span className="text-6xl mb-4 block">👋</span>
                    <h1 className="text-4xl font-display font-bold mb-2">Welcome to TomeSphere!</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Let's set up your profile to personalize your reading experience
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="card animate-slideUp">
                    {/* Name */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">
                            Your Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="John Doe"
                            className="w-full"
                            required
                        />
                    </div>

                    {/* Bio */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">
                            About You (Optional)
                        </label>
                        <textarea
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            placeholder="Tell us a bit about yourself and your reading interests..."
                            className="w-full h-24 resize-none"
                            maxLength={200}
                        />
                        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                            {formData.bio.length}/200 characters
                        </p>
                    </div>

                    {/* Favorite Genres */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-3">
                            Favorite Genres * (Select at least one)
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {genres.map(genre => (
                                <button
                                    key={genre}
                                    type="button"
                                    onClick={() => toggleGenre(genre)}
                                    className={`px-4 py-2 rounded-lg border transition-all ${formData.favoriteGenres.includes(genre)
                                        ? 'bg-primary border-primary text-white'
                                        : 'border-white/10 hover:border-white/20'
                                        }`}
                                >
                                    {genre}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Reading Goal */}
                    <div className="mb-8">
                        <label className="block text-sm font-medium mb-2">
                            Yearly Reading Goal
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="1"
                                max="100"
                                value={formData.readingGoal}
                                onChange={(e) => setFormData({ ...formData, readingGoal: parseInt(e.target.value) })}
                                className="flex-1"
                            />
                            <span className="text-2xl font-bold gradient-text min-w-[4rem] text-center">
                                {formData.readingGoal}
                            </span>
                        </div>
                        <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                            Books per year
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full"
                    >
                        {loading ? (
                            <>
                                <div className="spinner" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <span>Complete Setup</span>
                                <span>→</span>
                            </>
                        )}
                    </button>

                    <p className="text-xs text-center mt-4" style={{ color: 'var(--text-tertiary)' }}>
                        You can always update these later in your profile settings
                    </p>
                </form>
            </div>
        </div>
    );
}
