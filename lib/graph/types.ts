export type NodeId = string;

export interface GraphNode {
  id: NodeId;
  title: string;
  descriptionMarkdown: string;
}

export type NodesById = Record<NodeId, GraphNode>;

export interface AdjacencyMatrix {
  nodeIds: NodeId[];
  matrix: number[][];
}

export interface GraphSystem {
  systemId: string;
  nodes: NodesById;
  adjacency: AdjacencyMatrix;
}