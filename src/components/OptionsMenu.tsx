import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface OptionsMenuProps {
  visible: boolean;
  onClose: () => void;
  onShowInstructions: () => void;
  onShowVoiceConfig: () => void;
  onShowListModal: () => void;
  onShowAgregarProceso: () => void;
}

export const OptionsMenu: React.FC<OptionsMenuProps> = ({
  visible,
  onClose,
  onShowInstructions,
  onShowVoiceConfig,
  onShowListModal,
  onShowAgregarProceso,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.menuContainer}>
          <View style={styles.menuContent}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitulo}>Opciones</Text>
            </View>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onClose();
                onShowInstructions();
              }}
            >
              <Ionicons name="help-circle-outline" size={24} color="#3B82F6" />
              <Text style={styles.menuItemText}>Guía de Uso</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onClose();
                onShowVoiceConfig();
              }}
            >
              <Ionicons name="volume-high-outline" size={24} color="#3B82F6" />
              <Text style={styles.menuItemText}>Configuración de Voz</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onClose();
                onShowListModal();
              }}
            >
              <Ionicons name="list-outline" size={24} color="#3B82F6" />
              <Text style={styles.menuItemText}>Lista de Procesos</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onClose();
                onShowAgregarProceso();
              }}
            >
              <Ionicons name="add-circle-outline" size={24} color="#10B981" />
              <Text style={styles.menuItemText}>Agregar Proceso</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContainer: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 15,
    width: "90%",
    maxWidth: 400,
  },
  menuContent: {
    gap: 16,
  },
  menuHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  menuTitulo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 12,
    flex: 1,
  },
});
