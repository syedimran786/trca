/**
 * The seam between the portal UI (#110, #111) and the auth backend (#114).
 *
 * These two halves are built and reviewed separately, so the shape of
 * GET /auth/me is the thing most likely to drift. When it does, it should fail
 * here rather than render a blank portal on a student's phone.
 *
 * Response shapes are taken from functions/auth/me.js in #114:
 *   200 { id, name, email, avatar_url, role }
 *   401 { error: "unauthorized", reason }
 *   503 { error: "service_unavailable" }
 */
import { describe, it, expect } from "vitest";
import { readMeResponse } from "../src/components/portal/session-contract.js";

describe("reading GET /auth/me", () => {
  const user = {
    id: "u1", name: "Asha", email: "asha@example.com",
    avatar_url: "https://cdn/a.png", role: "student",
  };

  it("reads a signed-in student", () => {
    const s = readMeResponse(200, user);
    expect(s.status).toBe("authenticated");
    expect(s.user).toMatchObject({ id: "u1", name: "Asha", role: "student" });
  });

  it("renames avatar_url to the `picture` the components read", () => {
    // The rename happens once, here, rather than in three components.
    expect(readMeResponse(200, user).user.picture).toBe("https://cdn/a.png");
  });

  it("keeps the role the backend gave, and defaults to student when absent", () => {
    expect(readMeResponse(200, { ...user, role: "instructor" }).user.role).toBe("instructor");
    expect(readMeResponse(200, { ...user, role: undefined }).user.role).toBe("student");
  });

  it("treats 401 as signed out, not as an error", () => {
    const s = readMeResponse(401, { error: "unauthorized", reason: "No session cookie" });
    expect(s.status).toBe("anonymous");
    expect(s.user).toBeNull();
  });

  it("treats 503 as 'not switched on yet', not as signed out", () => {
    // #42's inert-until-configured state. Offering a sign-in button here sends
    // a student to a provider error page.
    const s = readMeResponse(503, { error: "service_unavailable" });
    expect(s.status).toBe("unconfigured");
    expect(s.providers).toEqual([]);
  });

  it("offers both providers while /auth/me does not say which are configured", () => {
    expect(readMeResponse(401, {}).providers).toEqual(["google", "microsoft"]);
  });

  it("defers to a providers list if the backend ever sends one", () => {
    expect(readMeResponse(401, { providers: ["google"] }).providers).toEqual(["google"]);
  });

  it("ignores a provider it has no button for", () => {
    // This field decides what a student is allowed to tap; anything unknown in
    // it would render a dead button pointing at /auth/<junk>/start.
    expect(readMeResponse(401, { providers: ["google", "facebook", 7] }).providers).toEqual(["google"]);
  });

  it("does not claim a session from a 200 with no user id", () => {
    expect(readMeResponse(200, {}).status).toBe("anonymous");
    expect(readMeResponse(200, null).status).toBe("anonymous");
  });

  it("survives a body that did not parse", () => {
    expect(readMeResponse(500, null).status).toBe("anonymous");
  });
});
