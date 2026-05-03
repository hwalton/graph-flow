import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/system/[systemId]", () => {
  it("returns 200 JSON for jiu-jitsu", async () => {
    const res = await GET(new Request("http://localhost/api/system/jiu-jitsu"), {
      params: Promise.resolve({ systemId: "jiu-jitsu" }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { systemId: string; nodes: Record<string, unknown> };
    expect(body.systemId).toBe("jiu-jitsu");
    expect(typeof body.nodes).toBe("object");
  });

  it("returns 400 when loading fails", async () => {
    const res = await GET(new Request("http://localhost/api/system/__missing_system__"), {
      params: Promise.resolve({ systemId: "__missing_system__" }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(typeof body.error).toBe("string");
    expect(body.error.length).toBeGreaterThan(0);
  });
});
