import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
    throw new Error('MONGODB_URI is not defined');
}

let cachedClient = null;
let cachedDb = null;

export default async function connectToDb() {
    if (cachedClient && cachedDb) {
        return cachedDb.collection('submissions');
    }

    cachedClient = new MongoClient(uri);
    await cachedClient.connect();
    cachedDb = cachedClient.db();
    return cachedDb.collection('submissions');
}