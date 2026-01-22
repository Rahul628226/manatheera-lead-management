# Follow-up Time & Notification Fixes Summary

## Issues Fixed

### 1. **Timezone Mismatch in Edit Form** ✅
**Problem**: When editing a lead, the follow-up time displayed in the form was different from the actual saved time (5.5 hour difference for IST timezone).

**Root Cause**: The edit form was using `.toISOString()` which converts dates to UTC, but the `datetime-local` input field expects local timezone format.

**Solution**: Updated `src/app/dashboard/leads/edit/[id]/page.js` to properly convert UTC dates from the database to local timezone format:
```javascript
// Before (WRONG - causes timezone shift)
formattedData.nextCallDate = new Date(formattedData.nextCallDate).toISOString().slice(0, 16);

// After (CORRECT - preserves local time)
const date = new Date(formattedData.nextCallDate);
const offset = date.getTimezoneOffset() * 60000;
const localDate = new Date(date.getTime() - offset);
formattedData.nextCallDate = localDate.toISOString().slice(0, 16);
```

### 2. **Missing Notification Toggle in Edit Form** ✅
**Problem**: The edit form didn't have the notification bell button, so users couldn't enable/disable notifications when updating a lead.

**Solution**: Added the notification toggle button to the edit form, matching the create form design.

### 3. **Missing Follow-up Goal Field** ✅
**Problem**: Both create and edit forms were missing the "Next Follow-up Goal" textarea field.

**Solution**: Added `nextCallGoal` field to both forms:
- Create form: `src/app/dashboard/leads/create/page.js`
- Edit form: `src/app/dashboard/leads/edit/[id]/page.js`

### 4. **Notification Sync on Edit** ✅
**Problem**: When editing a lead's follow-up details, the notification wasn't being updated in localStorage.

**Solution**: Added notification sync logic to the edit form's save handler:
- Creates/updates notification in localStorage when `nextCallNotify` is enabled
- Removes notification when disabled or date is cleared
- Dispatches storage event to trigger NotificationManager refresh

### 5. **Follow-up Display on Detail Page** ✅
**Problem**: No visual confirmation that a follow-up was scheduled when viewing lead details.

**Solution**: Added a "Scheduled Follow-up" card on the lead detail page that shows:
- Follow-up date and time
- Follow-up goal
- Notification status (if enabled)

## How Notifications Work Now

### Creation Flow:
1. User creates a lead with follow-up date/time and enables notification
2. Data is saved to database
3. Notification is added to localStorage
4. NotificationManager picks it up and schedules the alert

### Edit Flow:
1. User edits a lead's follow-up details
2. Form loads with correct local timezone (no shift)
3. User can toggle notification on/off
4. On save:
   - Database is updated
   - localStorage notification is created/updated/removed accordingly
   - NotificationManager is notified via storage event

### Notification Trigger:
1. NotificationManager checks every 5 seconds
2. When follow-up time is reached:
   - Browser notification appears (if permission granted)
   - Sound plays (`/sound/notification.wav`)
   - In-app popup shows in top-right corner
   - Notification is removed from localStorage and added to history

## Files Modified

1. `src/app/dashboard/leads/edit/[id]/page.js`
   - Fixed timezone conversion for all date fields
   - Added notification toggle button
   - Added nextCallGoal field
   - Added notification sync on save

2. `src/app/dashboard/leads/create/page.js`
   - Added nextCallGoal field

3. `src/app/dashboard/leads/[id]/page.js`
   - Fixed date handling to avoid default times
   - Added "Scheduled Follow-up" display card

4. `src/lib/models/Lead.js`
   - Already had `nextCallNotify` and `nextCallGoal` fields (no changes needed)

## Testing Checklist

- [x] Create lead with follow-up notification → Notification appears at scheduled time
- [x] Edit lead follow-up time → Time displays correctly in form (no timezone shift)
- [x] Edit lead and toggle notification on → Notification is scheduled
- [x] Edit lead and toggle notification off → Notification is removed
- [x] View lead details → Follow-up card shows correct information
- [x] Notification sound plays when triggered
- [x] Browser notification appears (if permission granted)
- [x] In-app popup appears and can be dismissed

## Notes

- All times are stored in UTC in the database (standard practice)
- All times are displayed in user's local timezone in the UI
- Notifications use localStorage for client-side scheduling
- NotificationManager syncs with database every 60 seconds
- Notifications are checked every 5 seconds for accuracy
