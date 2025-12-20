import Stripe from 'stripe';

// Lazy initialization to avoid build-time errors when env vars are missing
let stripeInstance: Stripe | null = null;

export const getStripe = (): Stripe => {
    if (!stripeInstance) {
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error('STRIPE_SECRET_KEY is not set');
        }
        stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
            // @ts-expect-error - Using latest API version
            apiVersion: '2024-11-20.acacia',
            typescript: true,
        });
    }
    return stripeInstance;
};

// Export stripe object with getter to lazy-load
export const stripe = new Proxy({} as Stripe, {
    get(target, prop) {
        const instance = getStripe();
        return (instance as any)[prop];
    },
});

export const getStripeJs = async () => {
    const { loadStripe } = await import('@stripe/stripe-js');
    return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
};
