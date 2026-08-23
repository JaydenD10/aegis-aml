'use client'

import React, { useCallback, useState } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Edge,
  Node,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useRouter } from 'next/navigation';

// Clean light-mode liquid glass colors
const COLORS = {
  centralNodeBg:    '#FEE2E2',
  centralNodeBorder:'#EF4444',
  centralNodeText:  '#991B1B',
  centralNodeGlow:  '0 4px 14px rgba(239,68,68,0.25)',
  peerNodeBg:       '#EFF6FF',
  peerNodeBorder:   '#93C5FD',
  peerNodeText:     '#1E40AF',
  fraudEdge:        '#EF4444',
  normalEdge:       '#93C5FD',
  graphBg:          '#F8FAFC',
  controlsBg:       '#FFFFFF',
  panelBg:          'rgba(255, 255, 255, 0.85)',
  panelBorder:      'rgba(226, 232, 240, 0.9)',
  panelText:        '#0F172A',
  panelTextMuted:   '#64748B',
  panelTextLabel:   '#94A3B8',
}

export default function NetworkGraph({ initialNodes, initialEdges, centralAccountId }: {
  initialNodes: any[],
  initialEdges: any[],
  centralAccountId?: string
}) {
  const router = useRouter();

  const formattedNodes: Node[] = initialNodes.map(n => ({
    id: n.id,
    position: {
      x: n.data.isCentral ? 400 : Math.random() * 800,
      y: n.data.isCentral ? 300 : Math.random() * 600
    },
    data: {
      label: (
        <div className="flex flex-col items-center justify-center font-mono">
          <div className="text-[11px] font-bold">{n.data.label}</div>
        </div>
      )
    },
    style: {
      background: n.data.isCentral ? COLORS.centralNodeBg : COLORS.peerNodeBg,
      color: n.data.isCentral ? COLORS.centralNodeText : COLORS.peerNodeText,
      border: `1.5px solid ${n.data.isCentral ? COLORS.centralNodeBorder : COLORS.peerNodeBorder}`,
      borderRadius: '12px',
      padding: '8px',
      boxShadow: n.data.isCentral ? COLORS.centralNodeGlow : '0 2px 6px rgba(15,23,42,0.04)',
      width: 110,
      fontSize: 12,
    }
  }));

  const formattedEdges: Edge[] = initialEdges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    animated: e.fraud,
    style: {
      stroke: e.fraud ? COLORS.fraudEdge : COLORS.normalEdge,
      strokeWidth: e.fraud ? 2.5 : 1.5
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: e.fraud ? COLORS.fraudEdge : COLORS.normalEdge,
    },
    label: e.amount ? `$${Number(e.amount).toFixed(0)}` : '',
    labelStyle: { fill: '#475569', fontSize: 10, fontWeight: 600 },
    labelBgStyle: { fill: '#FFFFFF', fillOpacity: 0.95 }
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(formattedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(formattedEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const fraudEdges   = edges.filter(e => (e as any).animated).length;
  const normalEdges  = edges.length - fraudEdges;

  return (
    <div className="flex h-[700px] gap-0">
      {/* Graph canvas */}
      <div className="flex-1 overflow-hidden relative" style={{ background: COLORS.graphBg }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background color="rgba(148, 163, 184, 0.2)" gap={24} size={1} />
          <Controls
            style={{
              background: COLORS.controlsBg,
              border: '1px solid rgba(226, 232, 240, 0.9)',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(15,23,42,0.06)',
            }}
          />
        </ReactFlow>
      </div>

      {/* Side panel */}
      <div
        className="w-72 flex flex-col shrink-0 backdrop-blur-xl"
        style={{ background: COLORS.panelBg, borderLeft: `1px solid ${COLORS.panelBorder}` }}
      >
        {/* Panel header */}
        <div className="px-4 py-3.5" style={{ borderBottom: `1px solid ${COLORS.panelBorder}` }}>
          <div className="text-[10px] font-bold uppercase tracking-wider mb-2 text-slate-400">
            Graph Stats
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Nodes',   value: nodes.length },
              { label: 'Edges',   value: edges.length },
              { label: 'Fraud',   value: fraudEdges   },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl p-2 text-center bg-white/90 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="text-xs font-bold font-mono text-slate-900">{value}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider mt-0.5 text-slate-400">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${COLORS.panelBorder}` }}>
          <div className="text-[10px] font-bold uppercase tracking-wider mb-2 text-slate-400">Legend</div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-md shrink-0" style={{ background: COLORS.centralNodeBg, border: `1px solid ${COLORS.centralNodeBorder}` }} />
              <span className="text-[11px] font-medium text-slate-700">Central account</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-md shrink-0" style={{ background: COLORS.peerNodeBg, border: `1px solid ${COLORS.peerNodeBorder}` }} />
              <span className="text-[11px] font-medium text-slate-700">Peer account</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 shrink-0" style={{ background: COLORS.fraudEdge }} />
              <span className="text-[11px] font-medium text-slate-700">Fraud transaction</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 shrink-0" style={{ background: COLORS.normalEdge }} />
              <span className="text-[11px] font-medium text-slate-700">Normal transaction</span>
            </div>
          </div>
        </div>

        {/* Node intelligence */}
        <div className="px-4 py-3.5 flex-1 overflow-y-auto">
          <div className="text-[10px] font-bold uppercase tracking-wider mb-3 text-slate-400">
            Node Intelligence
          </div>
          {selectedNode ? (
            <div className="space-y-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-1 text-slate-400">Account ID</div>
                <div className="text-lg font-bold font-mono text-slate-900">{selectedNode.id}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-200/80">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-1 text-slate-400">In-Degree</div>
                  <div className="text-sm font-bold font-mono text-slate-900">
                    {edges.filter(e => e.target === selectedNode.id).length}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-1 text-slate-400">Out-Degree</div>
                  <div className="text-sm font-bold font-mono text-slate-900">
                    {edges.filter(e => e.source === selectedNode.id).length}
                  </div>
                </div>
              </div>
              <div className="pt-3 space-y-2 border-t border-slate-200/80">
                <button
                  onClick={() => router.push(`/accounts/${selectedNode.id}`)}
                  className="w-full py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
                >
                  Open Profile
                </button>
                <button
                  onClick={() => router.push(`/network/${selectedNode.id}`)}
                  className="w-full py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
                >
                  Center Graph Here
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xs font-medium text-center py-8 text-slate-400">
              Click a node to view account intelligence.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
