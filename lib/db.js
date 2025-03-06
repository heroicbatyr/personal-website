import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
}

let client;
let db;

export default async function connectToDb() {
    if (!client) {
        client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        db = client.db();  // Auto-selects the DB from the URI
    }
    return db.collection('submissions'); // Collection where form data will be stored
}
