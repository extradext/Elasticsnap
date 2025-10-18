import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface CreateChildModalProps {
  visible: boolean;
  parentId: string | null;
  onClose: () => void;
  onSubmit: (parentId: string, label: string, type: 'task' | 'decision') => void;
}

export default function CreateChildModal({
  visible,
  parentId,
  onClose,
  onSubmit
}: CreateChildModalProps) {
  const [label, setLabel] = useState('');
  const [nodeType, setNodeType] = useState<'task' | 'decision'>('task');

  const handleSubmit = () => {
    if (label.trim() && parentId) {
      onSubmit(parentId, label.trim(), nodeType);
      setLabel('');
      setNodeType('task');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MaterialIcons name="add-circle" size={24} color="#00A65A" />
              <Text style={styles.title}>Create Child Node</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#888" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Node Label</Text>
          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            placeholder="Enter child node label..."
            placeholderTextColor="#666"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />

          <Text style={styles.label}>Node Type</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeOption,
                nodeType === 'task' && styles.typeOptionActive
              ]}
              onPress={() => setNodeType('task')}
            >
              <MaterialIcons 
                name="check-box" 
                size={20} 
                color={nodeType === 'task' ? '#00A65A' : '#666'} 
              />
              <Text style={[
                styles.typeText,
                nodeType === 'task' && styles.typeTextActive
              ]}>
                Task
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeOption,
                nodeType === 'decision' && styles.typeOptionActive
              ]}
              onPress={() => setNodeType('decision')}
            >
              <MaterialIcons 
                name="call-split" 
                size={20} 
                color={nodeType === 'decision' ? '#FF9800' : '#666'} 
              />
              <Text style={[
                styles.typeText,
                nodeType === 'decision' && styles.typeTextActive
              ]}>
                Decision
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, !label.trim() && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!label.trim()}
          >
            <MaterialIcons name="add" size={20} color="#fff" />
            <Text style={styles.submitButtonText}>Create Child</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)'
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff'
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
    marginTop: 8
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333'
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333'
  },
  typeOptionActive: {
    borderColor: '#00A65A',
    backgroundColor: '#00A65A20'
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666'
  },
  typeTextActive: {
    color: '#fff'
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00A65A',
    padding: 14,
    borderRadius: 8,
    marginTop: 8
  },
  submitButtonDisabled: {
    backgroundColor: '#2a2a2a',
    opacity: 0.5
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff'
  }
});
