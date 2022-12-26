import { assert } from "chai";
import { isValidApiKey } from "../src/isValidApiKey";
import { TEST_API_KEY } from "./utils";

describe("isValidApiKey", () => {
  it("returns true for a valid API key", async () => {
    const isValid = await isValidApiKey(TEST_API_KEY);
    assert.equal(isValid, true);
  });

  it("returns false for an invalid API key", async () => {
    const isValid = await isValidApiKey("invalid-api-key");
    assert.equal(isValid, false);
  });
});
