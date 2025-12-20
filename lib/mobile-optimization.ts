export class MobileOptimization {
    private touchStartX: number = 0;
    private touchStartY: number = 0;

    detectSwipe(
        element: HTMLElement,
        onSwipeLeft: () => void,
        onSwipeRight: () => void,
        onSwipeUp: () => void,
        onSwipeDown: () => void
    ): () => void {
        const handleTouchStart = (e: TouchEvent) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        };

        const handleTouchEnd = (e: TouchEvent) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const deltaX = touchEndX - this.touchStartX;
            const deltaY = touchEndY - this.touchStartY;

            const minSwipeDistance = 50;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (Math.abs(deltaX) > minSwipeDistance) {
                    if (deltaX > 0) {
                        onSwipeRight();
                    } else {
                        onSwipeLeft();
                    }
                }
            } else {
                // Vertical swipe
                if (Math.abs(deltaY) > minSwipeDistance) {
                    if (deltaY > 0) {
                        onSwipeDown();
                    } else {
                        onSwipeUp();
                    }
                }
            }
        };

        element.addEventListener('touchstart', handleTouchStart);
        element.addEventListener('touchend', handleTouchEnd);

        return () => {
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchend', handleTouchEnd);
        };
    }

    enablePullToRefresh(onRefresh: () => Promise<void>): () => void {
        let startY = 0;
        let currentY = 0;
        let isPulling = false;

        const handleTouchStart = (e: TouchEvent) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
                isPulling = true;
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isPulling) return;

            currentY = e.touches[0].clientY;
            const pullDistance = currentY - startY;

            if (pullDistance > 80) {
                // Show pull indicator
            }
        };

        const handleTouchEnd = async () => {
            if (!isPulling) return;

            const pullDistance = currentY - startY;
            if (pullDistance > 80) {
                await onRefresh();
            }

            isPulling = false;
        };

        document.addEventListener('touchstart', handleTouchStart);
        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('touchend', handleTouchEnd);

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }

    optimizeImages(): void {
        const images = document.querySelectorAll('img');

        images.forEach(img => {
            // Lazy loading
            img.loading = 'lazy';

            // Use srcset for responsive images
            if (!img.srcset && img.src) {
                const sizes = [320, 640, 960, 1280];
                const srcset = sizes.map(size =>
                    `${img.src}?w=${size} ${size}w`
                ).join(', ');
                img.srcset = srcset;
            }
        });
    }

    enableHapticFeedback(): void {
        if ('vibrate' in navigator) {
            document.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                if (target.tagName === 'BUTTON' || target.getAttribute('role') === 'button') {
                    navigator.vibrate(10);
                }
            });
        }
    }

    detectDeviceCapabilities(): {
        isTouch: boolean;
        isMobile: boolean;
        supportsVibration: boolean;
        supportsNotifications: boolean;
        supportsServiceWorker: boolean;
    } {
        return {
            isTouch: 'ontouchstart' in window,
            isMobile: /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
            supportsVibration: 'vibrate' in navigator,
            supportsNotifications: 'Notification' in window,
            supportsServiceWorker: 'serviceWorker' in navigator,
        };
    }
}

export const mobileOptimization = new MobileOptimization();
