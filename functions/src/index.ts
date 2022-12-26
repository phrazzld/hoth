import * as admin from "firebase-admin";
import { authenticateUserFunction } from "./authenticateUser";
import { createUserFunction } from "./createUser";
import { provisionLicenseFunction } from "./provisionLicense";
const serviceAccount = require("../hoth-authentication-e41a562557a7.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// TODO: Write isAuthorizedRequest function

export {
  authenticateUserFunction,
  createUserFunction,
  provisionLicenseFunction,
};
