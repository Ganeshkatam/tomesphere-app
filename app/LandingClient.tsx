'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FadeIn, SlideUp, ScaleIn, StaggerContainer, StaggerItem } from '@/components/ui/motion';
import toast, { Toaster } from 'react-hot-toast';
import ALL_GENRES from '@/lib/genres';
import VoiceInput from '@/components/VoiceInput';
import { Menu, X } from 'lucide-react';
import BookCard from '@/components/BookCard'; // 1. Import BookCard

// Lazy load heavy components
const AuthGateModal = dynamic(() => import('@/components/AuthGateModal'), { ssr: false });
const SocialShowcase = dynamic(() => import('@/components/SocialShowcase'), {
  loading: () => <div className="h-96 bg-white/5 animate-pulse rounded-xl" />
});
const StudentSection = dynamic(() => import('@/components/StudentSection'), {
  loading: () => <div className="h-96 bg-white/5 animate-pulse rounded-xl" />
});

export default function LandingClient() {
  const [popularBooks, setPopularBooks] = useState<any[]>([]);
  const [allBooks, setAllBooks] = useState<any[]>([]);
  const [booksToShow, setBooksToShow] = useState(10);
  const [stats, setStats] = useState({ books: 0, readers: 0, reviews: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [genres, setGenres] = useState<string[]>(ALL_GENRES && ALL_GENRES.length > 0 ? ALL_GENRES : ['Fiction', 'Non-Fiction', 'Mystery', 'Sci-Fi', 'Fantasy']);

  useEffect(() => {
    console.log('Genres loaded:', genres.length, genres);
  }, [genres]);

  const [genreSearch, setGenreSearch] = useState('');
  const [genresToShow, setGenresToShow] = useState(5);
  const [isSearchSticky, setIsSearchSticky] = useState(false);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isHoveringCarousel, setIsHoveringCarousel] = useState(false);
  const [searchOrigin, setSearchOrigin] = useState<'book' | 'genre' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchData();

    // Check if auth gate should be shown
    if (typeof window !== 'undefined') {
      const hasSeenAuthGate = localStorage.getItem('hasSeenAuthGate');
      if (!hasSeenAuthGate) {
        setShowAuthGate(true);
      }
    }

    // Scroll listener for sticky search
    const handleScroll = () => {
      const genreSection = document.getElementById('genre-section');
      if (genreSection) {
        const rect = genreSection.getBoundingClientRect();
        setIsSearchSticky(rect.bottom < 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-slide trending books carousel
  useEffect(() => {
    if (isHoveringCarousel || popularBooks.length === 0) return;

    const interval = setInterval(() => {
      const container = document.getElementById('trending-scroll');
      if (container) {
        const scrollWidth = container.scrollWidth;
        const clientWidth = container.clientWidth;
        const maxScroll = scrollWidth - clientWidth;

        if (container.scrollLeft >= maxScroll - 10) {
          // Reset to beginning
          container.scrollLeft = 0;
        } else {
          // Scroll by one card width (roughly 272px including gap)
          container.scrollLeft += 272;
        }
      }
    }, 3000); // Auto-slide every 3 seconds

    return () => clearInterval(interval);
  }, [isHoveringCarousel, popularBooks.length]);

  // Reset genre display when search changes
  useEffect(() => {
    setGenresToShow(5); // Reset to 5 when searching
  }, [genreSearch]);

  useEffect(() => {
    if (popularBooks.length > 0) {
      const interval = setInterval(() => {
        setCarouselIndex((prev) => (prev + 1) % popularBooks.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [popularBooks]);

  const fetchData = async () => {
    try { // 4. Wrap fetchData in try/catch
      // Fetch popular books (limited to 8 for carousel)
      const { data: books, error: popularBooksError } = await supabase
        .from('books')
        .select('*')
        .limit(15)
        .order('created_at', { ascending: false });

      if (popularBooksError) throw popularBooksError;
      if (books) {
        setPopularBooks(books);
      }

      // Fetch ALL books for the "All Available Books" section
      const { data: allBooksData, error: allBooksError } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

      if (allBooksError) throw allBooksError;
      if (allBooksData) {
        setAllBooks(allBooksData);
      }

      // Fetch stats
      const { count: bookCount, error: bookCountError } = await supabase.from('books').select('*', { count: 'exact', head: true });
      if (bookCountError) throw bookCountError;

      const { count: profileCount, error: profileCountError } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      if (profileCountError) throw profileCountError;

      setStats({
        books: bookCount || 0,
        readers: profileCount || 0,
        reviews: Math.floor((bookCount || 0) * 3.2) // Simplified estimation or 0
      });
    } catch (error: any) { // 4. Add toast errors
      console.error('Error fetching data:', error.message);
      toast.error(`Failed to load data: ${error.message || 'Unknown error'} `);
    }
  };

  const handleSearch = () => {
    // If there's a search query or genres, scroll to results
    if (searchQuery || selectedGenres.length > 0) {
      setSearchOrigin('book');
      setTimeout(() => {
        document.getElementById('all-books-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      // No filters - go to explore page
      router.push('/explore');
    }
  };

  // Navigate back to the appropriate search section
  const handleBackToSearch = () => {
    const targetId = searchOrigin === 'genre' ? 'genre-section' : 'hero-search';
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
    setSearchOrigin(null);
  };

  // Filter books based on selected genres and search query
  const filteredBooks = allBooks.filter(book => {
    // 1. Text Search Filter (Title/Author/Genre)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = book.title?.toLowerCase().includes(query);
      const matchesAuthor = book.author?.toLowerCase().includes(query);
      const matchesGenre = book.genre?.toLowerCase().includes(query);
      if (!matchesTitle && !matchesAuthor && !matchesGenre) return false;
    }

    // 2. Genre Filter (if selected)
    if (selectedGenres.length > 0) {
      if (!book.genre) return false;
      const bookGenre = book.genre.toLowerCase().trim();
      return selectedGenres.some(genre => {
        const selectedGenre = genre.toLowerCase().trim();
        return bookGenre === selectedGenre ||
          bookGenre.includes(selectedGenre) ||
          selectedGenre.includes(bookGenre);
      });
    }

    return true;
  });

  useEffect(() => {
    setBooksToShow(10);
    // Scroll to books section when filters change
    if (selectedGenres.length > 0) {
      setTimeout(() => {
        const booksSection = document.getElementById('all-books-section');
        if (booksSection) {
          booksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
    console.log('Selected genres:', selectedGenres);
    console.log('Filtered books count:', selectedGenres.length > 0
      ? allBooks.filter(book => {
        // 1. Text Search Filter (Title/Author)
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesTitle = book.title?.toLowerCase().includes(query);
          const matchesAuthor = book.author?.toLowerCase().includes(query);
          const matchesGenre = book.genre?.toLowerCase().includes(query);
          if (!matchesTitle && !matchesAuthor && !matchesGenre) return false;
        }

        // 2. Genre Filter
        if (!book.genre) return false;
        const bookGenre = book.genre.toLowerCase().trim();
        return selectedGenres.some(genre => {
          const selectedGenre = genre.toLowerCase().trim();
          return bookGenre === selectedGenre ||
            bookGenre.includes(selectedGenre) ||
            selectedGenre.includes(bookGenre);
        });
      }).length
      : allBooks.length);
  }, [selectedGenres, allBooks, searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-page relative w-full max-w-full mx-auto overflow-x-hidden">
      {/* Toast Notifications */}
      <Toaster position="top-right" />
      {/* Auth Gate Modal */}
      {showAuthGate && (
        <AuthGateModal onClose={() => setShowAuthGate(false)} />
      )}

      {/* Sticky Search Bar - Appears on Scroll - PROMINENT - Below Navbar */}
      {isSearchSticky && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-slate-900/90 glass-ultra border-b border-indigo-500/30 py-3 px-4 shadow-2xl shadow-indigo-500/20 animate-slideDown backdrop-blur-xl transition-[top] duration-300">
          <div className="max-w-6xl mx-auto">
            <div className="flex gap-3 items-start">
              {/* Search Input */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const booksSection = document.getElementById('all-books-section');
                      if (booksSection) booksSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  placeholder="Search title, author, or genre..."
                  className="w-full px-4 py-2 pl-10 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all text-sm"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-sm"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Genre Dropdown Selector - Popular & Student-Friendly */}
              <div className="relative">
                <select
                  value=""
                  onChange={(e) => {
                    const genre = e.target.value;
                    if (genre && !selectedGenres.includes(genre)) {
                      setSelectedGenres([...selectedGenres, genre]);
                    }
                  }}
                  className="px-4 py-2 pr-8 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all appearance-none cursor-pointer min-w-[160px]"
                >
                  <option value="" className="bg-slate-900">Select Genre</option>
                  <optgroup label="📚 Popular Genres" className="bg-slate-900">
                    <option value="Fiction" className="bg-slate-900">Fiction</option>
                    <option value="Non-Fiction" className="bg-slate-900">Non-Fiction</option>
                    <option value="Romance" className="bg-slate-900">Romance</option>
                    <option value="Mystery" className="bg-slate-900">Mystery</option>
                    <option value="Thriller" className="bg-slate-900">Thriller</option>
                    <option value="Fantasy" className="bg-slate-900">Fantasy</option>
                    <option value="Science Fiction" className="bg-slate-900">Science Fiction</option>
                    <option value="Horror" className="bg-slate-900">Horror</option>
                    <option value="Biography" className="bg-slate-900">Biography</option>
                    <option value="Self-Help" className="bg-slate-900">Self-Help</option>
                  </optgroup>
                  <optgroup label="🎓 Academic & Student" className="bg-slate-900">
                    <option value="Computer Science" className="bg-slate-900">Computer Science</option>
                    <option value="Programming" className="bg-slate-900">Programming</option>
                    <option value="Mathematics" className="bg-slate-900">Mathematics</option>
                    <option value="Science" className="bg-slate-900">Science</option>
                    <option value="Engineering" className="bg-slate-900">Engineering</option>
                    <option value="Business" className="bg-slate-900">Business</option>
                    <option value="Economics" className="bg-slate-900">Economics</option>
                    <option value="Psychology" className="bg-slate-900">Psychology</option>
                    <option value="Medicine" className="bg-slate-900">Medicine</option>
                    <option value="Law" className="bg-slate-900">Law</option>
                    <option value="History" className="bg-slate-900">History</option>
                    <option value="Philosophy" className="bg-slate-900">Philosophy</option>
                  </optgroup>
                  <optgroup label="💼 Professional" className="bg-slate-900">
                    <option value="Technology" className="bg-slate-900">Technology</option>
                    <option value="Finance" className="bg-slate-900">Finance</option>
                    <option value="Marketing" className="bg-slate-900">Marketing</option>
                    <option value="Leadership" className="bg-slate-900">Leadership</option>
                    <option value="Entrepreneurship" className="bg-slate-900">Entrepreneurship</option>
                  </optgroup>
                </select>
                <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Search Button */}
              <button
                onClick={() => {
                  const booksSection = document.getElementById('all-books-section');
                  if (booksSection) {
                    booksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/50 font-medium text-sm flex items-center gap-2 whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </button>
            </div>

            {/* Selected Genres */}
            {selectedGenres.length > 0 && (
              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className="text-slate-400">Selected:</span>
                <div className="flex gap-1 flex-wrap">
                  {selectedGenres.map(g => (
                    <button
                      key={g}
                      onClick={() => setSelectedGenres(selectedGenres.filter(genre => genre !== g))}
                      className="px-2 py-1 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/40 transition-colors flex items-center gap-1"
                    >
                      {g}
                      <span className="text-xs">✕</span>
                    </button>
                  ))}
                  <button
                    onClick={() => setSelectedGenres([])}
                    className="px-2 py-1 text-slate-400 hover:text-white transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Premium Navigation - Fully Responsive */}
      <nav className="glass-strong sticky top-0 z-50 border-b w-full" style={{ borderColor: 'var(--border-5)' }}>
        <div className="w-full max-w-[2000px] mx-auto px-4 lg:px-6 py-3 lg:py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 group">
              <span className="text-3xl sm:text-4xl lg:text-5xl transition-transform group-hover:scale-110">📚</span>
              <span className="text-xl sm:text-2xl lg:text-3xl font-display font-bold gradient-text">TomeSphere</span>
            </a>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center gap-6">
              <a href="/explore" className="btn btn-ghost text-sm">
                <span>🔍</span>
                <span>Explore</span>
              </a>
              <a
                href="#student-section"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('student-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn btn-ghost text-sm"
              >
                <span>🎓</span>
                <span>For Students</span>
              </a>
              <a href="/home" className="btn btn-ghost text-sm">
                <span>📊</span>
                <span>Dashboard</span>
              </a>
              <a href="/library" className="btn btn-ghost text-sm">
                <span></span>
                <span>My Library</span>
              </a>
              <a href="/login" className="btn btn-ghost text-sm px-4">
                Sign In
              </a>
              <a href="/signup" className="btn-primary text-sm px-6">
                Get Started Free
              </a>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center gap-2">
              {/* Quick Sign In for Mobile */}
              <a href="/login" className="px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-white/5 rounded-lg border border-white/10">
                Sign In
              </a>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-all border border-transparent hover:border-white/10"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Side Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Side Drawer */}
      <div className={`fixed top-0 right-0 h-full w-4/5 sm:w-80 bg-slate-900/95 backdrop-blur-2xl border-l border-white/10 z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} shadow-2xl`}>
        <div className="flex flex-col h-full">
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/5">
            <span className="text-xl font-display font-bold text-white">Menu</span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
            <a
              href="/explore"
              className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-200 hover:bg-white/10 hover:text-white transition-all group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">🔍</span>
              <span className="font-medium text-lg">Explore</span>
            </a>

            <a
              href="#student-section"
              onClick={(e) => {
                e.preventDefault();
                setMobileMenuOpen(false);
                document.getElementById('student-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-200 hover:bg-white/10 hover:text-white transition-all group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">🎓</span>
              <span className="font-medium text-lg">For Students</span>
            </a>

            <a
              href="/home"
              className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-200 hover:bg-white/10 hover:text-white transition-all group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">📊</span>
              <span className="font-medium text-lg">Dashboard</span>
            </a>

            <a
              href="/library"
              className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-200 hover:bg-white/10 hover:text-white transition-all group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">📚</span>
              <span className="font-medium text-lg">My Library</span>
            </a>

            <div className="my-4 border-t border-white/10" />

            <a
              href="/login"
              className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-200 hover:bg-white/10 hover:text-white transition-all group"
            >
              <span className="text-2xl">🔐</span>
              <span className="font-medium text-lg">Sign In</span>
            </a>
          </div>

          {/* Drawer Footer */}
          <div className="p-6 border-t border-white/10 bg-white/5">
            <a
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-lg hover:shadow-indigo-500/30 transition-all"
            >
              Get Started Free
            </a>
            <p className="text-center text-xs text-slate-500 mt-4">
              TomeSphere Mobile v1.0
            </p>
          </div>
        </div>
      </div>

      {/* Hero Section with Central Search */}
      <section className="relative py-24 sm:py-32 lg:py-40 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-[2000px] pointer-events-none">
          <div className="absolute top-20 left-10 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute top-40 right-10 w-[400px] h-[400px] bg-secondary/20 rounded-full blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        </div>

        <div className="w-full max-w-[2000px] mx-auto px-2 sm:px-4 lg:px-6 relative z-10">
          <FadeIn className="text-center w-full mx-auto" delay={0.2}>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8 hover:bg-white/10 transition-colors cursor-default">
              <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="text-sm font-medium text-slate-300">The Future of Book Discovery</span>
            </div>

            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-display font-bold mb-8 leading-[1.1] tracking-tight">
              <span className="text-balance text-white drop-shadow-sm">Discover Books That</span>
              <br />
              <span className="bg-gradient-to-r from-primary-light via-accent to-secondary bg-clip-text gradient-text drop-shadow-lg">
                Ignite Your Mind
              </span>
            </h1>

            <p className="text-lg sm:text-2xl mb-12 text-balance max-w-3xl mx-auto leading-relaxed text-slate-400">
              Join a global community leveraging AI to uncover hidden literary gems.
              Your next life-changing read is just a search away.
            </p>

            {/* Central Search Bar - Premium Glass */}
            <SlideUp className="w-full max-w-5xl mx-auto mb-16" delay={0.4}>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-3xl opacity-25 group-hover:opacity-50 blur transition duration-1000 group-hover:duration-200" />

                <div className="relative flex flex-col md:flex-row gap-4 p-3 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl">
                  {/* Search Input */}
                  <div id="hero-search" className="relative flex-1 group/input">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <span className="text-2xl opacity-50 text-slate-400 group-focus-within/input:text-primary transition-colors">🔍</span>
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Search titles, authors, or topics..."
                      className="w-full h-14 pl-14 pr-16 bg-white/5 border border-white/5 rounded-xl text-lg text-white placeholder-slate-500 focus:outline-none focus:bg-white/10 focus:border-primary/50 transition-all font-sans"
                    />
                    {/* Voice Input */}
                    <div className="absolute inset-y-0 right-2 flex items-center">
                      <VoiceInput
                        onTranscript={(text) => setSearchQuery(text)}
                        className="h-10 w-10"
                      />
                    </div>
                  </div>

                  {/* Search Button */}
                  <button
                    onClick={handleSearch}
                    className="h-14 px-8 btn-primary text-lg font-semibold tracking-wide shadow-glow hover:shadow-glow-lg active:scale-95 whitespace-nowrap"
                  >
                    Explore
                  </button>
                </div>
              </div>
            </SlideUp>

            {/* Genre Chips - Multi-Select with Search Dropdown */}
            <SlideUp>
              <div id="genre-section" className="mt-8">
                {/* Search Bar with Dropdown and Search Button */}
                <div className="max-w-3xl mx-auto mb-6 relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={genreSearch}
                        onChange={(e) => setGenreSearch(e.target.value)}
                        placeholder="Search and select genres..."
                        className="w-full px-4 py-3 pl-10 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
                      />
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      {genreSearch && (
                        <button
                          onClick={() => setGenreSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          ✕
                        </button>
                      )}

                      {/* Dropdown Suggestion Box */}
                      {genreSearch && (
                        <div className="absolute top-full left-0 right-0 mt-2 max-h-96 overflow-y-auto bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50">
                          <div className="p-2">
                            <p className="text-xs text-slate-400 px-3 py-2">
                              {genres.filter(g => g.toLowerCase().includes(genreSearch.toLowerCase())).length} genres found - Click to select
                            </p>
                            {genres
                              .filter(g => g.toLowerCase().includes(genreSearch.toLowerCase()))
                              .slice(0, 20)
                              .map((genre) => {
                                const isSelected = selectedGenres.includes(genre);
                                return (
                                  <button
                                    key={genre}
                                    onClick={() => {
                                      if (isSelected) {
                                        setSelectedGenres(selectedGenres.filter(g => g !== genre));
                                      } else {
                                        setSelectedGenres([...selectedGenres, genre]);
                                      }
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between ${isSelected
                                      ? 'bg-indigo-600/30 text-white border border-indigo-500/50'
                                      : 'hover:bg-white/5 text-slate-300'
                                      }`}
                                  >
                                    <span>{genre}</span>
                                    {isSelected && <span className="text-green-400">✓</span>}
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Search Button - Scrolls to Results */}
                    <button
                      onClick={() => {
                        if (selectedGenres.length > 0) {
                          setSearchOrigin('genre');
                          setTimeout(() => {
                            document.getElementById('all-books-section')?.scrollIntoView({ behavior: 'smooth' });
                          }, 100);
                        }
                      }}
                      disabled={selectedGenres.length === 0}
                      className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 whitespace-nowrap h-fit ${selectedGenres.length > 0
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30'
                        : 'bg-white/5 text-slate-500 cursor-not-allowed'
                        }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span className="hidden sm:inline">Find Books</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4 mb-6">
                  <p className="text-lg text-slate-200 font-bold">
                    📚 {selectedGenres.length > 0
                      ? `${selectedGenres.length} Genre${selectedGenres.length > 1 ? 's' : ''} Selected`
                      : `Explore ${genres.length} Genres`}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-3 max-w-6xl mx-auto mb-5">
                  {genres.filter(g => g.toLowerCase().includes(genreSearch.toLowerCase())).slice(0, genresToShow).map((genre) => {
                    const isSelected = selectedGenres.includes(genre);

                    // Genre emoji mapping (same as homepage)
                    const genreEmojis: Record<string, string> = {
                      'Fiction': '📚', 'Non-Fiction': '📖', 'Science': '🔬', 'Technology': '💻',
                      'History': '🏛️', 'Biography': '👤', 'Mystery': '🔍', 'Romance': '💕',
                      'Fantasy': '🐉', 'Sci-Fi': '🚀', 'Horror': '👻', 'Thriller': '⚡',
                      'Self-Help': '🌟', 'Business': '💼', 'Cooking': '🍳', 'Art': '🎨',
                      'Music': '🎵', 'Poetry': '✍️', 'Drama': '🎭', 'Adventure': '🗺️',
                      'Philosophy': '🤔', 'Religion': '📿', 'Politics': '🏛️', 'Economics': '📊',
                      'Psychology': '🧠', 'Education': '🎓', 'Health': '⚕️', 'Travel': '✈️',
                      'Sports': '⚽', 'Nature': '🌿',
                    };

                    const emoji = genreEmojis[genre] || '📕';

                    return (
                      <button
                        key={genre}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedGenres(selectedGenres.filter(g => g !== genre));
                          } else {
                            setSelectedGenres([...selectedGenres, genre]);
                          }
                        }}
                        className={`group px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 border-2 backdrop-blur-md relative overflow-hidden ${isSelected
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400 shadow-2xl shadow-indigo-500/50 scale-105'
                          : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/15 hover:border-primary/40 hover:text-white hover:scale-105'
                          }`}
                      >
                        {/* Glow effect */}
                        <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isSelected ? 'bg-white/10' : 'bg-gradient-to-r from-primary/20 to-secondary/20'
                          }`} />

                        <span className="relative flex items-center gap-2">
                          <span className="text-lg">{emoji}</span>
                          <span>{genre}</span>
                        </span>
                      </button>
                    );
                  })}
                  {selectedGenres.length > 0 && (
                    <button
                      onClick={() => setSelectedGenres([])}
                      title="Clear filters"
                      className="px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border backdrop-blur-md bg-red-600/20 text-red-300 border-red-500/30 hover:bg-red-600/30 hover:border-red-500/50"
                    >
                      Clear ({selectedGenres.length})
                    </button>
                  )}
                </div>

                {/* Load More / Show Less Buttons */}
                <div className="flex justify-center gap-3 mt-4">
                  {genresToShow < genres.filter(g => g.toLowerCase().includes(genreSearch.toLowerCase())).length && (
                    <button
                      onClick={() => setGenresToShow(prev => Math.min(prev + 5, genres.length))}
                      className="px-6 py-2 rounded-full bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-all text-sm font-medium"
                    >
                      Load 5 More ({genres.filter(g => g.toLowerCase().includes(genreSearch.toLowerCase())).length - genresToShow} remaining)
                    </button>
                  )}
                  {genresToShow > 5 && (
                    <button
                      onClick={() => setGenresToShow(5)}
                      className="px-6 py-2 rounded-full bg-slate-600/20 hover:bg-slate-600/30 text-slate-300 border border-slate-500/30 transition-all text-sm font-medium"
                    >
                      Show Less ▲
                    </button>
                  )}
                </div>
              </div>
            </SlideUp>

            {/* Live Stats - Glassmorphic Design */}
            <ScaleIn className="max-w-2xl mx-auto mt-4" delay={0.6}>
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-1 font-display">
                      {stats.books.toLocaleString()}+
                    </div>
                    <div className="text-sm text-slate-400 uppercase tracking-wider font-medium">Curated Books</div>
                  </div>
                  <div className="text-center border-l border-white/10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent mb-1 font-display">
                      {stats.readers.toLocaleString()}+
                    </div>
                    <div className="text-sm text-slate-400 uppercase tracking-wider font-medium">Active Readers</div>
                  </div>
                  <div className="text-center border-l border-white/10">
                    <div className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mb-1 font-display">
                      4.9/5
                    </div>
                    <div className="text-sm text-slate-400 uppercase tracking-wider font-medium">User Rating</div>
                  </div>
                </div>
              </div>
            </ScaleIn>
          </FadeIn>
        </div>
      </section>

      {/* Trending Books - Auto Carousel - RIGHT AFTER GENRES */}
      {popularBooks.length > 0 && (
        <section className="py-12 sm:py-16 relative overflow-hidden">
          <div className="w-full max-w-[2000px] mx-auto px-2 sm:px-4 lg:px-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl sm:text-4xl font-display font-bold mb-2 gradient-text">🔥 Trending Now</h2>
                <p className="text-base sm:text-lg" style={{ color: 'var(--text-secondary)' }}>
                  Discover what the community is reading
                </p>
              </div>
              <a href="/explore" className="btn btn-ghost hidden sm:inline-flex">
                View All →
              </a>
            </div>

            {/* Netflix-Style Auto-Scrolling Carousel */}
            <div
              className="relative w-full max-w-[2000px] mx-auto group"
              onMouseEnter={() => setIsHoveringCarousel(true)}
              onMouseLeave={() => setIsHoveringCarousel(false)}
            >
              {/* Scroll Container */}
              <div
                id="trending-scroll"
                className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide pb-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {/* 2. Replace the custom card mapping in the "Trending" section with BookCard. */}
                {popularBooks.map((book: any) => (
                  <StaggerItem key={book.id} className="flex-shrink-0 w-64">
                    <BookCard book={book} />
                  </StaggerItem>
                ))}
              </div>

              {/* Navigation Arrows - Netflix Style */}
              <button
                onClick={() => {
                  const container = document.getElementById('trending-scroll');
                  if (container) container.scrollLeft -= 300;
                }}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-full bg-gradient-to-r from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-start pl-2 z-20"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <span className="text-white text-2xl">‹</span>
                </div>
              </button>
              <button
                onClick={() => {
                  const container = document.getElementById('trending-scroll');
                  if (container) container.scrollLeft += 300;
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-full bg-gradient-to-l from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end pr-2 z-20"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <span className="text-white text-2xl">›</span>
                </div>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Features - Glass Cards */}
      <section className="py-12 sm:py-16 relative">
        <div className="w-full max-w-[2000px] mx-auto px-2 sm:px-4 lg:px-6">
          <FadeIn className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-display font-bold mb-6">
              <span className="text-white">Crafted for the </span>
              <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">True Bibliophile</span>
            </h2>
            <p className="text-xl text-slate-400">
              Experience a reading platform designed with obsession to detail.
            </p>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" staggerDelay={0.1}>
            {[
              { icon: '🤖', title: 'AI-Powered Curation', desc: 'Our engine learns your taste profile to suggest books you\'ll actually love, not just bestsellers.' },
              { icon: '🌍', title: 'Universal Access', desc: 'Seamlessly sync your library across all devices. Start on desktop, finish on mobile.' },
              { icon: '💬', title: 'Vibrant Community', desc: 'Join book clubs, participate in live discussions, and share your literary journey.' },
              { icon: '📈', title: 'Reading Analytics', desc: 'Visualize your reading habits with beautiful charts. efficient tracking for the data-minded.' },
              { icon: '✍️', title: 'Thoughtful Reviews', desc: 'Write rich, formatted reviews and engage with critique from fellow intellectuals.' },
              { icon: '🎯', title: 'Precision Search', desc: 'Filter by mood, length, complexity, and more to find the perfect book for right now.' }
            ].map((feature, i) => (
              <SlideUp key={i} className="group relative p-8 rounded-3xl bg-slate-900/50 border border-white/5 hover:bg-slate-800/50 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 overflow-hidden" offset={50}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-3xl mb-6 shadow-md group-hover:scale-110 transition-transform duration-300 ring-1 ring-white/10 group-hover:ring-primary/50 group-hover:bg-primary/20">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-display font-bold mb-3 text-white group-hover:text-primary-light transition-colors">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed text-sm">{feature.desc}</p>
                </div>
              </SlideUp>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* All Books from Database - Moved above Social Features */}
      <section id="all-books-section" className="py-20 sm:py-28 relative">
        <div className="w-full max-w-[2000px] mx-auto px-2 sm:px-4 lg:px-6">
          {/* Back to Search Button - Shows when filtering or from search */}
          {(selectedGenres.length > 0 || searchOrigin) && (
            <div className="flex justify-center mb-6">
              <button
                onClick={handleBackToSearch}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/50 transition-all duration-300 hover:scale-105 font-medium group"
              >
                <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>{searchOrigin === 'genre' ? 'Back to Genres' : searchOrigin === 'book' ? 'Back to Search' : 'Back to Filters'}</span>
                {selectedGenres.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-600/30 text-xs">
                    {selectedGenres.length} filter{selectedGenres.length > 1 ? 's' : ''} active
                  </span>
                )}
              </button>
            </div>
          )}

          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-2 gradient-text">
              {selectedGenres.length > 0 ? 'Filtered Results' : 'All Available Books'}
            </h2>
            <p className="text-base sm:text-lg text-slate-400">
              Browse our complete collection of {filteredBooks.length} books
              {selectedGenres.length > 0 && ` (filtered by ${selectedGenres.length} genre${selectedGenres.length > 1 ? 's' : ''})`}
            </p>
          </div>

          {/* Books Grid - With increased spacing and smaller cards */}
          {filteredBooks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-slate-400 mb-4">No books available yet.</p>
              <p className="text-sm text-slate-500">
                {allBooks.length === 0
                  ? "Add books to your database to see them here."
                  : `No books match the selected ${selectedGenres.length} genre${selectedGenres.length > 1 ? 's' : ''}.`
                }
              </p>
            </div>
          ) : (
            // 3. Replace the custom card mapping in the "All Books" section with BookCard.
            <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-8 mb-8">
              {filteredBooks.slice(0, booksToShow).map((book: any) => (
                <StaggerItem key={book.id} className="h-full">
                  <BookCard book={book} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}

          {/* Load More Button */}
          {
            booksToShow < filteredBooks.length && (
              <div className="text-center">
                <button
                  onClick={() => setBooksToShow(prev => Math.min(prev + 10, filteredBooks.length))}
                  className="backdrop-blur-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-white px-8 py-3 rounded-full border border-indigo-500/50 hover:border-indigo-400 transition-all duration-300 hover:scale-105 font-medium"
                >
                  Load More Books ({filteredBooks.length - booksToShow} remaining)
                </button>
              </div>
            )
          }

          {/* Show All Loaded Message */}
          {
            booksToShow >= filteredBooks.length && filteredBooks.length > 10 && (
              <div className="text-center">
                <p className="text-slate-400">
                  All {filteredBooks.length} books displayed ✨
                </p>
              </div>
            )
          }
        </div >
      </section >

      {/* Social Community Showcase */}
      < SocialShowcase />

      {/* Student Features Section */}
      < StudentSection />

      {/* CTA */}
      < section className="py-20 sm:py-28 relative" >
        <div className="w-full max-w-[2000px] mx-auto px-2 sm:px-4 lg:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="glass-strong rounded-3xl p-10 sm:p-16 text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-6 gradient-text">
                Start Your Reading Journey Today
              </h2>
              <p className="text-lg sm:text-xl mb-8 text-slate-400">
                Join thousands of readers discovering amazing books every day
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/signup" className="btn-primary text-lg px-8 py-4">
                  Create Free Account
                </a>
                <a href="/explore" className="btn btn-ghost text-lg px-8 py-4">
                  Browse Library
                </a>
              </div>
            </div>
          </div>
        </div>
      </section >

      {/* Footer */}
      < footer className="border-t py-8 sm:py-12" style={{ borderColor: 'var(--border-1)' }
      }>
        <div className="w-full max-w-[2000px] mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📚</span>
              <span className="text-xl font-display font-bold gradient-text">TomeSphere</span>
            </div>
            <div style={{ color: 'var(--text-tertiary)' }} className="text-sm">
              © 2025 TomeSphere • Your world-class reading platform
            </div>
          </div>
        </div>
      </footer >
    </div >
  );
}







