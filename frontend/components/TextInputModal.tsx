import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface TextInputModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
  title: string;
  placeholder: string;
  multiline?: boolean;
}

export default function TextInputModal({
  visible,
  onClose,
  onSubmit,
  title,
  placeholder,
  multiline = false
}: TextInputModalProps) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text);
      setText('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.content}>
            <TextInput
              style={[styles.input, multiline && styles.multilineInput]}
              placeholder={placeholder}
              placeholderTextColor="#666"
              value={text}
              onChangeText={setText}
              multiline={multiline}
              numberOfLines={multiline ? 10 : 1}
              autoFocus
            />
            
            {multiline && (
              <Text style={styles.hint}>
                Tip: Each line becomes a node. Lines with '?' become decision nodes.
              </Text>
            )}
          </ScrollView>
          
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.submitButton, !text.trim() && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={!text.trim()}
            >
              <Text style={styles.buttonText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end'
  },
  modalContainer: {
    backgroundColor: '#2a2a2a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444'
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff'
  },
  content: {
    padding: 16
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#444'
  },
  multilineInput: {
    minHeight: 150,
    textAlignVertical: 'top'
  },
  hint: {
    color: '#888',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic'
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center'
  },
  cancelButton: {
    backgroundColor: '#444'
  },
  submitButton: {
    backgroundColor: '#00A65A'
  },
  disabledButton: {
    opacity: 0.5
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});