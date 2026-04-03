"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  MarkerType,
} from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import "@xyflow/react/dist/style.css";

interface MindMapNode {
  id: string;
  label: string;
  type: "pack" | "topic" | "file" | string;
  summary?: string;
}

interface MindMapEdge {
  source: string;
  target: string;
  label?: string;
}

interface MindMapViewProps {
  data: { nodes: MindMapNode[]; edges: MindMapEdge[] };
  packName: string;
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 50;

const NODE_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  pack: { bg: "var(--accent-amber)", border: "var(--accent-amber)", text: "var(--bg-0)" },
  topic: { bg: "var(--bg-2)", border: "var(--accent-cyan)", text: "var(--text-1)" },
  file: { bg: "var(--bg-2)", border: "var(--border-strong)", text: "var(--text-2)" },
};

function getLayoutedElements(
  inputNodes: Node[],
  inputEdges: Edge[],
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", ranksep: 80, nodesep: 60 });

  inputNodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });
  inputEdges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = inputNodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges: inputEdges };
}

export default function MindMapView({ data, packName }: MindMapViewProps) {
  const rawNodes: Node[] = useMemo(() => {
    if (!data.nodes || data.nodes.length === 0) return [];
    return data.nodes.map((n) => {
      const style = NODE_STYLES[n.type] ?? NODE_STYLES.file;
      return {
        id: n.id,
        data: {
          label: (
            <div
              style={{
                fontSize: n.type === "pack" ? 13 : 11,
                fontWeight: n.type === "pack" ? 600 : 400,
                lineHeight: "1.3",
                textAlign: "center" as const,
                padding: "4px 8px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap" as const,
                color: style.text,
              }}
              title={n.summary || n.label}
            >
              {n.label}
            </div>
          ),
        },
        position: { x: 0, y: 0 },
        style: {
          backgroundColor: style.bg,
          border: `1.5px solid ${style.border}`,
          borderRadius: n.type === "pack" ? "14px" : "10px",
          width: n.type === "pack" ? 200 : NODE_WIDTH,
          minHeight: NODE_HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      };
    });
  }, [data.nodes]);

  const rawEdges: Edge[] = useMemo(() => {
    if (!data.edges || data.edges.length === 0) return [];
    return data.edges.map((e, i) => ({
      id: `e-${e.source}-${e.target}-${i}`,
      source: e.source,
      target: e.target,
      label: e.label || undefined,
      style: { stroke: "var(--border-strong)", strokeWidth: 1.5 },
      labelStyle: { fontSize: 10, fill: "var(--text-3)" },
      markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12, color: "var(--border-strong)" },
    }));
  }, [data.edges]);

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => (rawNodes.length > 0 ? getLayoutedElements(rawNodes, rawEdges) : { nodes: [], edges: [] }),
    [rawNodes, rawEdges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  useEffect(() => {
    if (layoutedNodes.length > 0) {
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    }
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  if (!data.nodes || data.nodes.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 rounded-xl"
        style={{ backgroundColor: "var(--bg-1)", border: "1px solid var(--border-subtle)" }}
      >
        <p className="text-sm" style={{ color: "var(--text-3)" }}>
          Mind map will appear after processing completes.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        height: 500,
        backgroundColor: "var(--bg-0)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
        style={{ backgroundColor: "var(--bg-0)" }}
      >
        <Background color="var(--border-subtle)" gap={20} />
        <Controls
          style={{
            backgroundColor: "var(--bg-1)",
            borderColor: "var(--border-default)",
          }}
        />
      </ReactFlow>
    </div>
  );
}
