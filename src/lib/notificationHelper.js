import { getMessaging } from './firebaseAdmin';
import User from './models/User';
import dbConnect from './db';

/**
 * Send push notifications to specific users using multicast delivery
 * @param {Array<string>} userIds - Array of User IDs to receive notifications
 * @param {string} title - Notification title
 * @param {string} body - Notification body text
 * @param {Object} [data] - Optional metadata payload (fields must be strings)
 */
export async function sendPushNotification(userIds, title, body, data = {}) {
    try {
        await dbConnect();
        
        // Retrieve all targeted user documents and map out their FCM tokens
        const users = await User.find({ _id: { $in: userIds } }, 'fcmTokens');
        const tokens = users.flatMap(u => u.fcmTokens || []);

        if (tokens.length === 0) {
            console.log('No FCM tokens registered for the targeted user(s)');
            return { success: true, sentCount: 0, failedCount: 0 };
        }

        // Standardize data payload values to string format as required by Firebase Cloud Messaging
        const cleanData = {};
        for (const [key, value] of Object.entries(data)) {
            cleanData[key] = String(value);
        }

        const message = {
            notification: {
                title,
                body
            },
            data: cleanData,
            tokens
        };

        // Send multicast messages to all registered devices
        const response = await getMessaging().sendEachForMulticast(message);
        console.log(`Multicast summary: successfully sent ${response.successCount} notifications; ${response.failureCount} failed.`);

        // Clean up invalid or unregistered tokens dynamically to keep database optimized
        if (response.failureCount > 0) {
            const tokensToRemove = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const errorCode = resp.error?.code;
                    if (
                        errorCode === 'messaging/invalid-registration-token' ||
                        errorCode === 'messaging/registration-token-not-registered'
                    ) {
                        tokensToRemove.push(tokens[idx]);
                    }
                }
            });

            if (tokensToRemove.length > 0) {
                console.log(`Cleaning up ${tokensToRemove.length} obsolete FCM tokens from User profiles`);
                await User.updateMany(
                    { fcmTokens: { $in: tokensToRemove } },
                    { $pull: { fcmTokens: { $in: tokensToRemove } } }
                );
            }
        }

        return {
            success: true,
            sentCount: response.successCount,
            failedCount: response.failureCount
        };
    } catch (error) {
        console.error('Error executing sendPushNotification:', error);
        return { success: false, error: error.message };
    }
}
