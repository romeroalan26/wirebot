import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../supabaseClient";

interface Proceso {
  id: string;
  titulo: string;
  descripcion: string;
  imagenes: string[];
}

interface EliminarProcesoModalProps {
  visible: boolean;
  onClose: () => void;
  procesos: Proceso[];
  onProcesoEliminado: () => void;
  onBack?: () => void;
}

export const EliminarProcesoModal: React.FC<EliminarProcesoModalProps> = ({
  visible,
  onClose,
  procesos,
  onProcesoEliminado,
  onBack,
}) => {
  const [procesosSeleccionados, setProcesosSeleccionados] = useState<string[]>(
    []
  );

  const toggleSeleccion = (id: string) => {
    setProcesosSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const handleEliminarVarios = async () => {
    if (procesosSeleccionados.length === 0) return;
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("No hay usuario autenticado");

      Alert.alert(
        "¿Eliminar procesos?",
        `¿Estás seguro de eliminar ${procesosSeleccionados.length} procesos?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: async () => {
              const { error } = await supabase
                .from("procesos")
                .delete()
                .in("id", procesosSeleccionados);
              if (error) throw error;
              setProcesosSeleccionados([]);
              onProcesoEliminado();
              Alert.alert("✅ Éxito", "Procesos eliminados correctamente", [
                { text: "OK", onPress: onClose },
              ]);
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        "❌ Error",
        "No se pudieron eliminar los procesos: " + error.message
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
        onPress={onClose}
      >
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 20,
            width: "90%",
            maxWidth: 400,
            position: "relative",
          }}
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <TouchableOpacity
            style={{
              position: "absolute",
              left: 16,
              top: 16,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#F1F5F9",
              justifyContent: "center",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 2,
              zIndex: 10,
            }}
            onPress={onBack ? onBack : onClose}
          >
            <Ionicons name="arrow-back" size={24} color="#3B82F6" />
          </TouchableOpacity>
          <View style={[styles.modalHeader, { marginTop: 32 }]}>
            <Text style={styles.modalTitulo}>Eliminar Procesos</Text>
          </View>

          <Text style={styles.modalSubtitulo}>
            Selecciona los procesos que deseas eliminar:
          </Text>

          <FlatList
            data={procesos}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.procesoItem,
                  procesosSeleccionados.includes(item.id) &&
                    styles.procesoSeleccionado,
                ]}
                onPress={() => toggleSeleccion(item.id)}
              >
                <View style={styles.procesoInfo}>
                  <Text style={styles.procesoTitulo}>{item.titulo}</Text>
                  <Text style={styles.procesoDescripcion} numberOfLines={2}>
                    {item.descripcion}
                  </Text>
                </View>
                <Ionicons
                  name={
                    procesosSeleccionados.includes(item.id)
                      ? "checkbox"
                      : "square-outline"
                  }
                  size={24}
                  color={
                    procesosSeleccionados.includes(item.id)
                      ? "#EF4444"
                      : "#9CA3AF"
                  }
                />
              </TouchableOpacity>
            )}
            style={styles.lista}
          />

          <View style={styles.botonesContainer}>
            <TouchableOpacity
              style={[styles.boton, styles.botonCancelar]}
              onPress={onClose}
            >
              <Text style={styles.textoBotonCancelar}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.boton,
                styles.botonEliminar,
                procesosSeleccionados.length === 0 && styles.botonDeshabilitado,
              ]}
              onPress={handleEliminarVarios}
              disabled={procesosSeleccionados.length === 0}
            >
              <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
              <Text style={styles.textoBotonEliminar}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
  modalSubtitulo: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 16,
  },
  lista: {
    maxHeight: 400,
  },
  procesoItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  procesoSeleccionado: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  procesoInfo: {
    flex: 1,
    marginRight: 12,
  },
  procesoTitulo: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  procesoDescripcion: {
    fontSize: 14,
    color: "#6B7280",
  },
  botonesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
  },
  boton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  botonCancelar: {
    backgroundColor: "#F3F4F6",
  },
  botonEliminar: {
    backgroundColor: "#EF4444",
  },
  botonDeshabilitado: {
    backgroundColor: "#FCA5A5",
  },
  textoBotonCancelar: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  textoBotonEliminar: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
