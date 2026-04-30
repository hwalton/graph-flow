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

function validateGraphConsistency(
  systemId: string,
  nodes: NodesById,
  adjacency: AdjacencyMatrix
): void {
  const { nodeIds, matrix } = adjacency;
  const size = nodeIds.length;

  if (size === 0) {
    throw new Error(`System "${systemId}" has empty nodeIds in adjacency.json`);
  }

  const uniqueNodeIds = new Set(nodeIds);
  if (uniqueNodeIds.size !== nodeIds.length) {
    throw new Error(`System "${systemId}" has duplicate nodeIds in adjacency.json`);
  }

  const nodeKeys = new Set(Object.keys(nodes));
  for (const nodeId of nodeIds) {
    if (!nodeKeys.has(nodeId)) {
      throw new Error(
        `System "${systemId}" adjacency references missing node "${nodeId}" in nodes.json`
      );
    }
  }

  if (matrix.length !== size) {
    throw new Error(
      `System "${systemId}" matrix row count (${matrix.length}) must equal nodeIds length (${size})`
    );
  }

  matrix.forEach((row, rowIndex) => {
    if (row.length !== size) {
      throw new Error(
        `System "${systemId}" matrix row ${rowIndex} length (${row.length}) must equal ${size}`
      );
    }

    row.forEach((cell, colIndex) => {
      if (!Number.isInteger(cell) || (cell !== 0 && cell !== 1)) {
        throw new Error(
          `System "${systemId}" matrix cell [${rowIndex},${colIndex}] must be 0 or 1`
        );
      }
    });
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

  validateGraphConsistency(systemId, parsedNodes, parsedAdjacency);

  return {
    systemId,
    nodes: parsedNodes,
    adjacency: parsedAdjacency,
  };
}