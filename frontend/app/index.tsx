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
import FlowCanvasV2 from '../components/FlowCanvasV2';
import TextInputModal from '../components/TextInputModal';
import NodeDetailSheet from '../components/NodeDetailSheet';
import { useFlowStore } from '../store/flowStore';

export default function Index() {
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