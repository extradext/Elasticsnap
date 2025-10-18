import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { NodeData, useFlowStore } from '../store/flowStore';
import { MaterialIcons } from '@expo/vector-icons';

interface FlowNodeProps {
  node: NodeData;
  isConnecting: boolean;
  onPress: (id: string) => void;
  onLongPress: (id: string) => void;
}

export default function FlowNode({ node, isConnecting, onPress, onLongPress }: FlowNodeProps) {
  const { updateNode, selectedNodeId } = useFlowStore();
  const [recolorMode, setRecolorMode] = useState(false);
  
  const translateX = useSharedValue(node.x);
  const translateY = useSharedValue(node.y);
  const savedTranslateX = useSharedValue(node.x);
  const savedTranslateY = useSharedValue(node.y);

  const isSelected = selectedNodeId === node.id;

  // Drag gesture
  const dragGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      updateNode(node.id, { x: translateX.value, y: translateY.value });
    });

  // Long press gesture for connection mode
  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onEnd(() => {
      onLongPress(node.id);
    });

  // Double tap for recolor
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      setRecolorMode(!recolorMode);
    });

  // Single tap
  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      onPress(node.id);
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
      { translateY: translateY.value }
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
            { backgroundColor: node.color, borderColor: isSelected ? '#fff' : node.color },
            isConnecting && styles.connecting
          ]}
        >
          <Text style={styles.nodeLabel} numberOfLines={2}>
            {node.label}
          </Text>
          
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
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  rectangle: {
    borderRadius: 8
  },
  diamond: {
    borderRadius: 8,
    transform: [{ rotate: '45deg' }]
  },
  connecting: {
    borderColor: '#FFD700',
    borderWidth: 3
  },
  nodeLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center'
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 2
  },
  tabCount: {
    color: '#fff',
    fontSize: 10,
    marginLeft: 2
  },
  lockIcon: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 2
  },
  colorPicker: {
    position: 'absolute',
    top: -40,
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    padding: 4
  },
  colorOption: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginHorizontal: 2,
    borderWidth: 2,
    borderColor: '#fff'
  }
});