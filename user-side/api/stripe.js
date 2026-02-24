// 💳 STRIPE API SERVICE

// Replace this with your backend URL (Next.js restaurant-dashboard)
// For local development on Android Emulator, use 10.0.2.2 or your machine's IP
// For iOS, use your machine's IP
const BACKEND_URL = "http://172.20.10.4:3000";

export const fetchPaymentIntentClientSecret = async (amount, currency = 'eur') => {
    try {
        const response = await fetch(`${BACKEND_URL}/api/create-payment-intent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount,
                currency,
            }),
        });

        const { clientSecret, error } = await response.json();

        if (error) {
            throw new Error(error);
        }

        return clientSecret;
    } catch (err) {
        console.error('Error fetching PaymentIntent:', err);
        throw err;
    }
};
