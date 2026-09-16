import { describe, it, expect } from "vitest";
import { api } from "../helpers/request.helper.js";
import { login } from "../helpers/auth.helper.js";

// Both rules are enforced while the multipart body is parsed, before the
// service or storage is reached, so no picture is ever uploaded here.
describe("POST /api/target image rules", () => {
  it("should reject an image over 5MB", async () => {
    const { token } = await login();

    const response = await api()
      .post("/api/target")
      .set("Authorization", `Bearer ${token}`)
      .field("name", "Big Picture")
      .field("target_amount", "1000")
      .attach("image", Buffer.alloc(5 * 1024 * 1024 + 1), {
        filename: "big.png",
        contentType: "image/png",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Image must be 5MB or smaller");
  });

  it("should reject a file that is not a JPG, PNG, WEBP or GIF", async () => {
    const { token } = await login();

    const response = await api()
      .post("/api/target")
      .set("Authorization", `Bearer ${token}`)
      .field("name", "Wrong Type")
      .field("target_amount", "1000")
      .attach("image", Buffer.from("not an image"), {
        filename: "notes.txt",
        contentType: "text/plain",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Only JPG, PNG, WEBP and GIF images are allowed"
    );
  });
});
