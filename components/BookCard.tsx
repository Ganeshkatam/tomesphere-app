import { Book } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Heart, Star, Plus, BookOpen, Clock, Check } from 'lucide-react';
import { generateSimpleDescription } from '@/lib/pdf-description-generator';

interface BookCardProps {
    book: Book;
    onLike?: () => void;
    onRate?: (rating: number) => void;
    onAddToList?: (status: 'want_to_read' | 'currently_reading' | 'finished') => void;
    isLiked?: boolean;
    userRating?: number;
}

export default function BookCard({
    book,
    onLike,
    onRate,
    onAddToList,
    isLiked = false,
    userRating = 0,
}: BookCardProps) {
    const router = useRouter();
    const [imageLoaded, setImageLoaded] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    // Auto-generate description if missing
    const displayDescription = useMemo(() => {
        if (book.description && book.description.trim()) {
            return book.description;
        }
        // Generate description automatically
        return generateSimpleDescription(book.title, book.author);
    }, [book.description, book.title, book.author]);

    const handleCardClick = () => {
        router.push(`/books/${book.id}`);
    };

    return (
        <div
            className="group relative glass rounded-2xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all duration-500 cursor-pointer h-full flex flex-col"
            onClick={handleCardClick}
            style={{
                transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
                transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out'
            }}
            onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = (y - centerY) / 20;
                const rotateY = (centerX - x) / 20;
                e.currentTarget.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
            }}
        >
            {/* Cover Image with Loading State */}
            <div className="relative aspect-[2/3] overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900">
                {!imageLoaded && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 animate-pulse"
                        style={{ animation: 'shimmer 2s ease-in-out infinite' }}
                    />
                )}
                {book.cover_url ? (
                    <Image
                        src={book.cover_url}
                        alt={book.title}
                        fill
                        unoptimized // Bypass Next.js proxy to fix "private IP" error and allow direct loading
                        placeholder="blur"
                        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAFCAYAAABir53AAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAGklEQVR4nGP8////fwYGBgYGRkZGhjNnzgAAK8QD87779+AAAAAASUVORK5CYII=" // simple blur
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                        className={`object-cover transition-all duration-700 ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}
                        onLoad={() => setImageLoaded(true)}
                        onError={() => setImageLoaded(true)}
                    />
                ) : null}

                {/* Default Book Cover - Shows when no cover_url or image fails */}
                {(!book.cover_url || !imageLoaded) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900">
                        {/* Book Icon */}
                        <div className="mb-4 text-white/20">
                            <BookOpen size={64} strokeWidth={1.5} />
                        </div>
                        {/* Book Title on Cover */}
                        <div className="text-center space-y-2">
                            <h4 className="text-white/90 font-display font-bold text-sm leading-tight line-clamp-3">
                                {book.title}
                            </h4>
                            <p className="text-white/60 text-xs font-medium line-clamp-2">
                                {book.author}
                            </p>
                        </div>
                        {/* Decorative Elements */}
                        <div className="absolute top-4 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <p className="text-white text-sm line-clamp-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        {displayDescription}
                    </p>
                </div>

                {/* Featured Badge */}
                {book.is_featured && (
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                        <Star size={12} fill="currentColor" />
                        Featured
                    </div>
                )}
            </div>

            {/* Book Info */}
            <div className="p-3 flex-1 flex flex-col">
                <h3 className="text-sm font-bold text-white line-clamp-2 mb-0.5 group-hover:text-primary-light transition-colors leading-tight">
                    {book.title}
                </h3>
                <p className="text-xs text-slate-400 mb-2">by {book.author}</p>

                <div className="flex items-center gap-2 mb-auto">
                    <span className="px-2 py-0.5 bg-primary/20 text-primary-light rounded text-[10px] font-medium border border-primary/30">
                        {book.genre}
                    </span>
                    {book.release_date && (
                        <span className="text-[10px] text-slate-500">
                            {new Date(book.release_date).getFullYear()}
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/5 mt-2">
                    {/* Like Button */}
                    {onLike && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onLike();
                            }}
                            className={`p-2 rounded-lg transition-all transform hover:scale-110 ${isLiked
                                ? 'bg-red-500/20 text-red-400 shadow-lg shadow-red-500/25'
                                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-red-400'
                                }`}
                            title={isLiked ? 'Unlike' : 'Like'}
                        >
                            <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
                        </button>
                    )}

                    {/* Rating */}
                    {onRate && (
                        <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRate(star);
                                    }}
                                    className={`transition-all hover:scale-125 ${star <= userRating ? 'text-amber-400' : 'text-slate-600 hover:text-amber-400'
                                        }`}
                                    title={`Rate ${star} stars`}
                                >
                                    <Star size={14} fill={star <= userRating ? 'currentColor' : 'none'} />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Download Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (book.pdf_url) {
                                const link = document.createElement('a');
                                link.href = book.pdf_url;
                                link.download = `${book.title}.pdf`;
                                link.click();
                            }
                        }}
                        className="p-2 rounded-lg bg-white/5 text-slate-400 hover:bg-green-600/20 hover:text-green-400 transition-all transform hover:scale-110"
                        title="Download"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </button>

                    {/* Add to List */}
                    {onAddToList && (
                        <div className="ml-auto relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMenu(!showMenu);
                                }}
                                onBlur={() => setTimeout(() => setShowMenu(false), 200)}
                                className="p-2 rounded-lg bg-white/5 hover:bg-primary/20 hover:text-primary-light text-slate-400 transition-all transform hover:scale-110"
                                title="Add to reading list"
                            >
                                <Plus size={16} />
                            </button>
                            {showMenu && (
                                <div className="absolute right-0 bottom-full mb-2 w-48 bg-slate-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 overflow-hidden z-20 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAddToList('want_to_read');
                                            setShowMenu(false);
                                        }}
                                        className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-primary/20 hover:text-white transition-colors"
                                    >
                                        <BookOpen size={16} />
                                        <span>Want to Read</span>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAddToList('currently_reading');
                                            setShowMenu(false);
                                        }}
                                        className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-primary/20 hover:text-white transition-colors"
                                    >
                                        <Clock size={16} />
                                        <span>Currently Reading</span>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAddToList('finished');
                                            setShowMenu(false);
                                        }}
                                        className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-primary/20 hover:text-white transition-colors"
                                    >
                                        <Check size={16} />
                                        <span>Finished</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

