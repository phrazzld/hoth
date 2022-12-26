import * as admin from "firebase-admin";

// Verify the API key
// Find the client with the API key
export async function isValidApiKey(apiKey: string): Promise<boolean> {
  // Check if the API key exists in Cloud Firestore
  const firestore = admin.firestore();
  const client = await firestore.collection("clients").doc(apiKey).get();

  return client.exists;
}
