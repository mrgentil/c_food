/**
 * 💳 SHWARY PAYMENT API SERVICE
 * Documentation: https://api.shwary.com/
 */

const MERCHANT_ID = "15529a2b-3acc-4653-8424-8b54893c7c82";
const MERCHANT_KEY = "shwary_ca530809-3568-4db1-9265-66a4470dea78";

// Base URLs
const BASE_URL_PROD = "https://api.shwary.com/api/v1/merchants/payment";
const BASE_URL_SANDBOX = "https://api.shwary.com/api/v1/merchants/payment/sandbox";

// ⚠️ FORCE SANDBOX FOR DEV (Change to false for production)
const IS_SANDBOX = false;

// Helpers
const Base64 = {
    btoa: (input) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        let str = input;
        let output = '';

        for (let block = 0, charCode, i = 0, map = chars;
            str.charAt(i | 0) || (map = '=', i % 1);
            output += map.charAt(63 & block >> 8 - i % 1 * 8)) {
            charCode = str.charCodeAt(i += 3 / 4);
            if (charCode > 0xFF) {
                throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
            }
            block = block << 8 | charCode;
        }
        return output;
    }
};

// URLs for Transaction Status
const STATUS_URL_PROD = "https://api.shwary.com/api/v1/merchants/transactions";
// Sandbox doesn't really have a status endpoint widely needed as it's instant, but usually it mirrors prod structure
const STATUS_URL_SANDBOX = "https://api.shwary.com/api/v1/merchants/transactions"; // Doc says /merchants/transactions/{id} checks both?

/**
 * Check the status of a transaction
 * @param {string} transactionId 
 */
export const checkPaymentStatus = async (transactionId) => {
    // Note: Documentation says GET /merchants/transactions/{id}
    // It seems the base URL is the same for sandbox/prod for checking status? 
    // Usually sandbox transactions are in a different DB or namespace.
    // Assuming the doc "GET /merchants/transactions/{id}" works for both or we use the base url.

    // Let's use the PROD endpoint structure as identified in docs, usually it can find sandbox tx too if they share the system
    // Or we might need to verify if there is a specific sandbox status endpoint.
    // Doc: "GET /merchants/transactions/{id}"

    const url = `https://api.shwary.com/api/v1/merchants/transactions/${transactionId}`;

    console.log(`🔍 Checking status for ${transactionId}...`);

    try {
        // Reverting to PURE x-merchant headers as per documentation.
        // Removing Authorization header which likely caused "Invalid token" error because the server tried to parse it.
        // Ensuring no Content-Type is sent for GET.

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "x-merchant-id": MERCHANT_ID,
                "x-merchant-key": MERCHANT_KEY,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("❌ Check Status Failed:", data);
            throw new Error(data.message || "Impossible de vérifier le statut");
        }

        console.log(`🔍 Status for ${transactionId}: ${data.status}`);
        return data; // Returns { status: 'pending' | 'completed' | 'failed', ... }
    } catch (error) {
        console.error("❌ Status Request Error:", error);
        throw error;
    }
};

/**
 * Initiate a payment request
 * @param {string} phoneNumber - User phone number (e.g. +243...)
 * @param {number} amount - Amount to charge
 * @param {string} countryCode - 'DRC', 'KE', 'UG'
 */
export const initiatePayment = async (phoneNumber, amount, countryCode = 'DRC') => {
    const url = IS_SANDBOX
        ? `${BASE_URL_SANDBOX}/${countryCode}`
        : `${BASE_URL_PROD}/${countryCode}`;

    console.log(`🚀 Initiating Shwary Payment (${IS_SANDBOX ? 'SANDBOX' : 'LIVE'})...`);
    console.log(`📞 Phone: ${phoneNumber}, 💰 Amount: ${amount} ${countryCode === 'DRC' ? 'CDF' : ''}`);

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-merchant-id": MERCHANT_ID,
                "x-merchant-key": MERCHANT_KEY,
            },
            body: JSON.stringify({
                amount: Math.max(100, Math.round(amount)), // Ensure min amount and integer
                clientPhoneNumber: phoneNumber,
                // callbackUrl: "https://your-callback-url.com" // Optional
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("❌ Shwary Error:", data);
            throw new Error(data.message || "Échec du paiement");
        }

        console.log("✅ Shwary Success:", data);
        return data;
    } catch (error) {
        console.error("❌ Payment Request Failed:", error);
        throw error;
    }
};
