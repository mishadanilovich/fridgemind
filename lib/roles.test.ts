import { describe, it, expect } from "vitest";
import { hasRole } from "./roles";

describe("hasRole", () => {
  it("returns true when the user's role is in the allowed list", () => {
    expect(hasRole({ role: "ORGANIZER" }, ["ORGANIZER", "EDITOR"])).toBe(true);
    expect(hasRole({ role: "EDITOR" }, ["ORGANIZER", "EDITOR"])).toBe(true);
  });

  it("returns false when the user's role is not allowed", () => {
    expect(hasRole({ role: "MEMBER" }, ["ORGANIZER", "EDITOR"])).toBe(false);
  });

  it("returns false for an empty allowed list", () => {
    expect(hasRole({ role: "ORGANIZER" }, [])).toBe(false);
  });
});
