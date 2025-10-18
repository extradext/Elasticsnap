# FlowSpeak - Complete Expo Snack Code

Copy each file below into Expo Snack (https://snack.expo.dev/)

---

## 📦 Required Dependencies

Add these to your Expo Snack dependencies:

```json
{
  "dependencies": {
    "zustand": "5.0.8",
    "react-native-mmkv": "3.3.3",
    "react-native-gesture-handler": "2.24.0",
    "react-native-reanimated": "3.17.4",
    "react-native-svg": "15.14.0",
    "@react-navigation/native": "7.1.6",
    "expo-constants": "17.1.7"
  }
}
```

---

## 📁 File Structure

```
/
├── App.tsx (entry point)
├── store/
│   └── flowStore.ts
└── components/
    ├── FlowCanvasV2.tsx
    ├── FlowNodeV2.tsx
    ├── CreateChildModal.tsx
    ├── TextInputModal.tsx
    └── NodeDetailSheet.tsx
```

---

## 1. App.tsx (Main Entry Point)

```tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';
import FlowCanvasV2 from './components/FlowCanvasV2';
import TextInputModal from './components/TextInputModal';
import NodeDetailSheet from './components/NodeDetailSheet';
import { useFlowStore } from './store/flowStore';

export default function App() {
  const { 
    nodes, 
    selectedNodeId, 
    loadFromStorage, 
    addNode, 
    createNodesFromText,
    undo,
    redo,
    historyIndex,
    history
  } = useFlowStore();
  
  const [textModalVisible, setTextModalVisible] = useState(false);
  const [textModalMode, setTextModalMode] = useState<'single' | 'multiple'>('single');
  const [detailSheetVisible, setDetailSheetVisible] = useState(false);

  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    if (selectedNodeId) {
      setDetailSheetVisible(true);
    }
  }, [selectedNodeId]);

  const handleCreateSingleNode = (text: string) => {
    addNode({
      type: 'task',
      label: text,
      x: 200,
      y: 200,
      width: 160,
      height: 80,
      color: '#00A65A',
      locked: false
    });
  };

  const handleCreateMultipleNodes = (text: string) => {
    createNodesFromText(text);
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0c0c0c" />
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logo}>
              <MaterialIcons name="account-tree" size={24} color="#00A65A" />
            </View>
            <Text style={styles.title}>FlowSpeak</Text>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={[styles.iconButton, !canUndo && styles.disabledButton]}
              onPress={undo}
              disabled={!canUndo}
            >
              <MaterialIcons name="undo" size={20} color={canUndo ? "#fff" : "#444"} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.iconButton, !canRedo && styles.disabledButton]}
              onPress={redo}
              disabled={!canRedo}
            >
              <MaterialIcons name="redo" size={20} color={canRedo ? "#fff" : "#444"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Canvas */}
        <FlowCanvasV2 />

        {/* Bottom Action Bar */}
        <View style={styles.bottomBar}>
          <View style={styles.nodeCount}>
            <MaterialIcons name="widgets" size={16} color="#888" />
            <Text style={styles.nodeCountText}>{nodes.length} nodes</Text>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setTextModalMode('single');
                setTextModalVisible(true);
              }}
            >
              <MaterialIcons name="add-box" size={24} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => {
                setTextModalMode('multiple');
                setTextModalVisible(true);
              }}
            >
              <MaterialIcons name="text-fields" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Modals */}
        <TextInputModal
          visible={textModalVisible}
          onClose={() => setTextModalVisible(false)}
          onSubmit={textModalMode === 'single' ? handleCreateSingleNode : handleCreateMultipleNodes}
          title={textModalMode === 'single' ? 'Create Node' : 'Create Flow from Text'}
          placeholder={
            textModalMode === 'single' 
              ? 'Enter node label...'
              : 'Enter each step on a new line...\n\nExample:\nStart process\nCheck condition?\nExecute action\nFinish'
          }
          multiline={textModalMode === 'multiple'}
        />

        <NodeDetailSheet
          visible={detailSheetVisible}
          node={selectedNode}
          onClose={() => {
            setDetailSheetVisible(false);
            useFlowStore.getState().selectNode(null);
          }}
        />

        {/* Floating Help */}
        {nodes.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="touch-app" size={48} color="#444" />
            <Text style={styles.emptyStateTitle}>Start Creating</Text>
            <Text style={styles.emptyStateText}>
              Tap the + button to create a parent node{"\n"}
              Then tap any node to spawn connected children{"\n"}
              Long-press to connect, double-tap to recolor
            </Text>
          </View>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  logo: {
    marginRight: 8
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff'
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#2a2a2a'
  },
  disabledButton: {
    opacity: 0.3
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a'
  },
  nodeCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  nodeCountText: {
    color: '#888',
    fontSize: 14
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8
  },
  primaryButton: {
    backgroundColor: '#00A65A'
  },
  emptyState: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 32
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8
  },
  emptyStateText: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    lineHeight: 20
  }
});
```

---

## 2. store/flowStore.ts

```typescript
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
  parentId?: string | null;
  isParent?: boolean;
  velocityX?: number;
  velocityY?: number;
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
  addChildNode: (parentId: string, node: Omit<NodeData, 'id' | 'tabs' | 'parentId'>) => void;
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
      locked: false,
      isParent: true,
      parentId: null,
      velocityX: 0,
      velocityY: 0
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

  addChildNode: (parentId, nodeData) => {
    const parent = get().nodes.find(n => n.id === parentId);
    if (!parent) return;
    
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
    
    const childX = parent.x + parent.width + 60;
    const childY = parent.y + 40;
    
    const newNode: NodeData = {
      ...nodeData,
      id,
      tabs: [defaultTab],
      x: childX,
      y: childY,
      color: nodeData.color || defaultNodeColors[nodeData.type],
      locked: false,
      isParent: false,
      parentId: parentId,
      velocityX: 0,
      velocityY: 0
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
    
    get().addConnection(parentId, id);
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
    
    if (lines.length > 1) {
      const nodeIds = state.nodes.slice(-lines.length).map(n => n.id);
      for (let i = 0; i < nodeIds.length - 1; i++) {
        state.addConnection(nodeIds[i], nodeIds[i + 1]);
      }
    }
  }
}));
```

---

## 3. components/FlowCanvasV2.tsx

```typescript
import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle,
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import Svg, { Path, Defs, Marker, Circle } from 'react-native-svg';
import { useFlowStore } from '../store/flowStore';
import FlowNodeV2 from './FlowNodeV2';
import CreateChildModal from './CreateChildModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CANVAS_SPRING = {
  damping: 25,
  stiffness: 120,
  mass: 1.2
};

export default function FlowCanvasV2() {
  const { 
    nodes, 
    connections, 
    scale, 
    offsetX, 
    offsetY, 
    setScale, 
    setOffset, 
    selectNode,
    addChildNode
  } = useFlowStore();
  
  const translateX = useSharedValue(offsetX);
  const translateY = useSharedValue(offsetY);
  const scaleValue = useSharedValue(scale);
  
  const savedScale = useSharedValue(scale);
  const savedTranslateX = useSharedValue(offsetX);
  const savedTranslateY = useSharedValue(offsetY);
  
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [createChildModalVisible, setCreateChildModalVisible] = useState(false);
  const [parentIdForChild, setParentIdForChild] = useState<string | null>(null);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      runOnJS(setOffset)(translateX.value, translateY.value);
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const newScale = savedScale.value * e.scale;
      scaleValue.value = Math.max(0.1, Math.min(2, newScale));
    })
    .onEnd(() => {
      savedScale.value = scaleValue.value;
      runOnJS(setScale)(scaleValue.value);
    });

  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      runOnJS(selectNode)(null);
    });

  const composed = Gesture.Simultaneous(panGesture, pinchGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scaleValue.value }
    ]
  }));

  const handleNodeLongPress = (nodeId: string) => {
    setConnectingFrom(nodeId);
  };

  const handleNodePress = (nodeId: string) => {
    if (connectingFrom) {
      if (connectingFrom !== nodeId) {
        useFlowStore.getState().addConnection(connectingFrom, nodeId);
      }
      setConnectingFrom(null);
    } else {
      selectNode(nodeId);
    }
  };

  const handleCreateChild = (parentId: string) => {
    setParentIdForChild(parentId);
    setCreateChildModalVisible(true);
  };

  const handleSubmitChild = (parentId: string, label: string, type: 'task' | 'decision') => {
    addChildNode(parentId, {
      type,
      label,
      x: 0,
      y: 0,
      width: 140,
      height: 70,
      color: '',
      locked: false
    });
  };

  const generateConnectionPath = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    
    const controlPoint1X = x1 + dx * 0.2;
    const controlPoint1Y = y1 + Math.abs(dy) * 0.3;
    const controlPoint2X = x2 - dx * 0.2;
    const controlPoint2Y = y2 - Math.abs(dy) * 0.3;
    
    return `M ${x1} ${y1} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${x2} ${y2}`;
  };

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composed}>
        <Animated.View style={[styles.canvas, animatedStyle]}>
          <Svg width={SCREEN_WIDTH * 4} height={SCREEN_HEIGHT * 4} style={styles.svg}>
            <Defs>
              <Marker
                id="arrowhead"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <Path d="M 0 0 L 10 5 L 0 10 z" fill="#888" />
              </Marker>
            </Defs>
            
            {connections.map(conn => {
              const fromNode = nodes.find(n => n.id === conn.from);
              const toNode = nodes.find(n => n.id === conn.to);
              
              if (!fromNode || !toNode) return null;
              
              const x1 = fromNode.x + fromNode.width / 2;
              const y1 = fromNode.y + fromNode.height;
              const x2 = toNode.x + toNode.width / 2;
              const y2 = toNode.y;
              
              return (
                <Path
                  key={conn.id}
                  d={generateConnectionPath(x1, y1, x2, y2)}
                  stroke="#888"
                  strokeWidth="3"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                  strokeLinecap="round"
                />
              );
            })}
            
            {connectingFrom && (
              <Circle
                cx={nodes.find(n => n.id === connectingFrom)?.x || 0}
                cy={nodes.find(n => n.id === connectingFrom)?.y || 0}
                r="15"
                stroke="#FFD700"
                strokeWidth="3"
                fill="none"
                opacity="0.6"
              />
            )}
          </Svg>
          
          {nodes.map(node => (
            <FlowNodeV2
              key={node.id}
              node={node}
              isConnecting={connectingFrom === node.id}
              onPress={handleNodePress}
              onLongPress={handleNodeLongPress}
              onCreateChild={handleCreateChild}
            />
          ))}
        </Animated.View>
      </GestureDetector>

      <CreateChildModal
        visible={createChildModalVisible}
        parentId={parentIdForChild}
        onClose={() => setCreateChildModalVisible(false)}
        onSubmit={handleSubmitChild}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a'
  },
  canvas: {
    width: SCREEN_WIDTH * 4,
    height: SCREEN_HEIGHT * 4
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0
  }
});
```

---

## 4. components/FlowNodeV2.tsx

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import { NodeData, useFlowStore } from '../store/flowStore';
import { MaterialIcons } from '@expo/vector-icons';

interface FlowNodeV2Props {
  node: NodeData;
  isConnecting: boolean;
  onPress: (id: string) => void;
  onLongPress: (id: string) => void;
  onCreateChild: (parentId: string) => void;
}

const SPRING_CONFIG = {
  damping: 20,
  stiffness: 150,
  mass: 1,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

export default function FlowNodeV2({ 
  node, 
  isConnecting, 
  onPress, 
  onLongPress,
  onCreateChild 
}: FlowNodeV2Props) {
  const { updateNode, selectedNodeId } = useFlowStore();
  const [recolorMode, setRecolorMode] = useState(false);
  
  const translateX = useSharedValue(node.x);
  const translateY = useSharedValue(node.y);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  
  const savedTranslateX = useSharedValue(node.x);
  const savedTranslateY = useSharedValue(node.y);

  const isSelected = selectedNodeId === node.id;

  useEffect(() => {
    translateX.value = withSpring(node.x, SPRING_CONFIG);
    translateY.value = withSpring(node.y, SPRING_CONFIG);
    savedTranslateX.value = node.x;
    savedTranslateY.value = node.y;
  }, [node.x, node.y]);

  const dragGesture = Gesture.Pan()
    .onStart(() => {
      scale.value = withSpring(1.08, { damping: 15, stiffness: 300 });
      rotation.value = withSpring(Math.random() * 4 - 2, SPRING_CONFIG);
    })
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      scale.value = withSpring(1, SPRING_CONFIG);
      rotation.value = withSpring(0, SPRING_CONFIG);
      
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      
      runOnJS(updateNode)(node.id, { 
        x: translateX.value, 
        y: translateY.value 
      });
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      scale.value = withSpring(1.15, { damping: 10, stiffness: 200 });
    })
    .onEnd(() => {
      scale.value = withSpring(1, SPRING_CONFIG);
      runOnJS(onLongPress)(node.id);
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withTiming(1.2, { duration: 100 }, () => {
        scale.value = withSpring(1, SPRING_CONFIG);
      });
      runOnJS(setRecolorMode)(!recolorMode);
    });

  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      scale.value = withTiming(0.95, { duration: 50 }, () => {
        scale.value = withSpring(1, SPRING_CONFIG);
      });
      runOnJS(onPress)(node.id);
    });

  const composed = Gesture.Exclusive(
    doubleTapGesture,
    longPressGesture,
    tapGesture,
    dragGesture
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` }
    ]
  }));

  const nodeShape = node.type === 'decision' ? styles.diamond : styles.rectangle;
  
  const colors = ['#00A65A', '#FF9800', '#2196F3', '#E91E63', '#9C27B0', '#F44336'];

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={[
          styles.nodeContainer,
          animatedStyle,
          { width: node.width, height: node.height }
        ]}
      >
        <View
          style={[
            styles.node,
            nodeShape,
            { 
              backgroundColor: node.color, 
              borderColor: isSelected ? '#FFD700' : isConnecting ? '#FFD700' : node.color,
              borderWidth: isSelected ? 3 : isConnecting ? 3 : 2
            }
          ]}
        >
          <Text style={styles.nodeLabel} numberOfLines={2}>
            {node.label}
          </Text>
          
          {isSelected && (
            <TouchableOpacity
              style={styles.createChildButton}
              onPress={() => onCreateChild(node.id)}
            >
              <MaterialIcons name="add-circle" size={20} color="#FFD700" />
            </TouchableOpacity>
          )}
          
          {node.tabs.length > 1 && (
            <View style={styles.tabIndicator}>
              <MaterialIcons name="layers" size={12} color="#fff" />
              <Text style={styles.tabCount}>{node.tabs.length}</Text>
            </View>
          )}
          
          {node.locked && (
            <View style={styles.lockIcon}>
              <MaterialIcons name="lock" size={14} color="#fff" />
            </View>
          )}
          
          {node.isParent && (
            <View style={styles.parentBadge}>
              <MaterialIcons name="account-tree" size={10} color="#fff" />
            </View>
          )}
        </View>
        
        {recolorMode && (
          <View style={styles.colorPicker}>
            {colors.map(color => (
              <TouchableOpacity
                key={color}
                style={[styles.colorOption, { backgroundColor: color }]}
                onPress={() => {
                  updateNode(node.id, { color });
                  setRecolorMode(false);
                }}
              />
            ))}
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  nodeContainer: {
    position: 'absolute'
  },
  node: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8
  },
  rectangle: {
    borderRadius: 12
  },
  diamond: {
    borderRadius: 12,
    transform: [{ rotate: '45deg' }]
  },
  nodeLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center'
  },
  createChildButton: {
    position: 'absolute',
    bottom: -12,
    right: -12,
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700'
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2
  },
  tabCount: {
    color: '#fff',
    fontSize: 10,
    marginLeft: 2,
    fontWeight: '600'
  },
  lockIcon: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 10,
    padding: 3
  },
  parentBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,168,90,0.8)',
    borderRadius: 8,
    padding: 2
  },
  colorPicker: {
    position: 'absolute',
    top: -48,
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5
  },
  colorOption: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginHorizontal: 3,
    borderWidth: 2,
    borderColor: '#fff'
  }
});
```

---

## 5. components/CreateChildModal.tsx

(Use the code already shown in previous view)

## 6. components/TextInputModal.tsx

(Use the code already shown in previous view)

## 7. components/NodeDetailSheet.tsx

(Use the code already shown in previous view)

---

## 🚀 Setup Instructions for Expo Snack:

1. Go to https://snack.expo.dev/
2. Create a new Snack
3. Install dependencies listed at top
4. Create folder structure: `store/` and `components/`
5. Copy each file into its respective location
6. Rename the default `App.js` to `App.tsx` and paste the App.tsx code
7. Run on device via Expo Go or web preview

---

## 📱 How to Use:

**Create Parent Nodes:**
- Tap the **+** button (bottom right) → Enter label → Creates independent parent node

**Create Child Nodes:**
- Tap any node → **Golden +** button appears → Opens modal → Enter child label → Auto-connected

**Interact with Nodes:**
- **Drag**: Move nodes (smooth spring physics, wiggle effect)
- **Double-tap**: Open color picker
- **Long-press**: Enter connection mode (golden ring appears)
- **Tap another node while connecting**: Creates connection
- **Single tap**: Select node → Opens detail sheet

**Gestures:**
- **Pinch**: Zoom in/out
- **Two-finger drag**: Pan canvas
- **Tap empty space**: Deselect

---

## ✨ Key Features to Test:

1. **Organic motion** - Every interaction should feel smooth and springy
2. **Node hierarchy** - Parent nodes (green badge) vs child nodes
3. **Elastic connections** - Curved bezier lines, not straight
4. **Tactile feedback** - Nodes bounce, wiggle, scale on touch
5. **Natural growth** - Children spawn relative to parents

---

Enjoy testing FlowSpeak! 🎉
