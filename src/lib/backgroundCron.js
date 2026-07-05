import { sendPushNotification } from './notificationHelper';
import Lead from './models/Lead';

let intervalId = null;

export function startBackgroundCron() {
    if (intervalId) {
        return;
    }

    console.log("⏱️ Starting server-side background notification checker...");

    // Check every 30 seconds for due follow-up alarms
    intervalId = setInterval(async () => {
        try {
            const now = new Date();
            
            // Find all leads where:
            // 1. nextCallNotify is true
            // 2. nextCallDate is in the past or now
            const dueLeads = await Lead.find({
                isDeleted: { $ne: true },
                nextCallNotify: true,
                nextCallDate: { $exists: true, $lte: now }
            });

            if (dueLeads.length > 0) {
                console.log(`⏱️ Background checker: found ${dueLeads.length} due scheduled follow-up(s)`);
                for (const lead of dueLeads) {
                    const targetUserIds = [];
                    if (lead.owner) targetUserIds.push(lead.owner.toString());
                    if (lead.createdBy) targetUserIds.push(lead.createdBy.toString());

                    const uniqueUserIds = [...new Set(targetUserIds)];
                    if (uniqueUserIds.length > 0) {
                        const title = `Follow-up Due: ${lead.firstName} ${lead.lastName}`;
                        const body = lead.nextCallGoal || 'Scheduled follow-up is due.';
                        
                        console.log(`🔔 Sending background push notification for lead: ${lead._id}`);
                        await sendPushNotification(uniqueUserIds, title, body, {
                            leadId: lead._id.toString(),
                            type: 'scheduled_followup'
                        });
                    }

                    // Turn off notification flag so it won't be sent again
                    await Lead.updateOne({ _id: lead._id }, { $set: { nextCallNotify: false } });
                }
            }
        } catch (error) {
            console.error("❌ Background notification checker error:", error.message);
        }
    }, 30000); // 30 seconds
}
