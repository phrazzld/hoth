/* const functionsTest = require("firebase-functions-test")( */
/*   { */
/*     databaseURL: "https://hoth-authentication.firebaseio.com", */
/*     projectId: "hoth-authentication", */
/*   }, */
/*   "../hoth-authentication-e41a562557a7.json" */
/* ); */

import * as admin from "firebase-admin";
import { assert } from "chai";
import * as myFunctions from "../src/index";
const serviceAccount = require("../hoth-authentication-e41a562557a7.json");

const TEST_API_KEY = "test-api-key";

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Before running tests, make sure to create a client in Firestore with a valid API key
before(async () => {
  const firestore = admin.firestore();

  // If they don't exist, create a client with a valid API key
  const client = firestore.collection("clients").doc(TEST_API_KEY);

  await client.set({
    apiKey: TEST_API_KEY,
    name: "Test Client",
    users: [],
  }, { merge: true });

});

// Delete the test client after running tests
after(async () => {
  console.log("*** after ***");
  const firestore = admin.firestore();
  await firestore.collection("clients").doc(TEST_API_KEY).get();

  // Delete all users in the client from auth
  await firestore
    .collection("clients")
    .where("apiKey", "==", TEST_API_KEY)
    .get()
    .then((querySnapshot) => {
      // Get client.users off querySnapshot
      const client = querySnapshot.docs[0].data();
      console.log("querySnapshot.docs[0]:", querySnapshot.docs[0]);
      const users = client.users;
      console.log("client:", client);
      console.log("users:", users);
      // Delete all users in client.users
      users.forEach((user: any) => {
        console.log("deleting user:", user);
        admin.auth().deleteUser(user.uid);
      });
    });

  // Delete the client
  await firestore.collection("clients").doc(TEST_API_KEY).delete();
});

describe("isValidApiKey", () => {
  it("returns true for a valid API key", async () => {
    const isValid = await myFunctions.isValidApiKey(TEST_API_KEY);
    assert.equal(isValid, true);
  });

  it("returns false for an invalid API key", async () => {
    const isValid = await myFunctions.isValidApiKey("invalid-api-key");
    assert.equal(isValid, false);
  });
});

describe("createUserFunction", () => {
  it("should create a new user in Firebase auth and Firestore", async () => {
    console.log("*** testing createUserFunction ***");
    // Set up request and response objects
    const req: any = {
      body: {
        apiKey: TEST_API_KEY,
        email: "test@example.com",
        password: "password",
      },
    };
    console.log("req:", req);
    const res: any = {
      send: (response: any) => {
        // Assert that the response includes the expected userId
        assert.property(response, "userId");
      },
      status: (code: number) => {
        // Assert that the response status is 200
        assert.equal(code, 200);
        return res;
      },
    };
    console.log("res:", res);

    // Invoke the createUser function
    console.log("invoking createUserFunction");
    await myFunctions.createUserFunction(req, res);
    console.log("done invoking createUserFunction");

    // Assert that the user was created in Firebase auth
    console.log("asserting user was created in Firebase auth");
    const userRecord = await admin.auth().getUserByEmail(req.body.email);
    assert.equal(userRecord.email, req.body.email);
  });
});
