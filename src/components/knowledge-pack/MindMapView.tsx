"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  MarkerType,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import {
  Brain,
  FileText,
  MousePointerClick,
  Network,
  Sparkles,
} from "lucide-react";
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
  compact?: boolean;
}

interface MindMapNodeData {
  label: string;
  nodeType: MindMapNode["type"];
  summary?: string;
  highlighted?: boolean; // selected or directly connected
  dimmed?: boolean;     // not in the active neighbourhood
}

type MindMapFlowNode = Node<MindMapNodeData, "knowledgeNode">;

const TYPE_META: Record<string, { label: string; accent: string; glow: string; icon: typeof Brain }> = {
  pack: { label: "Pack Core", accent: "var(--accent-amber)", glow: "rgba(242, 169, 59, 0.18)", icon: Brain },
  topic: { label: "Theme", accent: "var(--accent-cyan)", glow: "rgba(88, 184, 216, 0.18)", icon: Network },
  file: { label: "Source File", accent: "var(--border-strong)", glow: "rgba(255, 255, 255, 0.08)", icon: FileText },
};

function getTypeMeta(type: MindMapNode["type"]) {
  return TYPE_META[type] ?? TYPE_META.file;
}

function getNodeDimensions(type: MindMapNode["type"], label: string, summary?: string) {
  // Chars-per-line based on usable pixel width at each font size
  const labelCharsPerLine = type === "pack" ? 28 : type === "topic" ? 22 : 20;
  const summaryCharsPerLine = type === "pack" ? 42 : 36;
  const maxLabelLines = type === "pack" ? 3 : 2;

  const labelLineCount = Math.min(
    maxLabelLines,
    Math.max(1, Math.ceil(label.trim().length / labelCharsPerLine)),
  );
  const summaryLineCount = summary?.trim()
    ? Math.min(3, Math.ceil(summary.trim().length / summaryCharsPerLine))
    : 0;

  // Base = padding-top + icon-row(40) + gap(10) + 1-line-label(19) + mt-2(8) + 1-line-summary(20) + padding-bottom
  if (type === "pack") {
    return {
      width: 284,
      height: Math.max(148, 116 + labelLineCount * 19 + summaryLineCount * 20),
    };
  }

  if (type === "topic") {
    return {
      width: 248,
      height: Math.max(140, 112 + labelLineCount * 19 + summaryLineCount * 20),
    };
  }

  return {
    width: 240,
    height: Math.max(136, 110 + labelLineCount * 19 + summaryLineCount * 20),
  };
}

function formatEdgeLabel(label?: string) {
  if (!label) return "Linked";
  return label
    .replace(/_/g, " ")
    .replace(/\b\w/g, (value) => value.toUpperCase());
}

function getNodeSummary(node: MindMapNode, packName: string) {
  if (node.summary?.trim()) return node.summary.trim();
  if (node.type === "pack") return `${packName} is the root context that ties the full knowledge pack together.`;
  if (node.type === "topic") return "A synthesized theme connecting multiple source documents in this pack.";
  return "A source document contributing evidence to one or more themes in the pack.";
}

function polarToCartesian(radiusX: number, radiusY: number, angle: number) {
  return {
    x: Math.cos(angle) * radiusX,
    y: Math.sin(angle) * radiusY,
  };
}

function distributeAngles(count: number, startAngle = -Math.PI / 2) {
  if (count <= 0) return [];
  return Array.from({ length: count }, (_, index) => startAngle + (Math.PI * 2 * index) / count);
}

function getRelatedTopicIds(nodeId: string, edges: Edge[], topicIds: Set<string>) {
  return edges.reduce<string[]>((accumulator, edge) => {
    if (edge.source === nodeId && topicIds.has(edge.target)) accumulator.push(edge.target);
    if (edge.target === nodeId && topicIds.has(edge.source)) accumulator.push(edge.source);
    return accumulator;
  }, []);
}

