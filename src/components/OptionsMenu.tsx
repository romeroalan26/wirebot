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
import { supabase } from "../../supabaseClient";
import { User } from "@supabase/supabase-js";

interface OptionsMenuProps {
  visible: boolean;
  onClose: () => void;
  onShowInstructions: () => void;
  onShowVoiceConfig: () => void;
  onShowListModal: () => void;
  onShowAdminProcesos: () => void;
  user: User | null;
  onLogout: () => void;
}

export const OptionsMenu: React.FC<OptionsMenuProps> = ({
  visible,
  onClose,
  onShowInstructions,
  onShowVoiceConfig,
  onShowListModal,
  onShowAdminProcesos,
  user,
  onLogout,
}) => {
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      onLogout();
      onClose();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

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

            {/* Sección de perfil */}
            {user ? (
              <View style={styles.profileSection}>
                <View style={styles.profileInfo}>
                  <Ionicons
                    name="person-circle-outline"
                    size={40}
                    color="#3B82F6"
                  />
                  <View style={styles.profileTextContainer}>
                    <Text style={styles.profileName}>{user.email}</Text>
                    <Text style={styles.profileRole}>Usuario</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={24} color="#EF4444" />
                  <Text style={styles.logoutText}>Cerrar Sesión</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.profileSection}>
                <View style={styles.profileInfo}>
                  <Ionicons
                    name="person-circle-outline"
                    size={40}
                    color="#CBD5E1"
                  />
                  <View style={styles.profileTextContainer}>
                    <Text style={[styles.profileName, { color: "#64748B" }]}>
                      No has iniciado sesión
                    </Text>
                    <Text style={[styles.profileRole, { color: "#94A3B8" }]}>
                      Usuario no autenticado
                    </Text>
                  </View>
                </View>
              </View>
            )}

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
                onShowAdminProcesos();
              }}
            >
              <Ionicons name="settings-outline" size={24} color="#6366F1" />
              <Text style={styles.menuItemText}>Administrar</Text>
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
  profileSection: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  profileTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  profileRole: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  logoutText: {
    marginLeft: 8,
    color: "#EF4444",
    fontWeight: "600",
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
  deleteItem: {
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  deleteText: {
    color: "#EF4444",
  },
});
