// database/db.js
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
    throw new Error('MONGODB_URI is not defined');
}

let cachedClient = null;
let cachedDb = null;

export default async function connectToDb(collectionName = 'submissions') {
    if (cachedClient && cachedDb) {
        return cachedDb.collection(collectionName);
    }

    cachedClient = new MongoClient(uri, { connectTimeoutMS: 5000, serverSelectionTimeoutMS: 5000 });
    await cachedClient.connect();
    cachedDb = cachedClient.db('test'); // Explicitly specify the 'test' database
    return cachedDb.collection(collectionName);
}