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

// Spring configuration for fluid, organic motion
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
  
  // Animated values with spring physics
  const translateX = useSharedValue(node.x);
  const translateY = useSharedValue(node.y);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  
  const savedTranslateX = useSharedValue(node.x);
  const savedTranslateY = useSharedValue(node.y);

  const isSelected = selectedNodeId === node.id;

  // Sync position when node data changes
  useEffect(() => {
    translateX.value = withSpring(node.x, SPRING_CONFIG);
    translateY.value = withSpring(node.y, SPRING_CONFIG);
    savedTranslateX.value = node.x;
    savedTranslateY.value = node.y;
  }, [node.x, node.y]);

  // Drag gesture with smooth spring
  const dragGesture = Gesture.Pan()
    .onStart(() => {
      // Subtle scale up on touch
      scale.value = withSpring(1.08, { damping: 15, stiffness: 300 });
      rotation.value = withSpring(Math.random() * 4 - 2, SPRING_CONFIG); // Subtle wiggle
    })
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      // Spring back to normal size with overshoot for organic feel
      scale.value = withSpring(1, SPRING_CONFIG);
      rotation.value = withSpring(0, SPRING_CONFIG);
      
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      
      runOnJS(updateNode)(node.id, { 
        x: translateX.value, 
        y: translateY.value 
      });
    });

  // Long press for connection mode
  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      // Pulse effect on long press
      scale.value = withSpring(1.15, { damping: 10, stiffness: 200 });
    })
    .onEnd(() => {
      scale.value = withSpring(1, SPRING_CONFIG);
      runOnJS(onLongPress)(node.id);
    });

  // Double tap for recolor
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      // Quick bounce effect
      scale.value = withTiming(1.2, { duration: 100 }, () => {
        scale.value = withSpring(1, SPRING_CONFIG);
      });
      runOnJS(setRecolorMode)(!recolorMode);
    });

  // Single tap
  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      // Subtle tap feedback
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
          
          {/* Quick-create child button (appears on hover/selection) */}
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
