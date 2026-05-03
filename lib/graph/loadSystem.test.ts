import { mkdir, mkdtemp, rm, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";
import { loadSystem } from "./loadSystem";

async function writeSystem(
  root: string,
  systemId: string,
  nodes: unknown,
  adjacency: unknown
) {
  const dir = path.join(root, "content", "systems", systemId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "nodes.json"), JSON.stringify(nodes, null, 2));
  await writeFile(
    path.join(dir, "adjacency.json"),
    JSON.stringify(adjacency, null, 2)
  );
}

describe("loadSystem", () => {
  it("loads the bundled jiu-jitsu system from the repo root", async () => {
    const system = await loadSystem("jiu-jitsu");
    expect(system.systemId).toBe("jiu-jitsu");
    expect(Object.keys(system.nodes).length).toBeGreaterThan(0);
    expect(system.adjacency.nodeIds.length).toBeGreaterThan(0);
  });

  it("loads a minimal valid system from a custom project root", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "graph-flow-"));
    try {
      await writeSystem(
        root,
        "demo",
        {
          a: {
            id: "a",
            title: "A",
            descriptionMarkdown: "",
          },
          b: {
            id: "b",
            title: "B",
            descriptionMarkdown: "",
          },
        },
        {
          nodeIds: ["a", "b"],
          matrix: [
            [0, 1],
            [0, 0],
          ],
        }
      );

      const system = await loadSystem("demo", { projectRoot: root });
      expect(system.systemId).toBe("demo");
      expect(system.nodes.a.title).toBe("A");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("rejects adjacency that references a missing node", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "graph-flow-"));
    try {
      await writeSystem(
        root,
        "bad-ref",
        {
          a: { id: "a", title: "A", descriptionMarkdown: "" },
        },
        { nodeIds: ["a", "b"], matrix: [[0, 0],[0, 0]]
        }
      );

      await expect(loadSystem("bad-ref", { projectRoot: root })).rejects.toThrow(
        /missing node "b"/
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("rejects duplicate node ids in adjacency", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "graph-flow-"));
    try {
      await writeSystem(
        root,
        "dup",
        {
          a: { id: "a", title: "A", descriptionMarkdown: "" },
        },
        { nodeIds: ["a", "a"], matrix: [[0, 0],[0, 0]] }
      );

      await expect(loadSystem("dup", { projectRoot: root })).rejects.toThrow(
        /duplicate nodeIds/
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("rejects matrix row length mismatch", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "graph-flow-"));
    try {
      await writeSystem(
        root,
        "shape",
        {
          a: { id: "a", title: "A", descriptionMarkdown: "" },
          b: { id: "b", title: "B", descriptionMarkdown: "" },
        },
        { nodeIds: ["a", "b"], matrix: [[0, 1, 1]] }
      );

      await expect(loadSystem("shape", { projectRoot: root })).rejects.toThrow(
        /matrix row/
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("rejects matrix cells that are not 0 or 1", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "graph-flow-"));
    try {
      await writeSystem(
        root,
        "cell",
        {
          a: { id: "a", title: "A", descriptionMarkdown: "" },
          b: { id: "b", title: "B", descriptionMarkdown: "" },
        },
        {
          nodeIds: ["a", "b"],
          matrix: [
            [0, 2],
            [0, 0],
          ],
        }
      );

      await expect(loadSystem("cell", { projectRoot: root })).rejects.toThrow(
        /must be 0 or 1/
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("rejects nodes.json that does not match schema", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "graph-flow-"));
    try {
      await writeSystem(
        root,
        "nodes-bad",
        { a: { id: "a", title: "A", descriptionMarkdown: 1 } },
        {
          nodeIds: ["a"],
          matrix: [[0]],
        }
      );

      await expect(loadSystem("nodes-bad", { projectRoot: root })).rejects.toThrow(
        /Invalid nodes\.json/
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