function resolveNodeCollisions(nodes: MindMapFlowNode[]) {
  const positions = new Map(
    nodes.map((node) => {
      const { width, height } = getNodeDimensions(node.data.nodeType, node.data.label, node.data.summary);
      return [node.id, { x: node.position.x + width / 2, y: node.position.y + height / 2, width, height, type: node.data.nodeType }] as const;
    }),
  );

  for (let iteration = 0; iteration < 120; iteration += 1) {
    let moved = false;

    for (let index = 0; index < nodes.length; index += 1) {
      for (let innerIndex = index + 1; innerIndex < nodes.length; innerIndex += 1) {
        const a = positions.get(nodes[index].id);
        const b = positions.get(nodes[innerIndex].id);

        if (!a || !b) continue;

        const padding = a.type === "pack" || b.type === "pack" ? 56 : 44;
        const deltaX = b.x - a.x;
        const deltaY = b.y - a.y;
        const overlapX = a.width / 2 + b.width / 2 + padding - Math.abs(deltaX);
        const overlapY = a.height / 2 + b.height / 2 + padding - Math.abs(deltaY);

        if (overlapX <= 0 || overlapY <= 0) continue;

        moved = true;

        const moveHorizontally = overlapX < overlapY;
        const shift = (moveHorizontally ? overlapX : overlapY) / 2;
        const direction = moveHorizontally
          ? (deltaX === 0 ? (index % 2 === 0 ? 1 : -1) : Math.sign(deltaX))
          : (deltaY === 0 ? (innerIndex % 2 === 0 ? 1 : -1) : Math.sign(deltaY));

        const moveA = a.type === "pack" ? 0 : a.type === "topic" ? 0.4 : 0.7;
        const moveB = b.type === "pack" ? 0 : b.type === "topic" ? 0.4 : 0.7;

        if (moveHorizontally) {
          a.x -= shift * direction * moveA;
          b.x += shift * direction * moveB;
        } else {
          a.y -= shift * direction * moveA;
          b.y += shift * direction * moveB;
        }
      }
    }

    if (!moved) break;
  }

  return nodes.map((node) => {
    const position = positions.get(node.id);
    if (!position) return node;

    return {
      ...node,
      position: {
        x: position.x - position.width / 2,
        y: position.y - position.height / 2,
      },
    };
  });
}

