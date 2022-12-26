import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { isValidApiKey } from "./isValidApiKey";

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
