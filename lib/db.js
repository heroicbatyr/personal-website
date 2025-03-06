import { MongoClient } from 'mongodb';

// Use the connection string from environment variables
const uri = process.env.MONGODB_URI;
let client;
let db;

// Function to connect to MongoDB
export default async function connectToDb() {
    if (!client) {
        client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        db = client.db('formData');  // Change 'formData' to your actual database name
    }
    return db.collection('submissions'); // Collection where form data will be stored
}
