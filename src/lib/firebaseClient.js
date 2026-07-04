import { initializeApp, getApps, getApp } from 'firebase/app';

const firebaseConfig = {
    apiKey: "AIzaSyA7uklQ6_m0hu8n1rVYnPxkKyxIPVQOOyQ",
    authDomain: "manatheera-7cf2e.firebaseapp.com",
    projectId: "manatheera-7cf2e",
    storageBucket: "manatheera-7cf2e.firebasestorage.app",
    messagingSenderId: "559006087287",
    appId: "1:559006087287:web:bb043767b280f244302e72",
    measurementId: "G-5T58SN04GF"
};

// Initialize Firebase client app (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/**
 * Fetch the client FCM token from browser messaging
 */
export const getFcmToken = async () => {
    try {
        if (typeof window === 'undefined') return null;

        const { getMessaging, getToken } = await import('firebase/messaging');
        const messaging = getMessaging(app);

        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
            console.warn('FCM Warning: NEXT_PUBLIC_FIREBASE_VAPID_KEY is not configured in environment variables. Web push notifications request may fail.');
        }

        const token = await getToken(messaging, { vapidKey });
        return token;
    } catch (error) {
        console.error('Error getting FCM Token from client:', error);
        throw error;
    }
};

export default app;
