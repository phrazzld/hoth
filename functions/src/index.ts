import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
const serviceAccount = require("../hoth-authentication-e41a562557a7.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Define request and response interfaces
export interface CreateUserRequest {
  apiKey: string;
  email: string;
  password: string;
}

interface CreateUserResponse {
  userId: string;
}

// TODO: Require license specifications to create
interface ProvisionLicenseRequest {
  apiKey: string;
  userId: string;
}

interface ProvisionLicenseResponse {
  licenseKey: string;
}

// TODO: Write isAuthorizedRequest function

// Define request and response interfaces
interface AuthenticateUserRequest {
  apiKey: string;
  email: string;
  password: string;
}

interface AuthenticateUserResponse {
  userId: string;
  token: string;
}

// Verify the API key
// Find the client with the API key
export async function isValidApiKey(apiKey: string): Promise<boolean> {
  console.log("*** isValidApiKey ***");
  console.log("apiKey:", apiKey);
  // Check if the API key exists in Cloud Firestore
  const firestore = admin.firestore();
  const client = await firestore.collection("clients").doc(apiKey).get();

  console.log("client.exists:", client.exists);
  return client.exists;
}

// Create user function
export async function createUser(
  req: CreateUserRequest
): Promise<CreateUserResponse> {
  console.log("*** createUser ***");
  console.log("req.apiKey:", req.apiKey);
  // If the API key is valid, create the user
  // Otherwise, throw an error
  if (await isValidApiKey(req.apiKey)) {
    console.log("is valid api key");
    // Create user in Firebase auth service
    console.log("creating auth user");
    console.log("req.email:", req.email);
    console.log("req.password", req.password);
    // Only create a new auth user if one does not already exist
    try {
      const user = await admin.auth().getUserByEmail(req.email);
      console.log(`User with email ${req.email} already exists.`);
      console.log("user:", user);
      console.log("user.uid:", user.uid);

      const firestore = admin.firestore();
      await firestore
        .collection("clients")
        .doc(req.apiKey)
        .collection("users")
        .doc(user.uid)
        .set({
          email: req.email,
        });
      console.log("created firestore user");

      // Get the user document
      return { userId: user.uid };
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        const user = await admin.auth().createUser({
          email: req.email,
          password: req.password,
        });
        console.log(`Successfully created new user: ${user.uid}`);
        console.log("user:", user);
        return { userId: user.uid };
      } else {
        console.log(`Error getting user by email: ${error}`);
        throw new functions.https.HttpsError("internal", error);
      }
    }
  } else {
    console.log("is not valid api key");
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The API key is invalid."
    );
  }
}

// Provision license function
async function provisionLicense(
  req: ProvisionLicenseRequest
): Promise<ProvisionLicenseResponse> {
  await isValidApiKey(req.apiKey);
  // Generate a license key
  const licenseKey = generateLicenseKey();
  // Store the license key in the Firebase database
  const firestore = admin.firestore();
  await firestore
    .collection("clients")
    .doc(req.apiKey)
    .collection("users")
    .doc(req.userId)
    .set({
      licenseKey: licenseKey,
    });
  return { licenseKey: licenseKey };
}

// Generate a random license key
function generateLicenseKey(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

// Authenticate user function
// TODO: fix to actually authenticate with email/password in req.body
async function authenticateUser(
  req: AuthenticateUserRequest
): Promise<AuthenticateUserResponse> {
  await isValidApiKey(req.apiKey);
  // Authenticate the user with the Firebase auth service
  const userRecord = await admin.auth().getUserByEmail(req.email);
  const userId = userRecord.uid;
  const token = await admin.auth().createCustomToken(userId);
  return { userId: userId, token: token };
}

// Expose create user function as a Firebase Cloud Function
export const createUserFunction = functions.https.onRequest(
  async (req, res): Promise<any> => {
    console.log("*** createUserFunction ***");
    try {
      const createUserResponse = await createUser(
        req.body as CreateUserRequest
      );
      return res.status(201).send(createUserResponse);
    } catch (error: any) {
      console.log("error:", error);
      if (error instanceof functions.https.HttpsError) {
        console.log("res:", res);
        console.log("error.httpErrorCode:", error.httpErrorCode);
        console.log("error.httpErrorCode.status:", error.httpErrorCode.status);
        console.log(
          "res.status(error.httpErrorCode.status):",
          res.status(error.httpErrorCode.status)
        );
        console.log("res.status(401):", res.status(401));
        console.log("error.message:", error.message);
        return res.status(401).send({ error: error.message });
      } else {
        console.log("res:", res);
        console.log("res.status(500):", res.status(500));
        return res.status(500).send({ error: error.message });
      }
    }
  }
);

// Expose provision license function as a Firebase Cloud Function
export const provisionLicenseFunction = functions.https.onRequest(
  async (req, res) => {
    try {
      const provisionLicenseResponse = await provisionLicense(
        req.body as ProvisionLicenseRequest
      );
      res.send(provisionLicenseResponse);
    } catch (error: any) {
      res.status(500).send({ error: error.message });
    }
  }
);

// Expose authenticate user function as a Firebase Cloud Function
export const authenticateUserFunction = functions.https.onRequest(
  async (req, res) => {
    try {
      const authenticateUserResponse = await authenticateUser(
        req.body as AuthenticateUserRequest
      );
      res.send(authenticateUserResponse);
    } catch (error: any) {
      res.status(500).send({ error: error.message });
    }
  }
);
