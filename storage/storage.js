import { Storage } from "@google-cloud/storage";
import { projectId, keyFilename } from "../creds.js";
const storage = new Storage({ projectId, keyFilename });

export async function createBucket(bucketName) {
    const bucket = storage.bucket(bucketName);
    bucket.create(async (err, bucket, apiResponse) => {
        if(!err){
            console.log(`Bucket ${bucketName} created!`);
        }
        console.log(apiResponse);
        return apiResponse;
    });
}

// Check if the bucket already exists
export async function bucketExists(bucketName) {
    const bucket = storage.bucket(bucketName);
    const exists = await bucket.exists();
    return exists.length > 0 ? exists[0] : false;
}