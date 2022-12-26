/* const functionsTest = require("firebase-functions-test")( */
/*   { */
/*     databaseURL: "https://hoth-authentication.firebaseio.com", */
/*     projectId: "hoth-authentication", */
/*   }, */
/*   "../hoth-authentication-e41a562557a7.json" */
/* ); */

import * as admin from "firebase-admin";
import { TEST_API_KEY } from "./utils";
const serviceAccount = require("../hoth-authentication-e41a562557a7.json");

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

  await client.set(
    {
      apiKey: TEST_API_KEY,
      name: "Test Client",
      users: [],
    },
    { merge: true }
  );
});

// Delete the test client after running tests
after(async () => {
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
      const users = client.users;
      // Delete all users in client.users
      users.forEach((user: any) => {
        admin.auth().deleteUser(user.uid);
      });
    });

  // Delete the client
  await firestore.collection("clients").doc(TEST_API_KEY).delete();
});
