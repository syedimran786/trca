// #163 — where the portal's API is, seen from the web and from the app.
//
// This decides two things that are invisible until they are wrong: whether a
// request goes to an origin that has an API on it, and whether the session
// cookie is sent with it. Getting either wrong in the app looks like being
// permanently signed out.
import { describe, it, expect, afterEach } from "vitest";
import { apiCredentials, apiOrigin, apiUrl, isNative } from "../src/lib/apiBase.js";

const asNative = (on) => {
  if (on) globalThis.Capacitor = { isNativePlatform: () => true };
  else delete globalThis.Capacitor;
};

afterEach(() => asNative(false));

describe("on the website", () => {
  it("keeps paths relative, so nothing becomes cross-origin", () => {
    expect(apiOrigin()).toBe("");
    expect(apiUrl("/auth/me")).toBe("/auth/me");
  });

  it("keeps the tighter credentials mode", () => {
    expect(apiCredentials()).toBe("same-origin");
  });

  it("does not think it is native", () => {
    expect(isNative()).toBe(false);
  });
});

describe("inside the app", () => {
  it("addresses the real API rather than the bundle's own origin", () => {
    // Capacitor serves the build from https://localhost, where a relative
    // /auth/me resolves to a host with no API on it — the bug this fixes.
    asNative(true);
    expect(apiUrl("/auth/me")).toBe("https://restcoderacademy.in/auth/me");
  });

  it("sends credentials, which same-origin would silently drop", () => {
    asNative(true);
    expect(apiCredentials()).toBe("include");
  });
});

describe("detecting the shell", () => {
  it("reads the injected bridge, not the user agent", () => {
    // Android's WebView UA is close enough to Chrome's to be a coin flip, and
    // is spoofable besides.
    globalThis.Capacitor = { isNativePlatform: () => false };
    expect(isNative()).toBe(false);

    globalThis.Capacitor = {};
    expect(isNative()).toBe(false);
  });
});
