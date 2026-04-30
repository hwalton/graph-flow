"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { GraphSystem, NodeId } from "@/lib/graph/types";

function getNextNodeIds(currentNodeId: NodeId, system: GraphSystem): NodeId[] {
  const { nodeIds, matrix } = system.adjacency;
  const rowIndex = nodeIds.indexOf(currentNodeId);

  if (rowIndex === -1) return [];

  const row = matrix[rowIndex];
  return row
    .map((cell, colIndex) => (cell === 1 ? nodeIds[colIndex] : null))
    .filter((id): id is NodeId => id !== null);
}

export default function HomePage() {
  const [systemId, setSystemId] = useState("jiu-jitsu");
  const [system, setSystem] = useState<GraphSystem | null>(null);
  const [currentNodeId, setCurrentNodeId] = useState<NodeId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/system/${systemId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load system");
        }

        const loadedSystem = data as GraphSystem;
        setSystem(loadedSystem);
        setCurrentNodeId(loadedSystem.adjacency.nodeIds[0] ?? null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        setSystem(null);
        setCurrentNodeId(null);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [systemId]);

  const currentNode = useMemo(() => {
    if (!system || !currentNodeId) return null;
    return system.nodes[currentNodeId] ?? null;
  }, [system, currentNodeId]);

  const nextNodeIds = useMemo(() => {
    if (!system || !currentNodeId) return [];
    return getNextNodeIds(currentNodeId, system);
  }, [system, currentNodeId]);

  return (
    <main style={{ maxWidth: 800, margin: "40px auto", padding: "0 16px" }}>
      <h1>Graph Flow Trainer</h1>

      <label htmlFor="system-select">System: </label>
      <select
        id="system-select"
        value={systemId}
        onChange={(e) => setSystemId(e.target.value)}
      >
        <option value="jiu-jitsu">jiu-jitsu</option>
      </select>

      <button
        style={{ marginLeft: 12 }}
        onClick={() => {
          if (!system) return;
          setCurrentNodeId(system.adjacency.nodeIds[0] ?? null);
        }}
      >
        Restart
      </button>

      {isLoading && <p>Loading...</p>}
      {error && <p style={{ color: "crimson" }}>Error: {error}</p>}

      {!isLoading && !error && currentNode && (
        <>
          <h2>{currentNode.title}</h2>
          <ReactMarkdown>{currentNode.descriptionMarkdown}</ReactMarkdown>

          <h3>Next options</h3>
          {nextNodeIds.length === 0 ? (
            <p>No next moves from here.</p>
          ) : (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {nextNodeIds.map((nextId) => {
                const nextNode = system?.nodes[nextId];
                return (
                  <button key={nextId} onClick={() => setCurrentNodeId(nextId)}>
                    {nextNode?.title ?? nextId}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </main>
  );
}