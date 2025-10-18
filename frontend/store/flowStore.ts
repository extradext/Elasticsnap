import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

export type NodeType = 'task' | 'decision' | 'custom';

export interface TabContent {
  id: string;
  type: 'text' | 'media' | 'link' | 'file' | 'subflow';
  content: string;
  subtabs?: TabContent[];
}

export interface NodeTab {
  id: string;
  label: string;
  content: TabContent[];
}

export interface NodeData {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  locked: boolean;
  lockTimer?: number;
  tabs: NodeTab[];
  fields?: Record<string, any>;
}

export interface Connection {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface FlowState {
  nodes: NodeData[];
  connections: Connection[];
  selectedNodeId: string | null;
  scale: number;
  offsetX: number;
  offsetY: number;
  history: { nodes: NodeData[]; connections: Connection[] }[];
  historyIndex: number;
  
  // Actions
  addNode: (node: Omit<NodeData, 'id' | 'tabs'>) => void;
  updateNode: (id: string, updates: Partial<NodeData>) => void;
  deleteNode: (id: string) => void;
  addConnection: (from: string, to: string) => void;
  deleteConnection: (id: string) => void;
  selectNode: (id: string | null) => void;
  setScale: (scale: number) => void;
  setOffset: (x: number, y: number) => void;
  addNodeTab: (nodeId: string, label: string) => void;
  updateNodeTab: (nodeId: string, tabId: string, updates: Partial<NodeTab>) => void;
  undo: () => void;
  redo: () => void;
  saveToStorage: () => void;
  loadFromStorage: () => void;
  createNodesFromText: (text: string) => void;
}

const defaultNodeColors = {
  task: '#00A65A',
  decision: '#FF9800',
  custom: '#2196F3'
};

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  connections: [],
  selectedNodeId: null,
  scale: 0.45,
  offsetX: 0,
  offsetY: 0,
  history: [],
  historyIndex: -1,

  addNode: (nodeData) => {
    const id = Date.now().toString();
    const defaultTab: NodeTab = {
      id: `tab-${id}-1`,
      label: 'Main',
      content: [{
        id: `content-${id}-1`,
        type: 'text',
        content: nodeData.label
      }]
    };
    
    const newNode: NodeData = {
      ...nodeData,
      id,
      tabs: [defaultTab],
      color: nodeData.color || defaultNodeColors[nodeData.type],
      locked: false
    };
    
    set((state) => {
      const newNodes = [...state.nodes, newNode];
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({ nodes: newNodes, connections: state.connections });
      
      return {
        nodes: newNodes,
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    });
    get().saveToStorage();
  },

  updateNode: (id, updates) => {
    set((state) => {
      const newNodes = state.nodes.map(node => 
        node.id === id ? { ...node, ...updates } : node
      );
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({ nodes: newNodes, connections: state.connections });
      
      return {
        nodes: newNodes,
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    });
    get().saveToStorage();
  },

  deleteNode: (id) => {
    set((state) => {
      const newNodes = state.nodes.filter(node => node.id !== id);
      const newConnections = state.connections.filter(
        conn => conn.from !== id && conn.to !== id
      );
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({ nodes: newNodes, connections: newConnections });
      
      return {
        nodes: newNodes,
        connections: newConnections,
        selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    });
    get().saveToStorage();
  },

  addConnection: (from, to) => {
    const id = `${from}-${to}`;
    set((state) => {
      const exists = state.connections.some(conn => conn.from === from && conn.to === to);
      if (exists) return state;
      
      const newConnections = [...state.connections, { id, from, to }];
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({ nodes: state.nodes, connections: newConnections });
      
      return {
        connections: newConnections,
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    });
    get().saveToStorage();
  },

  deleteConnection: (id) => {
    set((state) => {
      const newConnections = state.connections.filter(conn => conn.id !== id);
      return { connections: newConnections };
    });
    get().saveToStorage();
  },

  selectNode: (id) => set({ selectedNodeId: id }),

  setScale: (scale) => set({ scale: Math.max(0.1, Math.min(2, scale)) }),

  setOffset: (x, y) => set({ offsetX: x, offsetY: y }),

  addNodeTab: (nodeId, label) => {
    set((state) => {
      const newNodes = state.nodes.map(node => {
        if (node.id === nodeId) {
          const newTab: NodeTab = {
            id: `tab-${nodeId}-${Date.now()}`,
            label,
            content: [{
              id: `content-${Date.now()}`,
              type: 'text',
              content: ''
            }]
          };
          return { ...node, tabs: [...node.tabs, newTab] };
        }
        return node;
      });
      return { nodes: newNodes };
    });
    get().saveToStorage();
  },

  updateNodeTab: (nodeId, tabId, updates) => {
    set((state) => {
      const newNodes = state.nodes.map(node => {
        if (node.id === nodeId) {
          const newTabs = node.tabs.map(tab => 
            tab.id === tabId ? { ...tab, ...updates } : tab
          );
          return { ...node, tabs: newTabs };
        }
        return node;
      });
      return { nodes: newNodes };
    });
    get().saveToStorage();
  },

  undo: () => {
    set((state) => {
      if (state.historyIndex > 0) {
        const newIndex = state.historyIndex - 1;
        const historyState = state.history[newIndex];
        return {
          nodes: historyState.nodes,
          connections: historyState.connections,
          historyIndex: newIndex
        };
      }
      return state;
    });
  },

  redo: () => {
    set((state) => {
      if (state.historyIndex < state.history.length - 1) {
        const newIndex = state.historyIndex + 1;
        const historyState = state.history[newIndex];
        return {
          nodes: historyState.nodes,
          connections: historyState.connections,
          historyIndex: newIndex
        };
      }
      return state;
    });
  },

  saveToStorage: () => {
    const state = get();
    storage.set('flowspeak.nodes', JSON.stringify(state.nodes));
    storage.set('flowspeak.connections', JSON.stringify(state.connections));
  },

  loadFromStorage: () => {
    const nodesJson = storage.getString('flowspeak.nodes');
    const connectionsJson = storage.getString('flowspeak.connections');
    
    if (nodesJson && connectionsJson) {
      const nodes = JSON.parse(nodesJson);
      const connections = JSON.parse(connectionsJson);
      set({ 
        nodes, 
        connections,
        history: [{ nodes, connections }],
        historyIndex: 0
      });
    }
  },

  createNodesFromText: (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const state = get();
    
    let startY = 100;
    const startX = 150;
    const spacing = 120;
    
    lines.forEach((line, index) => {
      const isDecision = line.toLowerCase().includes('?') || line.toLowerCase().includes('if');
      const type: NodeType = isDecision ? 'decision' : 'task';
      
      state.addNode({
        type,
        label: line.trim(),
        x: startX,
        y: startY + (index * spacing),
        width: 160,
        height: 80,
        color: defaultNodeColors[type],
        locked: false
      });
    });
    
    // Auto-connect sequential nodes
    if (lines.length > 1) {
      const nodeIds = state.nodes.slice(-lines.length).map(n => n.id);
      for (let i = 0; i < nodeIds.length - 1; i++) {
        state.addConnection(nodeIds[i], nodeIds[i + 1]);
      }
    }
  }
}));