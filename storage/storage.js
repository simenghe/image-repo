import { Storage } from "@google-cloud/storage";
import { projectId, keyFilename } from "../creds.js";
const storage = new Storage({ projectId, keyFilename });

export async function createBucket(bucketName) {
    const bucket = storage.bucket(bucketName);
    const exists = await bucket.exists();
    console.log(exists);
}

export async function bucketExists(bucketName) {
    const bucket = storage.bucket(bucketName);
    const exists = await bucket.exists();
    console.log(exists);
}