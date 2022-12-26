import { assert } from "chai";
import * as admin from "firebase-admin";
import { createUserFunction } from "../src/createUser";
import { TEST_API_KEY } from "./utils";

describe("createUserFunction", () => {
  it("should create a new user in Firebase auth and Firestore", async () => {
    // Set up request and response objects
    const req: any = {
      body: {
        apiKey: TEST_API_KEY,
        email: "test@example.com",
        password: "password",
      },
    };
    const res: any = {
      send: (response: any) => {
        // Assert that the response includes the expected userId
        assert.property(response, "userId");
      },
      status: (code: number) => {
        // Assert that the response status is 201
        assert.equal(code, 201);
        return res;
      },
    };

    // Invoke the createUser function
    await createUserFunction(req, res);

    // Assert that the user was created in Firebase auth
    const userRecord = await admin.auth().getUserByEmail(req.body.email);
    assert.equal(userRecord.email, req.body.email);
  });

  it("should add the user to the client's users list", async () => {
    // Set up request and response objects
    const req: any = {
      body: {
        apiKey: TEST_API_KEY,
        email: "test2@example.com",
        password: "password",
      },
    };
    const res: any = {
      send: (response: any) => {
        // Assert that the response includes the expected userId
        assert.property(response, "userId");
      },
      status: (code: number) => {
        // Assert that the response status is 201
        assert.equal(code, 201);
        return res;
      },
    };

    // Invoke the createUser function
    await createUserFunction(req, res);

    // Assert that the user was added to the client's users list
    const firestore = admin.firestore();
    const user = await firestore
      .collection("clients")
      .doc(TEST_API_KEY)
      .collection("users")
      .where("email", "==", req.body.email)
      .get();
    assert.equal(user.docs[0].data().email, req.body.email);
  });

  it("should return an error if the API key is invalid", async () => {
    // Set up request and response objects
    const req: any = {
      body: {
        apiKey: "invalid-api-key",
        email: "test3@example.com",
        password: "password",
      },
    };
    const res: any = {
      send: (response: any) => {
        // Assert that the response includes the expected error
        // And the message "The API key is invalid."
        assert.property(response, "error");
        assert.equal(response.error, "The API key is invalid.");
      },
      status: (code: number) => {
        // Assert that the response failed
        // Unauthorized
        assert.equal(code, 401);
        return res;
      },
    };

    // Assert that createUserFunction should return a 401
    await createUserFunction(req, res);
  });
});
