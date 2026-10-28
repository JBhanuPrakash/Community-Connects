import { describe, expect, it, beforeEach } from "vitest";
import api from "./axios.js";

describe("api axios instance", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("targets the backend /api base URL by default", () => {
    expect(api.defaults.baseURL).toMatch(/\/api$/);
  });

  it("attaches the stored access token as a bearer header", () => {
    localStorage.setItem("accessToken", "jwt-token-123");

    const [handler] = api.interceptors.request.handlers;

    const config = handler.fulfilled({ headers: {} });

    expect(config.headers.Authorization).toBe("Bearer jwt-token-123");
  });

  it("sends no authorization header when no token is stored", () => {
    const [handler] = api.interceptors.request.handlers;

    const config = handler.fulfilled({ headers: {} });

    expect(config.headers.Authorization).toBeUndefined();
  });
});