import { NextResponse } from 'next/server';
import { sendPushNotification } from '@/lib/notificationHelper';
import dbConnect from '@/lib/db';
import Lead from '@/lib/models/Lead';

/**
 * GET /api/cron/send-scheduled
 * Public endpoint to trigger due scheduled notifications check.
 * Suitable for Vercel Cron Jobs or external cron pingers.
 */
export async function GET(req) {
    try {
        await dbConnect();
        const now = new Date();

        const dueLeads = await Lead.find({
            isDeleted: { $ne: true },
            nextCallNotify: true,
            nextCallDate: { $exists: true, $lte: now }
        });

        const results = [];

        if (dueLeads.length > 0) {
            console.log(`⏱️ API Cron: found ${dueLeads.length} due scheduled follow-up(s)`);
            for (const lead of dueLeads) {
                const targetUserIds = [];
                if (lead.owner) targetUserIds.push(lead.owner.toString());
                if (lead.createdBy) targetUserIds.push(lead.createdBy.toString());

                const uniqueUserIds = [...new Set(targetUserIds)];
                let sent = false;

                if (uniqueUserIds.length > 0) {
                    const title = `Follow-up Due: ${lead.firstName} ${lead.lastName}`;
                    const body = lead.nextCallGoal || 'Scheduled follow-up is due.';
                    
                    console.log(`🔔 API Cron: sending push notification for lead: ${lead._id}`);
                    await sendPushNotification(uniqueUserIds, title, body, {
                        leadId: lead._id.toString(),
                        type: 'scheduled_followup'
                    });
                    sent = true;
                }

                // Turn off notification flag so it won't be sent again
                await Lead.updateOne({ _id: lead._id }, { $set: { nextCallNotify: false } });
                results.push({ leadId: lead._id, sent });
            }
        }

        return NextResponse.json({ status: 'success', processed: results.length, details: results });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

// Support POST as well for flexibility
export async function POST(req) {
    return GET(req);
}
