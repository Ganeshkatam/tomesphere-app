'use client';

import { mockClubs } from '@/lib/mockSocialData';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

export default function ActiveClubs() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user));
  }, []);

  const handleJoinClub = async (clubName: string) => {
    if (!user) {
      toast.error('Please sign in to join book clubs');
      router.push('/login');
      return;
    }

    toast.success(`Welcome to ${clubName}! 🎉`);
    // In future: await supabase.from('club_members').insert(...)
  };

  return (
    <div className="glass-strong rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">👥 Active Book Clubs</h3>
        <a href="/community" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
          View All →
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockClubs.map((club) => (
          <div
            key={club.id}
            className="group bg-gradient-to-br from-white/5 to-white/0 hover:from-indigo-600/10 hover:to-purple-600/10 rounded-xl p-4 border border-white/10 hover:border-indigo-500/30 transition-all duration-300 cursor-pointer"
          >
            <div className="text-3xl mb-3">{club.icon}</div>
            <h4 className="font-semibold text-white mb-1 group-hover:text-indigo-400 transition-colors">
              {club.name}
            </h4>
            <p className="text-xs text-slate-400 mb-3">{club.description}</p>

            <div className="flex items-center justify-between text-xs mb-3">
              <span className="text-slate-400">
                <span className="text-indigo-400 font-semibold">{club.members.toLocaleString()}</span> members
              </span>
            </div>

            <div className="bg-white/5 rounded-lg p-2 mb-3">
              <p className="text-xs text-slate-500 mb-1">Currently Reading:</p>
              <p className="text-sm text-white font-medium">{club.currentlyReading}</p>
            </div>

            <button
              onClick={() => handleJoinClub(club.name)}
              className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 rounded-lg text-sm font-medium transition-colors"
            >
              Join Club
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
