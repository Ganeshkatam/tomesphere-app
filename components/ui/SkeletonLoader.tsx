import React from 'react';

interface SkeletonLoaderProps {
    variant?: 'card' | 'text' | 'circle' | 'rect';
    className?: string;
    count?: number;
}

export function SkeletonLoader({ variant = 'rect', className = '', count = 1 }: SkeletonLoaderProps) {
    const baseClasses = "animate-pulse bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%]";

    const variants = {
        card: 'rounded-2xl aspect-[2/3] w-full',
        text: 'h-4 rounded-lg w-full',
        circle: 'rounded-full aspect-square',
        rect: 'rounded-xl h-32 w-full'
    };

    const items = Array.from({ length: count }, (_, i) => (
        <div
            key={i}
            className={`${baseClasses} ${variants[variant]} ${className}`}
            style={{
                animation: `shimmer 2s ease-in-out infinite`,
                animationDelay: `${i * 0.1}s`
            }}
        />
    ));

    return count > 1 ? <>{items}</> : items[0];
}

export function BookCardSkeleton() {
    return (
        <div className="glass rounded-2xl overflow-hidden border border-white/5 p-4">
            <SkeletonLoader variant="card" className="mb-4" />
            <SkeletonLoader variant="text" className="mb-2" />
            <SkeletonLoader variant="text" className="w-3/4 mb-4" />
            <div className="flex items-center gap-2">
                <SkeletonLoader variant="circle" className="w-8 h-8" />
                <SkeletonLoader variant="text" className="flex-1 h-3" />
            </div>
        </div>
    );
}

export function BookGridSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: count }, (_, i) => (
                <BookCardSkeleton key={i} />
            ))}
        </div>
    );
}
