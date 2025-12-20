export class PerformanceOptimizer {
    enableImageLazyLoading(): void {
        if ('loading' in HTMLImageElement.prototype) {
            const images = document.querySelectorAll('img[data-src]');
            images.forEach(img => {
                (img as HTMLImageElement).src = img.getAttribute('data-src') || '';
            });
        } else {
            // Fallback for older browsers
            this.setupIntersectionObserver();
        }
    }

    private setupIntersectionObserver(): void {
        const images = document.querySelectorAll('img[data-src]');

        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target as HTMLImageElement;
                    img.src = img.getAttribute('data-src') || '';
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }

    prefetchNextPage(url: string): void {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
    }

    debounce<T extends (...args: any[]) => any>(
        func: T,
        wait: number
    ): (...args: Parameters<T>) => void {
        let timeout: any;

        return function executedFunction(...args: Parameters<T>) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };

            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle<T extends (...args: any[]) => any>(
        func: T,
        limit: number
    ): (...args: Parameters<T>) => void {
        let inThrottle: boolean;

        return function executedFunction(...args: Parameters<T>) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => (inThrottle = false), limit);
            }
        };
    }

    measurePerformance(name: string, fn: () => void): number {
        const start = performance.now();
        fn();
        const end = performance.now();
        const duration = end - start;

        console.log(`${name} took ${duration.toFixed(2)}ms`);
        return duration;
    }
}

export const performanceOptimizer = new PerformanceOptimizer();
