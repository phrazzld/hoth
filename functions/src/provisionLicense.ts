import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { isValidApiKey } from "./isValidApiKey";

// TODO: Require license specifications to create
interface ProvisionLicenseRequest {
  apiKey: string;
  userId: string;
}

interface ProvisionLicenseResponse {
  licenseKey: string;
}

// Generate a random license key
function generateLicenseKey(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
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
