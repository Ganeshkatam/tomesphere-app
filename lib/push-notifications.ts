export interface PushSubscription {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

export async function requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
        console.log('Notifications not supported');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
}

export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Push notifications not supported');
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.ready;

        // Check if already subscribed
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            // Subscribe to push notifications
            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_KEY || '';
            const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedKey as unknown as BufferSource,
            });
        }

        if (!subscription) return null;

        const p256dhKey = subscription.getKey('p256dh');
        const authKey = subscription.getKey('auth');

        return {
            endpoint: subscription.endpoint,
            keys: {
                p256dh: p256dhKey ? arrayBufferToBase64(p256dhKey) : '',
                auth: authKey ? arrayBufferToBase64(authKey) : '',
            },
        };
    } catch (error) {
        console.error('Error subscribing to push:', error);
        return null;
    }
}

export async function sendLocalNotification(title: string, body: string, icon?: string) {
    if (Notification.permission === 'granted') {
        new Notification(title, {
            body,
            icon: icon || '/icon-192.png',
            badge: '/icon-192.png',
        });
    }
}

// Helper functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

// Service Worker registration
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered:', registration);
            return registration;
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            return null;
        }
    }
    return null;
}