function getLayoutedElements(
  inputNodes: MindMapFlowNode[],
  inputEdges: Edge[],
): { nodes: MindMapFlowNode[]; edges: Edge[] } {
  const packNode = inputNodes.find((node) => node.data.nodeType === "pack") ?? inputNodes[0];
  const topicNodes = inputNodes.filter((node) => node.data.nodeType === "topic");
  const fileNodes = inputNodes.filter((node) => node.data.nodeType === "file");
  const topicIdSet = new Set(topicNodes.map((node) => node.id));
  const positions = new Map<string, { x: number; y: number }>();

  if (packNode) {
    positions.set(packNode.id, { x: 0, y: 0 });
  }

  const topicAngles = distributeAngles(topicNodes.length, -Math.PI / 2);
  const topicOrbitX = topicNodes.length <= 2 ? 440 : 540;
  const topicOrbitY = topicNodes.length <= 2 ? 320 : 400;

  topicNodes.forEach((node, index) => {
    positions.set(node.id, polarToCartesian(topicOrbitX, topicOrbitY, topicAngles[index]));
  });

  const topicFileGroups = new Map<string, MindMapFlowNode[]>();
  const multiTopicFiles: Array<{ node: MindMapFlowNode; topicIds: string[] }> = [];
  const unassignedFiles: MindMapFlowNode[] = [];

  fileNodes.forEach((node) => {
    const relatedTopicIds = Array.from(new Set(getRelatedTopicIds(node.id, inputEdges, topicIdSet)));

    if (relatedTopicIds.length === 1) {
      const topicId = relatedTopicIds[0];
      const currentGroup = topicFileGroups.get(topicId) ?? [];
      currentGroup.push(node);
      topicFileGroups.set(topicId, currentGroup);
      return;
    }

    if (relatedTopicIds.length > 1) {
      multiTopicFiles.push({ node, topicIds: relatedTopicIds });
      return;
    }

    unassignedFiles.push(node);
  });

  topicNodes.forEach((topicNode, topicIndex) => {
    const relatedFiles = topicFileGroups.get(topicNode.id) ?? [];
    const topicPosition = positions.get(topicNode.id) ?? { x: 0, y: 0 };
    const baseAngle = topicAngles[topicIndex] ?? 0;
    const ringSize = 5;

    relatedFiles.forEach((fileNode, fileIndex) => {
      const ringIndex = Math.floor(fileIndex / ringSize);
      const positionInRing = fileIndex % ringSize;
      const itemsInRing = Math.min(ringSize, relatedFiles.length - ringIndex * ringSize);
      const spread = Math.max(Math.PI / 2, itemsInRing * 0.42);
      const startAngle = baseAngle - spread / 2;
      const ringAngles = itemsInRing === 1
        ? [baseAngle]
        : Array.from({ length: itemsInRing }, (_, index) => startAngle + (spread * index) / (itemsInRing - 1));
      const angle = ringAngles[positionInRing] ?? baseAngle;
      const orbitX = 310 + ringIndex * 90;
      const orbitY = 220 + ringIndex * 70;
      const offset = polarToCartesian(orbitX, orbitY, angle);
      positions.set(fileNode.id, {
        x: topicPosition.x + offset.x,
        y: topicPosition.y + offset.y,
      });
    });
  });

  const sharedAngles = distributeAngles(multiTopicFiles.length, -Math.PI / 2);
  multiTopicFiles.forEach(({ node, topicIds }, index) => {
    const anchors = topicIds
      .map((topicId) => positions.get(topicId))
      .filter((position): position is { x: number; y: number } => Boolean(position));

    if (!anchors.length) {
      return;
    }

    const centroid = anchors.reduce(
      (accumulator, position) => ({
        x: accumulator.x + position.x / anchors.length,
        y: accumulator.y + position.y / anchors.length,
      }),
      { x: 0, y: 0 },
    );

    const offset = polarToCartesian(120, 96, sharedAngles[index] ?? 0);
    positions.set(node.id, {
      x: centroid.x + offset.x,
      y: centroid.y + offset.y,
    });
  });

  const fallbackAngles = distributeAngles(unassignedFiles.length, Math.PI / 6);
  unassignedFiles.forEach((node, index) => {
    positions.set(node.id, polarToCartesian(660, 420, fallbackAngles[index] ?? 0));
  });

  const laidOutNodes = inputNodes.map((node) => {
    const position = positions.get(node.id) ?? { x: 0, y: 0 };
    const { width, height } = getNodeDimensions(node.data.nodeType, node.data.label, node.data.summary);

    return {
      ...node,
      position: {
        x: position.x - width / 2,
        y: position.y - height / 2,
      },
    };
  });

  return { nodes: resolveNodeCollisions(laidOutNodes), edges: inputEdges };
}

