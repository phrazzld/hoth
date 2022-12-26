import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { isValidApiKey } from "./isValidApiKey";

// Define request and response interfaces
export interface CreateUserRequest {
  apiKey: string;
  email: string;
  password: string;
}

interface CreateUserResponse {
  userId: string;
}

// Create user function
async function createUser(req: CreateUserRequest): Promise<CreateUserResponse> {
  // If the API key is valid, create the user
  // Otherwise, throw an error
  if (await isValidApiKey(req.apiKey)) {
    // Create user in Firebase auth service
    // Only create a new auth user if one does not already exist
    try {
      const user = await admin.auth().getUserByEmail(req.email);

      const firestore = admin.firestore();
      await firestore
        .collection("clients")
        .doc(req.apiKey)
        .collection("users")
        .doc(user.uid)
        .set({
          email: req.email,
        });

      // Get the user document
      return { userId: user.uid };
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        const user = await admin.auth().createUser({
          email: req.email,
          password: req.password,
        });
        return { userId: user.uid };
      } else {
        throw new functions.https.HttpsError("internal", error);
      }
    }
  } else {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The API key is invalid."
    );
  }
}

// Expose create user function as a Firebase Cloud Function
export const createUserFunction = functions.https.onRequest(
  async (req, res): Promise<any> => {
    try {
      const createUserResponse = await createUser(
        req.body as CreateUserRequest
      );
      return res.status(201).send(createUserResponse);
    } catch (error: any) {
      if (error instanceof functions.https.HttpsError) {
        return res.status(401).send({ error: error.message });
      } else {
        return res.status(500).send({ error: error.message });
      }
    }
  }
);
