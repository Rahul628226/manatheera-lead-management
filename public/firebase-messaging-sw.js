// Scripts for firebase-app and firebase-messaging
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
firebase.initializeApp({
    apiKey: "AIzaSyA7uklQ6_m0hu8n1rVYnPxkKyxIPVQOOyQ",
    authDomain: "manatheera-7cf2e.firebaseapp.com",
    projectId: "manatheera-7cf2e",
    storageBucket: "manatheera-7cf2e.firebasestorage.app",
    messagingSenderId: "559006087287",
    appId: "1:559006087287:web:bb043767b280f244302e72"
});

// Retrieve an instance of Firebase Cloud Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message: ', payload);
    
    const notificationTitle = payload.notification?.title || 'Manatheera Update';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a new message.',
        icon: '/favicon.jpg',
        badge: '/favicon.jpg',
        data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