function KnowledgeNode({ data, selected }: NodeProps<MindMapFlowNode>) {
  const meta = getTypeMeta(data.nodeType);
  const Icon = meta.icon;
  const isActive = selected || data.highlighted;
  const opacity = data.dimmed ? 0.28 : 1;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: data.nodeType === "pack" ? 24 : 20,
        border: `1px solid ${
          isActive ? meta.accent : "var(--border-subtle)"
        }`,
        background: data.nodeType === "pack"
          ? `linear-gradient(145deg, rgba(242, 169, 59, 0.18), rgba(242, 169, 59, 0.05) 55%, rgba(16, 22, 29, 0.94))`
          : `linear-gradient(160deg, rgba(24, 33, 44, 0.96), rgba(11, 15, 20, 0.96))`,
        boxShadow: isActive
          ? `0 0 0 1.5px ${meta.accent}, 0 0 24px 2px ${meta.glow}, 0 22px 50px -28px ${meta.glow}`
          : `0 18px 40px -32px ${meta.glow}`,
        padding: data.nodeType === "pack" ? "18px 18px 16px" : "16px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 10,
        opacity,
        transition: "opacity 200ms ease, transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: data.nodeType === "pack" ? "rgba(11, 15, 20, 0.82)" : "rgba(255, 255, 255, 0.04)",
            color: meta.accent,
            border: `1px solid ${isActive ? meta.accent : "var(--border-subtle)"}`,
          }}
        >
          <Icon size={18} />
        </div>
        <span
          className="rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em]"
          style={{
            color: meta.accent,
            backgroundColor: data.nodeType === "pack" ? "rgba(11, 15, 20, 0.78)" : "rgba(255, 255, 255, 0.04)",
            border: `1px solid ${isActive ? meta.accent : "var(--border-subtle)"}`,
          }}
        >
          {meta.label}
        </span>
      </div>

      <div className="min-w-0">
        <div
          className="text-sm font-semibold"
          style={{
            color: "var(--text-1)",
            fontFamily: "var(--font-display)",
            display: "-webkit-box",
            WebkitLineClamp: data.nodeType === "pack" ? 3 : 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            wordBreak: "break-word",
            lineHeight: 1.35,
          }}
          title={data.label}
        >
          {data.label}
        </div>
        <div
          className="mt-2 text-[11px] leading-5"
          style={{
            color: data.nodeType === "file" ? "var(--text-3)" : "var(--text-2)",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            wordBreak: "break-word",
          }}
        >
          {data.summary}
        </div>
      </div>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  knowledgeNode: KnowledgeNode,
};

