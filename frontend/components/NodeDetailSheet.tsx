import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { NodeData, useFlowStore } from '../store/flowStore';

interface NodeDetailSheetProps {
  visible: boolean;
  node: NodeData | null;
  onClose: () => void;
}

export default function NodeDetailSheet({ visible, node, onClose }: NodeDetailSheetProps) {
  const { updateNode, deleteNode, addNodeTab, updateNodeTab } = useFlowStore();
  const [activeTab, setActiveTab] = useState(0);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelText, setLabelText] = useState('');

  if (!node) return null;

  const handleDeleteNode = () => {
    deleteNode(node.id);
    onClose();
  };

  const handleToggleLock = () => {
    updateNode(node.id, { locked: !node.locked });
  };

  const handleAddTab = () => {
    addNodeTab(node.id, `Tab ${node.tabs.length + 1}`);
  };

  const handleSaveLabel = () => {
    if (labelText.trim()) {
      updateNode(node.id, { label: labelText });
      setEditingLabel(false);
    }
  };

  const handleTabContentChange = (tabId: string, newContent: string) => {
    const tab = node.tabs.find(t => t.id === tabId);
    if (tab) {
      const updatedContent = [...tab.content];
      updatedContent[0] = { ...updatedContent[0], content: newContent };
      updateNodeTab(node.id, tabId, { content: updatedContent });
    }
  };

  const currentTab = node.tabs[activeTab];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.typeIndicator, { backgroundColor: node.color }]} />
              {editingLabel ? (
                <TextInput
                  style={styles.labelInput}
                  value={labelText}
                  onChangeText={setLabelText}
                  onBlur={handleSaveLabel}
                  autoFocus
                />
              ) : (
                <TouchableOpacity onPress={() => {
                  setEditingLabel(true);
                  setLabelText(node.label);
                }}>
                  <Text style={styles.nodeTitle}>{node.label}</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabNav}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {node.tabs.map((tab, index) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tabButton, activeTab === index && styles.activeTabButton]}
                  onPress={() => setActiveTab(index)}
                >
                  <Text style={[styles.tabText, activeTab === index && styles.activeTabText]}>
                    {tab.label}
                  </Text>
                  {tab.content.some(c => c.subtabs && c.subtabs.length > 0) && (
                    <MaterialIcons name="layers" size={12} color="#888" style={{ marginLeft: 4 }} />
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.addTabButton} onPress={handleAddTab}>
                <MaterialIcons name="add" size={20} color="#00A65A" />
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Tab Content */}
          <ScrollView style={styles.content}>
            {currentTab && (
              <View>
                <View style={styles.contentSection}>
                  <Text style={styles.sectionLabel}>Content</Text>
                  <TextInput
                    style={styles.contentInput}
                    value={currentTab.content[0]?.content || ''}
                    onChangeText={(text) => handleTabContentChange(currentTab.id, text)}
                    placeholder="Enter content..."
                    placeholderTextColor="#666"
                    multiline
                    numberOfLines={10}
                  />
                </View>

                {/* Node Type Specific Fields */}
                {node.type === 'task' && (
                  <View style={styles.fieldsSection}>
                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Done</Text>
                      <Switch
                        value={node.fields?.done || false}
                        onValueChange={(value) => {
                          const fields = { ...node.fields, done: value };
                          updateNode(node.id, { fields });
                        }}
                        trackColor={{ false: '#444', true: '#00A65A' }}
                      />
                    </View>
                    
                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Priority</Text>
                      <View style={styles.priorityButtons}>
                        {['L', 'M', 'H'].map(priority => (
                          <TouchableOpacity
                            key={priority}
                            style={[
                              styles.priorityButton,
                              node.fields?.priority === priority && styles.activePriorityButton
                            ]}
                            onPress={() => {
                              const fields = { ...node.fields, priority };
                              updateNode(node.id, { fields });
                            }}
                          >
                            <Text style={styles.priorityText}>{priority}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.footerButton} onPress={handleToggleLock}>
              <MaterialIcons 
                name={node.locked ? "lock" : "lock-open"} 
                size={20} 
                color="#fff" 
              />
              <Text style={styles.footerButtonText}>
                {node.locked ? 'Unlock' : 'Lock'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.footerButton, styles.deleteButton]} 
              onPress={handleDeleteNode}
            >
              <MaterialIcons name="delete" size={20} color="#fff" />
              <Text style={styles.footerButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end'
  },
  sheetContainer: {
    backgroundColor: '#2a2a2a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  typeIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: 12
  },
  nodeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff'
  },
  labelInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    padding: 0
  },
  tabNav: {
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    paddingVertical: 8
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8
  },
  activeTabButton: {
    backgroundColor: '#00A65A'
  },
  tabText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500'
  },
  activeTabText: {
    color: '#fff'
  },
  addTabButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  content: {
    flex: 1,
    padding: 16
  },
  contentSection: {
    marginBottom: 16
  },
  sectionLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase'
  },
  contentInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#444'
  },
  fieldsSection: {
    marginTop: 16
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444'
  },
  fieldLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500'
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8
  },
  priorityButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#444'
  },
  activePriorityButton: {
    backgroundColor: '#00A65A'
  },
  priorityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#444',
    gap: 12
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#444',
    gap: 8
  },
  deleteButton: {
    backgroundColor: '#E91E63'
  },
  footerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  }
});