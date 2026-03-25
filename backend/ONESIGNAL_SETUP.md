# OneSignal Push Notification Setup Guide

> **Copy-paste-ready instructions** for integrating OneSignal into the CipherLearn React Native (Metro) mobile app.

---

## Prerequisites

| Item | Where to get it |
|------|-----------------|
| OneSignal Account | [onesignal.com](https://onesignal.com) (Free plan — unlimited push) |
| Firebase Project | [console.firebase.google.com](https://console.firebase.google.com) |
| Backend `.env` values | From OneSignal dashboard after setup |

---

## Step 1: Create OneSignal App

1. Go to [OneSignal Dashboard](https://onesignal.com)
2. Sign up or login
3. Click **"New App/Website"**
4. Enter app name: `CipherLearn`
5. Select platform: **Google Android (FCM)**
6. It will ask for your Firebase Server Key (Step 2 below)

---

## Step 2: Setup Firebase (one-time)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add Project"** → name it `CipherLearn`
3. Once created, click **"Add App" → Android**
4. Enter your package name (must match your React Native app's `android/app/build.gradle`):
   ```
   com.cipherlearn.app
   ```
5. Download `google-services.json`
6. Place it at:
   ```
   android/app/google-services.json
   ```
7. In Firebase Console → **Project Settings → Cloud Messaging**:
   - If using **FCM v1** (recommended): Download the service account JSON key
   - If using **legacy**: Copy the **Server Key**
8. Paste the Firebase credentials into OneSignal dashboard when prompted

---

## Step 3: Install OneSignal in React Native

```bash
npm install react-native-onesignal
```

For iOS (if applicable):
```bash
cd ios && pod install && cd ..
```

### Android Configuration

In `android/app/build.gradle`, ensure:
```gradle
apply plugin: 'com.google.gms.google-services'
```

In `android/build.gradle`, add:
```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

---

## Step 4: Initialize OneSignal (CRITICAL)

In your root file (`App.tsx` or `index.js`), add this **before** any other component code:

```tsx
import { OneSignal } from 'react-native-onesignal';

// ─── Initialize OneSignal ─────────────────────────────────────
// Replace with your actual OneSignal App ID from the dashboard
const ONESIGNAL_APP_ID = "YOUR_ONESIGNAL_APP_ID_HERE";

OneSignal.initialize(ONESIGNAL_APP_ID);

// Request notification permissions (iOS needs this, Android auto-grants)
OneSignal.Notifications.requestPermission(true);

// Debug logging (remove in production)
OneSignal.Debug.setLogLevel(6); // VERBOSE
```

---

## Step 5: Set External User ID (MOST IMPORTANT)

After successful login, call this to link the app user to your backend user ID:

```tsx
// ─── After Login ─────────────────────────────────────────────
// This is how the backend targets specific users for notifications
import { OneSignal } from 'react-native-onesignal';

const onLoginSuccess = (user: { id: number }) => {
  // Set external user ID = your database user.id
  OneSignal.login(String(user.id));
  console.log('[OneSignal] External user ID set:', user.id);
};
```

On logout, remove the association:

```tsx
// ─── On Logout ───────────────────────────────────────────────
const onLogout = () => {
  OneSignal.logout();
  console.log('[OneSignal] User logged out, external ID removed');
};
```

---

## Step 6: Handle Notification Events (Optional but Recommended)

```tsx
import { OneSignal } from 'react-native-onesignal';

// ─── Notification received while app is in foreground ─────────
OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
  console.log('[OneSignal] Foreground notification:', event.notification);
  // You can prevent it from showing:
  // event.preventDefault();
  // Or let it display (default behavior):
  event.getNotification().display();
});

// ─── Notification clicked (user tapped on it) ────────────────
OneSignal.Notifications.addEventListener('click', (event) => {
  console.log('[OneSignal] Notification clicked:', event.notification);
  const data = event.notification.additionalData;
  
  // Navigate based on notification data
  if (data?.screen) {
    // navigation.navigate(data.screen, data.params);
  }
});
```

---

## Step 7: Backend Environment Variables

Add these to your backend `.env` file:

```env
# ─── OneSignal Push Notifications ──────────────────────────────
ONESIGNAL_APP_ID=your-onesignal-app-id-here
ONESIGNAL_REST_API_KEY=your-onesignal-rest-api-key-here
```

**Where to find these:**
- **App ID**: OneSignal Dashboard → Settings → Keys & IDs → OneSignal App ID
- **REST API Key**: OneSignal Dashboard → Settings → Keys & IDs → REST API Key

Then restart the backend server.

---

## Step 8: Test Notifications

### Method 1: OneSignal Dashboard (no backend needed)
1. Go to OneSignal Dashboard → **Messages → Push**
2. Click **"New Push"**
3. Write a title and message
4. Audience: **Send to Subscribed Users** (or filter by external user ID)
5. Click **Send**
6. You should receive the notification on your device 📲

### Method 2: Maintenance Mode API (backend test)
```bash
# Send to a specific user (by their DB user ID)
curl -X POST http://localhost:5001/api/dashboard/maintenance/test-notification \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "userId": 1,
    "title": "🔔 Test Notification",
    "body": "If you see this, OneSignal is working!",
    "data": { "screen": "Dashboard" }
  }'

# Send to ALL subscribed users
curl -X POST http://localhost:5001/api/dashboard/maintenance/test-notification \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "sendToAll": true,
    "title": "📢 Class Update",
    "body": "This is a broadcast test notification"
  }'
