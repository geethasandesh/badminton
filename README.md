# 🏸 Baddie Score - Real-Time Badminton PWA

A high-fidelity, professional Progressive Web App designed for live badminton scoring tournaments. Synchronized in real-time via **Firebase Firestore**, featuring distinct flows for Umpires (controllers) and Audience (viewers).

---

## 🧭 Official Flow Plan

The application follows a role-based logic that is automatically determined by who starts a match.

### 1. The Umpire Journey (Match Controller)
1.  **Dashboard**: Click the **"Start New Match"** button.
2.  **Setup**: Select Singles/Doubles and **Search** for players from the Official Registry.
3.  **Initiation**: Click **"Start Match"**. This creates a record in Firestore where you are assigned as the `umpireId`. 
    - **Self-Play**: If you are playing in the match while umpiring, you can tap the **"Me"** button in any player slot to quickly add your own profile so your personal stats are updated in history.4.  **Control**: You land on the **Live Scoreboard**. 
    - **Lock-In**: You cannot use the bottom navigation until the match is finished.
    - **Active Sync**: Every point you click is instantly pushed to the cloud.
5.  **Completion**: Use the **"Options"** menu to "End" or "Finish" the match. 
6.  **Outcome**: Land on the **Result Screen** with a permanent, shareable cloud link.

### 2. The Viewer Journey (Audience)
1.  **Discovery**: Open the Dashboard. All active matches created by any umpire will appear in the **"Live Now"** feed.
2.  **Watching**: Click any match card you don't own.
3.  **Scoreboard**: You land on the **Public Viewer Board**. 
    - **Read-Only**: You see the scores and court positions update instantly as the umpire clicks.
    - **Immersive**: Graphics update for serve-side and team positions in real-time.

---

## 🛡️ Database Security Setup

To protect your matches from being changed by anyone other than the Umpire, please follow these steps:

1.  Open the [Firebase Console](https://console.firebase.google.com/).
2.  Go to **Firestore Database** -> **Rules** tab.
3.  Copy and paste the following rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null && request.auth.uid == userId;
    }
    match /matches/{matchId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.umpireId;
    }
    match /matches/{matchId}/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == get(/databases/$(database)/documents/matches/$(matchId)).data.umpireId;
    }
    match /tournaments/{tournamentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.ownerId == request.auth.uid;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.ownerId;
    }
  }
}
```

4.  Click **Publish**.

**Tournaments:** The block above includes `tournaments` so signed-in users can list/read all tournaments, create only when `ownerId` is their UID, and edit/delete only their own. No composite index is required for the current app (listener uses `onSnapshot` on the collection without `orderBy`).

---

## 🧪 Testing with Seeding

I have provided a **"COMPREHENSIVE SEED"** button at the bottom of the Dashboard. 
- **Action**: Click it once to populate your Firestore with **8 professional players**, **2 finished matches**, and **1 active live match**.
- **Result**: Verify the "History" and "Registry" tabs to see the successfully synced cloud data.

---

## 🛠️ Components & Tech Stack
- **Role-Based Routing**: Auto-detection of Umpire vs Viewer roles.
- **Atomic State**: Powered by Zustand with shared Firestore listeners.
- **Glassmorphic UI**: High-gloss dark theme with lime-green accents.
- **PWA Ready**: Installable on iOS and Android for field use.

```bash
# Production Build
npm run build
```
