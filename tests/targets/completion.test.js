import { describe, it, expect } from "vitest";

import { api } from "../helpers/request.helper.js";
import { registerFreshUser } from "../helpers/auth.helper.js";
import { createTarget } from "../helpers/target.helper.js";
import { createExpenseRecord } from "../helpers/expenseRecord.helper.js";

// Completing a target spends Total Extra Save, so every case needs a user
// whose Extra Save it controls: a fresh one, on a budget of exactly 1000 a day,
// with one record of 150 — 850 saved.
const userWithExtraSave = async () => {
  const { token } = await registerFreshUser();

  await api()
    .put("/api/users/profile")
    .set("Authorization", `Bearer ${token}`)
    .send({ salary: 26000, working_days_per_month: 26 });

  await createExpenseRecord(token);

  return token;
};

const updateTarget = (token, id, body) =>
  api()
    .put(`/api/target/${id}`)
    .set("Authorization", `Bearer ${token}`)
    .send(body);

const extraSaving = async (token) => {
  const response = await api()
    .get("/api/dashboard")
    .set("Authorization", `Bearer ${token}`);

  return response.body.data.extraSaving;
};

describe("Target completion", () => {
  it("should complete a target the Extra Save can pay for", async () => {
    const token = await userWithExtraSave();
    const target = await createTarget(token, { target_amount: 800 });

    const response = await updateTarget(token, target.id, {
      status: "completed",
    });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("completed");

    expect(await extraSaving(token)).toMatchObject({
      totalExtraSave: 50,
      totalDeductedByTargets: 800,
    });
  });

  it("should refuse to complete a target larger than the Extra Save", async () => {
    const token = await userWithExtraSave();
    const target = await createTarget(token, { target_amount: 850.01 });

    const response = await updateTarget(token, target.id, {
      status: "completed",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Not enough Extra Save to complete this target. Available: 850.00"
    );

    expect((await extraSaving(token)).totalExtraSave).toBe(850);
  });

  it("should count targets already completed against what is left", async () => {
    const token = await userWithExtraSave();
    const first = await createTarget(token, { target_amount: 500 });
    const second = await createTarget(token, { target_amount: 400 });

    expect(
      (await updateTarget(token, first.id, { status: "completed" })).status
    ).toBe(200);

    const response = await updateTarget(token, second.id, {
      status: "completed",
    });

    expect(response.status).toBe(400);
  });

  it("should let only one of two racing completions spend the same Extra Save", async () => {
    const token = await userWithExtraSave();
    const first = await createTarget(token, { target_amount: 600 });
    const second = await createTarget(token, { target_amount: 600 });

    const responses = await Promise.all([
      updateTarget(token, first.id, { status: "completed" }),
      updateTarget(token, second.id, { status: "completed" }),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([
      200, 400,
    ]);

    expect((await extraSaving(token)).totalExtraSave).toBe(250);
  });

  it("should refuse to change a completed target's amount", async () => {
    const token = await userWithExtraSave();
    const target = await createTarget(token, { target_amount: 300 });

    await updateTarget(token, target.id, { status: "completed" });

    const response = await updateTarget(token, target.id, {
      target_amount: 100,
    });

    expect(response.status).toBe(400);
    expect((await extraSaving(token)).totalDeductedByTargets).toBe(300);
  });

  it("should still rename a completed target", async () => {
    const token = await userWithExtraSave();
    const target = await createTarget(token, { target_amount: 300 });

    await updateTarget(token, target.id, { status: "completed" });

    const response = await updateTarget(token, target.id, {
      name: "Renamed",
      target_amount: 300,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe("Renamed");
  });

  it("should let a target go back to pending with a new amount", async () => {
    const token = await userWithExtraSave();
    const target = await createTarget(token, { target_amount: 300 });

    await updateTarget(token, target.id, { status: "completed" });

    const response = await updateTarget(token, target.id, {
      status: "pending",
      target_amount: 100,
    });

    expect(response.status).toBe(200);
    expect(await extraSaving(token)).toMatchObject({
      totalExtraSave: 850,
      totalDeductedByTargets: 0,
    });
  });
});

describe("Target picture on update", () => {
  it("should accept remove_image on a target with no picture", async () => {
    const { token } = await registerFreshUser();
    const target = await createTarget(token);

    const response = await updateTarget(token, target.id, {
      remove_image: true,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.image_url).toBeNull();
  });

  it("should refuse a remove_image that is not a boolean", async () => {
    const { token } = await registerFreshUser();
    const target = await createTarget(token);

    const response = await updateTarget(token, target.id, {
      remove_image: "yes",
    });

    expect(response.status).toBe(400);
  });

  it("should refuse a new picture and remove_image together", async () => {
    const { token } = await registerFreshUser();
    const target = await createTarget(token);

    // A 1x1 PNG. The conflict is refused before anything is compressed or
    // uploaded, so this never reaches storage.
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64"
    );

    const response = await api()
      .put(`/api/target/${target.id}`)
      .set("Authorization", `Bearer ${token}`)
      .field("remove_image", "true")
      .attach("image", png, { filename: "dot.png", contentType: "image/png" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Send a new image or remove the current one, not both"
    );
  });
});
