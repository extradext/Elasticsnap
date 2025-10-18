import React, { useRef, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Line, G } from 'react-native-svg';
import { useFlowStore } from '../store/flowStore';
import FlowNode from './FlowNode';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function FlowCanvas() {
  const { nodes, connections, scale, offsetX, offsetY, setScale, setOffset, selectNode } = useFlowStore();
  
  const translateX = useSharedValue(offsetX);
  const translateY = useSharedValue(offsetY);
  const scaleValue = useSharedValue(scale);
  const savedScale = useSharedValue(scale);
  const savedTranslateX = useSharedValue(offsetX);
  const savedTranslateY = useSharedValue(offsetY);
  
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

  // Pan gesture
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      setOffset(translateX.value, translateY.value);
    });

  // Pinch gesture for zoom
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scaleValue.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      savedScale.value = scaleValue.value;
      setScale(scaleValue.value);
    });

  // Tap gesture to deselect
  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      selectNode(null);
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

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composed}>
        <Animated.View style={[styles.canvas, animatedStyle]}>
          <Svg width={SCREEN_WIDTH * 4} height={SCREEN_HEIGHT * 4} style={styles.svg}>
            <G>
              {connections.map(conn => {
                const fromNode = nodes.find(n => n.id === conn.from);
                const toNode = nodes.find(n => n.id === conn.to);
                
                if (!fromNode || !toNode) return null;
                
                const x1 = fromNode.x + fromNode.width / 2;
                const y1 = fromNode.y + fromNode.height;
                const x2 = toNode.x + toNode.width / 2;
                const y2 = toNode.y;
                
                return (
                  <Line
                    key={conn.id}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#666"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                );
              })}
            </G>
          </Svg>
          
          {nodes.map(node => (
            <FlowNode
              key={node.id}
              node={node}
              isConnecting={connectingFrom === node.id}
              onPress={handleNodePress}
              onLongPress={handleNodeLongPress}
            />
          ))}
        </Animated.View>
      </GestureDetector>
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