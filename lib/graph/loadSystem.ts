import { readFile } from "fs/promises";
import path from "path";
import type { AdjacencyMatrix, GraphSystem, NodesById } from "./types";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAdjacencyMatrix(value: unknown): value is AdjacencyMatrix {
  if (!isObject(value)) return false;
  if (!Array.isArray(value.nodeIds)) return false;
  if (!Array.isArray(value.matrix)) return false;

  const nodeIdsAreStrings = value.nodeIds.every((id) => typeof id === "string");
  const matrixIs2DNumbers = value.matrix.every(
    (row) => Array.isArray(row) && row.every((cell) => typeof cell === "number")
  );

  return nodeIdsAreStrings && matrixIs2DNumbers;
}

function isNodesById(value: unknown): value is NodesById {
  if (!isObject(value)) return false;

  return Object.values(value).every((node) => {
    if (!isObject(node)) return false;

    return (
      typeof node.id === "string" &&
      typeof node.title === "string" &&
      typeof node.descriptionMarkdown === "string"
    );
  });
}

export async function loadSystem(systemId: string): Promise<GraphSystem> {
  const systemPath = path.join(process.cwd(), "content", "systems", systemId);
  const nodesPath = path.join(systemPath, "nodes.json");
  const adjacencyPath = path.join(systemPath, "adjacency.json");

  const [nodesRaw, adjacencyRaw] = await Promise.all([
    readFile(nodesPath, "utf-8"),
    readFile(adjacencyPath, "utf-8"),
  ]);

  const parsedNodes: unknown = JSON.parse(nodesRaw);
  const parsedAdjacency: unknown = JSON.parse(adjacencyRaw);

  if (!isNodesById(parsedNodes)) {
    throw new Error(`Invalid nodes.json for system "${systemId}"`);
  }

  if (!isAdjacencyMatrix(parsedAdjacency)) {
    throw new Error(`Invalid adjacency.json for system "${systemId}"`);
  }

  return {
    systemId,
    nodes: parsedNodes,
    adjacency: parsedAdjacency,
  };
}