export default function MindMapView({ data, packName, compact = false }: MindMapViewProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const packNode = useMemo(
    () => data.nodes.find((node) => node.type === "pack") ?? data.nodes[0] ?? null,
    [data.nodes],
  );

  // IDs in the active neighbourhood (selected + its direct neighbours)
  const activeNeighbourhood = useMemo<Set<string>>(() => {
    if (!selectedNodeId) return new Set();
    const neighbours = new Set<string>([selectedNodeId]);
    data.edges.forEach((edge) => {
      if (edge.source === selectedNodeId) neighbours.add(edge.target);
      if (edge.target === selectedNodeId) neighbours.add(edge.source);
    });
    return neighbours;
  }, [selectedNodeId, data.edges]);

  const connectedEdgeIds = useMemo<Set<string>>(() => {
    if (!selectedNodeId) return new Set();
    const ids = new Set<string>();
    data.edges.forEach((e, i) => {
      if (e.source === selectedNodeId || e.target === selectedNodeId) {
        ids.add(`edge-${e.source}-${e.target}-${i}`);
      }
    });
    return ids;
  }, [selectedNodeId, data.edges]);

  const rawNodes = useMemo<MindMapFlowNode[]>(() => {
    if (!data.nodes?.length) return [];
    const hasSelection = activeNeighbourhood.size > 0;

    return data.nodes.map((node) => {
      const isInNeighbourhood = activeNeighbourhood.has(node.id);
      const isSelected = node.id === selectedNodeId;
      return {
        id: node.id,
        type: "knowledgeNode",
        position: { x: 0, y: 0 },
        draggable: false,
        selectable: true,
        data: {
          label: node.label,
          nodeType: node.type,
          summary: getNodeSummary(node, packName),
          highlighted: hasSelection && isInNeighbourhood && !isSelected,
          dimmed: hasSelection && !isInNeighbourhood,
        },
        style: {
          width: getNodeDimensions(node.type, node.label, getNodeSummary(node, packName)).width,
          height: getNodeDimensions(node.type, node.label, getNodeSummary(node, packName)).height,
          background: "transparent",
          border: "none",
        },
      };
    });
  }, [data.nodes, packName, activeNeighbourhood, selectedNodeId]);

  const rawEdges = useMemo<Edge[]>(() => {
    if (!data.edges?.length) return [];
    const hasSelection = connectedEdgeIds.size > 0;

    return data.edges.map((edge, index) => {
      const edgeId = `edge-${edge.source}-${edge.target}-${index}`;
      const isConnected = hasSelection && connectedEdgeIds.has(edgeId);
      const isDimmed = hasSelection && !isConnected;
      const accentColor = getTypeMeta(
        data.nodes.find((n) => n.id === edge.target)?.type ?? "file"
      ).accent;

      return {
        id: edgeId,
        source: edge.source,
        target: edge.target,
        type: "simplebezier",
        label: edge.label ? formatEdgeLabel(edge.label) : undefined,
        style: {
          stroke: isConnected ? accentColor : "rgba(255, 255, 255, 0.14)",
          strokeWidth: isConnected ? 2.2 : 1.6,
          opacity: isDimmed ? 0.15 : 1,
          transition: "stroke 200ms ease, opacity 200ms ease, stroke-width 200ms ease",
        },
        labelStyle: {
          fontSize: 10,
          fill: isDimmed ? "transparent" : "var(--text-3)",
          fontWeight: 500,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 15,
          height: 15,
          color: isConnected ? accentColor : "rgba(255, 255, 255, 0.18)",
        },
        animated: isConnected,
      };
    });
  }, [data.edges, data.nodes, connectedEdgeIds]);

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => (rawNodes.length ? getLayoutedElements(rawNodes, rawEdges) : { nodes: [], edges: [] }),
    [rawNodes, rawEdges],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedEdges, layoutedNodes, setEdges, setNodes]);

  const counts = useMemo(() => {
    const packCount = data.nodes.filter((node) => node.type === "pack").length;
    const topicCount = data.nodes.filter((node) => node.type === "topic").length;
    const fileCount = data.nodes.filter((node) => node.type === "file").length;

    return { packCount, topicCount, fileCount, edgeCount: data.edges.length };
  }, [data.edges.length, data.nodes]);

  if (!data.nodes?.length) {
    return (
      <div
        className="rounded-[28px] p-10"
        style={{
          background: "linear-gradient(180deg, rgba(16, 22, 29, 0.96), rgba(11, 15, 20, 0.96))",
          border: "1px solid var(--border-subtle)",
          boxShadow: "0 24px 60px -40px rgba(0, 0, 0, 0.8)",
        }}
      >
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-12 text-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              backgroundColor: "rgba(88, 184, 216, 0.08)",
              border: "1px solid rgba(88, 184, 216, 0.2)",
              color: "var(--accent-cyan)",
            }}
          >
            <Network size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              The map appears after processing
            </h3>
            <p className="mt-2 text-sm" style={{ color: "var(--text-3)" }}>
              Once SocietyOS finishes extracting topics and source relationships, this view will turn into a navigable map of the pack.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        .knowledge-map-canvas .react-flow__renderer {
          background: transparent;
        }

        .knowledge-map-canvas .react-flow__controls {
          border: 1px solid var(--border-default);
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 18px 40px -26px rgba(0, 0, 0, 0.9);
        }

        .knowledge-map-canvas .react-flow__controls-button {
          background: rgba(16, 22, 29, 0.96);
          border-bottom: 1px solid var(--border-subtle);
          color: var(--text-2);
        }

        .knowledge-map-canvas .react-flow__controls-button:hover {
          background: rgba(24, 33, 44, 0.96);
          color: var(--text-1);
        }

        .knowledge-map-canvas .react-flow__attribution {
          display: none;
        }

        .knowledge-map-canvas .react-flow__edge-text {
          font-family: var(--font-geist-sans), system-ui, sans-serif;
        }
      `}</style>

      <div className="grid gap-4">
        <section
          className="overflow-hidden rounded-[28px]"
          style={{
            background: "linear-gradient(180deg, rgba(16, 22, 29, 0.98), rgba(11, 15, 20, 0.98))",
            border: "1px solid var(--border-subtle)",
            boxShadow: "0 28px 70px -46px rgba(0, 0, 0, 0.9)",
          }}
        >
          <div
            className="flex flex-col gap-4 border-b px-5 py-5 sm:px-6"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 flex-1">
                <div
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em]"
                  style={{
                    color: "var(--accent-cyan)",
                    backgroundColor: "rgba(88, 184, 216, 0.08)",
                    border: "1px solid rgba(88, 184, 216, 0.18)",
                  }}
                >
                  <Sparkles size={12} />
                  Knowledge Topology
                </div>
                <h2 className="mt-3 text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                  {compact ? "Knowledge map" : "Follow how the pack is structured"}
                </h2>
                <p className="mt-2 max-w-xl text-sm" style={{ color: "var(--text-3)", overflowWrap: "anywhere" }}>
                  {compact
                    ? `A quick network view of ${packName}, its themes, and the source files behind them.`
                    : `The graph starts with ${packName}, branches into synthesized themes, then fans out into the source files backing each thread.`}
                </p>
              </div>

              <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: "Root", value: counts.packCount, color: "var(--accent-amber)" },
                  { label: "Themes", value: counts.topicCount, color: "var(--accent-cyan)" },
                  { label: "Files", value: counts.fileCount, color: "var(--text-2)" },
                  { label: "Links", value: counts.edgeCount, color: "var(--accent-emerald)" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl px-3 py-3"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid var(--border-subtle)",
                      minWidth: 0,
                    }}
                  >
                    <div className="truncate text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--text-3)" }}>
                      {item.label}
                    </div>
                    <div className="mt-2 text-lg font-semibold tabular-nums" style={{ color: item.color }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs" style={{ color: "var(--text-2)" }}>
              {[
                { type: "pack", text: "Pack node anchors the map" },
                { type: "topic", text: "Themes group related context" },
                { type: "file", text: "Files show where evidence comes from" },
              ].map((item) => {
                const meta = getTypeMeta(item.type);
                return (
                  <div
                    key={item.type}
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: meta.accent }}
                    />
                    {item.text}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="knowledge-map-canvas relative" style={{ height: compact ? 520 : 700 }}>
            <div
              className="absolute inset-0"
              style={{
                background: "radial-gradient(circle at top left, rgba(242, 169, 59, 0.08), transparent 28%), radial-gradient(circle at bottom right, rgba(88, 184, 216, 0.08), transparent 30%)",
              }}
            />
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={(_, node) => setSelectedNodeId(node.id)}
              onPaneClick={() => setSelectedNodeId(packNode?.id ?? null)}
              fitView
              fitViewOptions={{ padding: 0.22, minZoom: 0.6, maxZoom: 1.15 }}
              minZoom={0.45}
              maxZoom={1.5}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable
              proOptions={{ hideAttribution: true }}
              style={{ backgroundColor: "transparent" }}
              defaultEdgeOptions={{ zIndex: 0 }}
            >
              <Background color="rgba(255, 255, 255, 0.05)" gap={28} size={1.2} />
              <MiniMap
                pannable
                zoomable
                style={{
                  backgroundColor: "rgba(16, 22, 29, 0.94)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 18,
                }}
                nodeColor={(node) => getTypeMeta((node.data as MindMapNodeData).nodeType).accent}
                maskColor="rgba(11, 15, 20, 0.72)"
              />
              <Controls showInteractive={false} position="bottom-left" />
              <Panel position="top-left">
                <div
                  className="max-w-xs rounded-2xl px-3.5 py-3 text-xs"
                  style={{
                    backgroundColor: "rgba(16, 22, 29, 0.92)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-2)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div className="flex items-center gap-2" style={{ color: "var(--text-1)" }}>
                    <MousePointerClick size={14} style={{ color: "var(--accent-amber)" }} />
                    Select any node for context
                  </div>
                  <div className="mt-1.5 leading-5" style={{ color: "var(--text-3)" }}>
                    {compact
                      ? "Pan and zoom to explore the map. Click any node to inspect its connections below."
                      : "Pan to explore clusters, zoom for detail, and click the canvas to recenter attention on the pack root."}
                  </div>
                </div>
              </Panel>
            </ReactFlow>
          </div>
        </section>
      </div>
    </>
  );
}