```

The API returns full debug info including OneSignal's response, recipient count, and any errors.

---

## Step 9: Full Integration Prompt for React Native IDE

Copy-paste this prompt into your Antigravity IDE when working on the React Native codebase:

```
I need to integrate OneSignal push notifications into this React Native app.

Here's what needs to happen:

1. Install: `npm install react-native-onesignal`

2. In the root App.tsx (or wherever the app initializes), add BEFORE any components:
   ```
   import { OneSignal } from 'react-native-onesignal';
   OneSignal.initialize("PASTE_YOUR_ONESIGNAL_APP_ID");
   OneSignal.Notifications.requestPermission(true);
   ```

3. After successful login (wherever the login success handler is), add:
   ```
   OneSignal.login(String(user.id));
   ```
   where `user.id` is the numeric user ID from the backend.

4. On logout, add:
   ```
   OneSignal.logout();
   ```

5. Add notification event listeners in App.tsx:
   - foregroundWillDisplay → display the notification
   - click → navigate to relevant screen based on `event.notification.additionalData`

6. For Android: ensure `google-services.json` is at `android/app/google-services.json`
   and `apply plugin: 'com.google.gms.google-services'` is in `android/app/build.gradle`

7. The backend already sends notifications via OneSignal using the user's DB ID as 
   the external user ID. No additional API calls needed from the app side.

Please implement all of this, keeping existing code intact. Add proper TypeScript types 
and error handling. Log all OneSignal events for debugging.
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| No notification received | Check `OneSignal.Debug.setLogLevel(6)` logs in Metro console |
| "Invalid external_user_id" | Ensure `OneSignal.login(String(userId))` is called AFTER login |
| Android build fails | Verify `google-services.json` exists and gradle plugins are applied |
| iOS not working | Run `cd ios && pod install`, check provisioning profile has Push capability |
| "Missing ONESIGNAL_APP_ID" | Check backend `.env` has both `ONESIGNAL_APP_ID` and `ONESIGNAL_REST_API_KEY` |
| Notification sent but not received | User might not have granted permission. Check `OneSignal.Notifications.requestPermission(true)` |
| `sendToUser` not working | The app user must have called `OneSignal.login(userId)` at least once |
| Backend 400 error | OneSignal env vars not set. Hit `POST /maintenance/test-notification` for debug info |

---

## Architecture

```
┌─────────────────────────┐
│   React Native App      │
│   ┌───────────────────┐ │
│   │ OneSignal SDK      │ │
│   │ .initialize(appId) │ │
│   │ .login(userId)     │ │
│   └────────┬──────────┘ │
│            │             │
└────────────┼─────────────┘
             │ (registers device automatically)
             ▼
┌─────────────────────────┐
│   OneSignal Server      │
│   (manages devices,     │
│    delivery, analytics)  │
└────────────┬────────────┘
             ▲
             │ REST API call
             │ (include_external_user_ids)
┌────────────┴────────────┐
│   Node.js Backend       │
│   pushNotifications.ts  │
│   ┌───────────────────┐ │
│   │ sendToUser(id)    │ │
│   │ sendToBatch(...)  │ │
│   │ sendToAll(...)    │ │
│   └───────────────────┘ │
└─────────────────────────┘
```

**Key insight:** The backend never touches device tokens directly. It sends the user's DB ID to OneSignal, and OneSignal routes it to the right device(s). The React Native SDK handles all device registration automatically.
