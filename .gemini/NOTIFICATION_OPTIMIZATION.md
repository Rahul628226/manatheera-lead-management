# Notification System Flow - Optimized

## 🎯 Problem Solved
**Before**: API was called every 60 seconds repeatedly → Inefficient, unnecessary load
**After**: API called ONCE on login/mount → localStorage becomes the source of truth

---

## 📊 New Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER LOGS IN / PAGE LOADS                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              NotificationManager Component Mounts               │
│                                                                 │
│  1. Check hasSyncedRef.current                                  │
│     ├─ If TRUE  → Skip sync (already done)                      │
│     └─ If FALSE → Proceed to sync                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│           🔄 ONE-TIME API CALL: /api/notifications/check        │
│                                                                 │
│  Fetches all upcoming follow-ups from database                  │
│  (Only leads with nextCallNotify = true & future dates)         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  📦 Store in localStorage                       │
│                                                                 │
│  Key: 'scheduledNotifications'                                  │
│  Value: [                                                       │
│    {                                                            │
│      id: "lead_id_123",                                         │
│      title: "Follow-up Due: John Doe",                          │
│      body: "Confirm villa availability",                        │
│      date: "2026-01-22T15:30:00.000Z",                          │
│      shown: false,                                              │
│      syncedAt: 1737537600000                                    │
│    },                                                           │
│    ...                                                          │
│  ]                                                              │
│                                                                 │
│  ✅ Set hasSyncedRef.current = true                             │
│  ✅ NO MORE API CALLS THIS SESSION                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│          ⏰ Local Checker (Every 5 seconds)                     │
│                                                                 │
│  setInterval(() => {                                            │
│    const now = Date.now();                                      │
│    const scheduled = localStorage.scheduledNotifications;       │
│                                                                 │
│    scheduled.forEach(notification => {                          │
│      if (notification.date <= now) {                            │
│        → Trigger notification                                   │
│        → Remove from localStorage                               │
│        → Add to history                                         │
│      }                                                          │
│    });                                                          │
│  }, 5000);                                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  🔔 When Notification is DUE                    │
│                                                                 │
│  1. Play sound (/sound/notification.wav)                        │
│  2. Show browser notification (if permission granted)           │
│  3. Show in-app popup (top-right corner)                        │
│  4. Remove from localStorage                                    │
│  5. Add ID to notificationHistory (prevent re-trigger)          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              📝 When User Creates/Edits Lead                    │
│                                                                 │
│  If nextCallNotify = true:                                      │
│    → Add/Update notification in localStorage                    │
│    → Dispatch 'storage' event                                   │
│    → NotificationManager picks it up immediately                │
│                                                                 │
│  If nextCallNotify = false:                                     │
│    → Remove notification from localStorage                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Changes

### 1. **One-Time Sync on Login**
```javascript
const hasSyncedRef = useRef(false);

const syncNotificationsOnce = async () => {
    if (hasSyncedRef.current) {
        console.log("✅ Already synced");
        return; // SKIP!
    }
    
    // Fetch from API
    await fetch('/api/notifications/check');
    
    hasSyncedRef.current = true; // Mark as done
};
```

### 2. **Removed Repeated Interval**
```javascript
// ❌ REMOVED (was causing repeated API calls)
// const syncInterval = setInterval(syncNotifications, 60000);

// ✅ KEPT (checks localStorage only)
const localInterval = setInterval(checkLocalSchedule, 5000);
```

### 3. **localStorage is Source of Truth**
- API populates localStorage once
- All checks happen against localStorage
- Create/Edit operations update localStorage directly
- No need for repeated API polling

---

## 📈 Performance Improvement

### Before:
- API calls: **1 on mount + 1 every 60s = ~60 calls/hour**
- Network traffic: High
- Server load: Unnecessary

### After:
- API calls: **1 on mount only = 1 call/session**
- Network traffic: Minimal
- Server load: 98% reduction ✅

---

## 🧪 Testing the Fix

1. **Open DevTools → Network Tab**
2. **Login to the app**
3. **You should see:**
   - ✅ ONE call to `/api/notifications/check` on page load
   - ✅ Console log: "🔄 Syncing notifications from database (one-time)..."
   - ✅ Console log: "✅ Sync complete: X new notifications loaded"
   - ❌ NO repeated calls every 60 seconds

4. **Check localStorage:**
   - Open DevTools → Application → Local Storage
   - You should see `scheduledNotifications` with your follow-ups

5. **Create/Edit a lead with notification:**
   - localStorage updates immediately
   - No API call needed
   - Notification will trigger at scheduled time

---

## 🎯 Summary

| Aspect | Before | After |
|--------|--------|-------|
| API Calls | Every 60s | Once on login |
| Source of Truth | Database (polled) | localStorage |
| Network Usage | High | Minimal |
| Real-time Updates | 60s delay | Immediate (via storage events) |
| Notification Trigger | localStorage check | localStorage check |
| Performance | ⚠️ Inefficient | ✅ Optimized |

The system now works exactly as you requested:
1. ✅ API called once on login
2. ✅ Data stored in localStorage
3. ✅ Notifications removed from localStorage when triggered
4. ✅ No repeated API polling
