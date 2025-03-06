import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
    throw new Error('MONGODB_URI is not defined');
}

let client;
let db;

export default async function connectToDb() {
    if (!client) {
        client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        db = client.db(); // Selects the DB from the connection URI
    }
    return db.collection('submissions'); // Change 'submissions' to your collection name if needed
}
