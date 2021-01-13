import { Storage } from "@google-cloud/storage";
import { projectId, keyFilename } from "../creds.js";
import { v4 as uuid } from 'uuid';
const storage = new Storage({ projectId, keyFilename });
const location = "us-east4";

export async function createBucket(bucketName) {
    // const bucket = storage.bucket(bucketName);
    // bucket.create(async (err, bucket, apiResponse) => {
    //     if(!err){
    //         console.log(`Bucket ${bucketName} created!`);
    //     }
    //     console.log(apiResponse);
    //     return apiResponse;
    // });
    try {
        const [bucket] = await storage.createBucket(bucketName, {
            location,
            ['standard']: true
        });

        console.log(
            `${bucket.name} created with ${storageClass} class in ${location}.`
        );
    } catch (err) {
        console.error(err);
    }
}

// Check if the bucket already exists
export async function bucketExists(bucketName) {
    const bucket = storage.bucket(bucketName);
    const exists = await bucket.exists();
    return exists.length > 0 ? exists[0] : false;
}

// Appends uuid to make file names unique everytime.
export function generateName(fileName) {
    const splitted = fileName.split(".");
    if (splitted.length >= 2) {
        splitted[0] += uuid();
        return splitted.join('.');
    }
    return "";
}