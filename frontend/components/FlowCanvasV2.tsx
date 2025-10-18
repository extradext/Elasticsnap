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

// Spring config for organic canvas movement
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

  // Pan gesture for canvas
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      // Smooth spring to final position
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      runOnJS(setOffset)(translateX.value, translateY.value);
    });

  // Pinch gesture for zoom with spring
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const newScale = savedScale.value * e.scale;
      scaleValue.value = Math.max(0.1, Math.min(2, newScale));
    })
    .onEnd(() => {
      savedScale.value = scaleValue.value;
      runOnJS(setScale)(scaleValue.value);
    });

  // Tap to deselect
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
      x: 0, // Will be calculated in store
      y: 0,
      width: 140,
      height: 70,
      color: '',
      locked: false
    });
  };

  // Generate smooth bezier curve for connections (elastic effect)
  const generateConnectionPath = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    
    // Control points for smooth elastic curve
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
            
            {/* Connection indicator during connecting mode */}
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
