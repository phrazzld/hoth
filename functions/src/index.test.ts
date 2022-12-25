// Import dependencies
import * as admin from "firebase-admin";
import { isValidApiKey } from "./index";

const TEST_API_KEY = "test-api-key";

// Before running tests, make sure to create a client in Firestore with a valid API key
beforeAll(async () => {
  const firestore = admin.firestore();

  const testClient = {
    apiKey: TEST_API_KEY,
    name: "Test Client",
  };

  // Only add the testClient if it doesn't already exist
  const clientRef = firestore.collection("clients").doc(testClient.apiKey);
  const clientDoc = await clientRef.get();
  if (!clientDoc.exists) {
    await clientRef.set(testClient);
  }
});

// Delete the test client after running tests
afterAll(async () => {
  const firestore = admin.firestore();
  const client = await firestore
    .collection("clients")
    .where("apiKey", "==", TEST_API_KEY)
    .get();

  if (!client.empty) {
    await client.docs[0].ref.delete();
  }
});

describe("isValidApiKey", () => {
  it("returns true for a valid API key", async () => {
    const isValid = await isValidApiKey("test-api-key");
    expect(isValid).toEqual(true);
  });

  it("returns false for an invalid API key", async () => {
    const isValid = await isValidApiKey("invalid_api_key");
    expect(isValid).toEqual(false);
  });
});
