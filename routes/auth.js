import admin from 'firebase-admin';

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
});

export async function verifyToken(idToken) {
    return await admin.auth().verifyIdToken(idToken);
}