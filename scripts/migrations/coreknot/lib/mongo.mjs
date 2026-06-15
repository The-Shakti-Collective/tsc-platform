import { MongoClient } from 'mongodb';
import { getMongoConfig } from './env.mjs';

/** @type {MongoClient | null} */
let client = null;

export async function connectMongo() {
  if (client) return client;
  const { uri } = getMongoConfig();
  client = new MongoClient(uri);
  await client.connect();
  return client;
}

export async function getMongoDb() {
  const mongo = await connectMongo();
  const { dbName } = getMongoConfig();
  return mongo.db(dbName);
}

export async function closeMongo() {
  if (client) {
    await client.close();
    client = null;
  }
}

export function oid(doc) {
  if (!doc?._id) return null;
  return String(doc._id);
}

export async function fetchAll(collection, query = {}, options = {}) {
  const db = await getMongoDb();
  const cursor = db.collection(collection).find(query, options);
  return cursor.toArray();
}

export async function fetchBatched(collection, query = {}, batchSize = 100) {
  const db = await getMongoDb();
  const cursor = db.collection(collection).find(query).batchSize(batchSize);
  const batches = [];
  let batch = [];
  for await (const doc of cursor) {
    batch.push(doc);
    if (batch.length >= batchSize) {
      batches.push(batch);
      batch = [];
    }
  }
  if (batch.length > 0) batches.push(batch);
  return batches;
}
