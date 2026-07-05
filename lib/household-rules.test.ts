import { describe, expect, it } from "vitest";

import { canLeaveHousehold, organizerCount, wouldKeepOrganizer } from "./household-rules";

const organizer = { id: "u1", role: "ORGANIZER" as const };
const editor = { id: "u2", role: "EDITOR" as const };
const member = { id: "u3", role: "MEMBER" as const };

describe("organizerCount", () => {
  it("counts only ORGANIZER members", () => {
    expect(organizerCount([organizer, editor, member])).toBe(1);
    expect(organizerCount([organizer, { id: "x", role: "ORGANIZER" }])).toBe(2);
    expect(organizerCount([editor, member])).toBe(0);
  });
});

describe("canLeaveHousehold", () => {
  it("forbids leaving when the user is the only member", () => {
    expect(canLeaveHousehold("u1", [organizer]).allowed).toBe(false);
  });

  it("forbids the sole organizer from leaving while others remain", () => {
    const result = canLeaveHousehold("u1", [organizer, editor, member]);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Организатор");
  });

  it("allows the organizer to leave when another organizer remains", () => {
    const secondOrganizer = { id: "u4", role: "ORGANIZER" as const };
    expect(canLeaveHousehold("u1", [organizer, secondOrganizer, member]).allowed).toBe(true);
  });

  it("allows a non-organizer to leave when others remain", () => {
    expect(canLeaveHousehold("u3", [organizer, member]).allowed).toBe(true);
  });
});

describe("wouldKeepOrganizer", () => {
  it("returns false when demoting the last organizer", () => {
    expect(wouldKeepOrganizer([organizer, editor, member], "u1", "EDITOR")).toBe(false);
  });

  it("returns true when demoting one of several organizers", () => {
    const secondOrganizer = { id: "u4", role: "ORGANIZER" as const };
    expect(wouldKeepOrganizer([organizer, secondOrganizer], "u1", "MEMBER")).toBe(true);
  });

  it("returns true when promoting a member (organizer stays organizer)", () => {
    expect(wouldKeepOrganizer([organizer, member], "u3", "ORGANIZER")).toBe(true);
  });
});
