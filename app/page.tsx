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
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Graph Flow Trainer</h1>

          <div className="flex items-center gap-2">
            <label htmlFor="system-select" className="text-sm text-slate-600">
              System
            </label>
            <select
              id="system-select"
              value={systemId}
              onChange={(e) => setSystemId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
            >
              <option value="jiu-jitsu">jiu-jitsu</option>
            </select>
            <button
              className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm hover:bg-slate-200"
              onClick={() => {
                if (!system) return;
                setCurrentNodeId(system.adjacency.nodeIds[0] ?? null);
              }}
            >
              Restart
            </button>
          </div>
        </div>

        {isLoading && <p className="text-slate-600">Loading system...</p>}

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
            Error: {error}
          </p>
        )}

        {!isLoading && !error && currentNode && (
          <section className="space-y-6">
            <div>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">{currentNode.title}</h2>
              <article className="prose prose-slate max-w-none">
                <ReactMarkdown>{currentNode.descriptionMarkdown}</ReactMarkdown>
              </article>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500">
                Next options
              </h3>
              {nextNodeIds.length === 0 ? (
                <p className="text-slate-500">No next moves from this node.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {nextNodeIds.map((nextId) => {
                    const nextNode = system?.nodes[nextId];
                    return (
                      <button
                        key={nextId}
                        onClick={() => setCurrentNodeId(nextId)}
                        className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 hover:bg-blue-100"
                      >
                        {nextNode?.title ?? nextId}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}