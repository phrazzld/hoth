import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

admin.initializeApp();

// Define request and response interfaces
interface CreateUserRequest {
  apiKey: string;
  email: string;
  password: string;
}

interface CreateUserResponse {
  userId: string;
}

interface ProvisionLicenseRequest {
  apiKey: string;
  userId: string;
  transactionId: string;
}

interface ProvisionLicenseResponse {
  licenseKey: string;
}

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
  // Check if the API key exists in Cloud Firestore
  const firestore = admin.firestore();
  const client = await firestore
    .collection("clients")
    .where("apiKey", "==", apiKey)
    .get();
  return !client.empty;
}

// Create user function
async function createUser(req: CreateUserRequest): Promise<CreateUserResponse> {
  await isValidApiKey(req.apiKey);
  // Create user in Firebase auth service
  const userRecord = await admin.auth().createUser({
    email: req.email,
    password: req.password,
  });
  // Create user in Firestore
  const firestore = admin.firestore();
  await firestore
    .collection("clients")
    .doc(req.apiKey)
    .collection("users")
    .doc(userRecord.uid)
    .set({
      email: req.email,
    });
  return { userId: userRecord.uid };
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
  async (req, res) => {
    try {
      const createUserResponse = await createUser(
        req.body as CreateUserRequest
      );
      res.send(createUserResponse);
    } catch (error: any) {
      res.status(500).send({ error: error.message });
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
