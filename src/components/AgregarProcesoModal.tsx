import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../supabaseClient";

interface AgregarProcesoModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (datos: NuevoProcesoData) => void;
  onBack?: () => void;
}

interface NuevoProcesoData {
  titulo: string;
  descripcion: string;
  imagenes: ImagenSeleccionada[];
}

interface ImagenSeleccionada {
  uri: string;
  name: string;
  size: number;
}

export const AgregarProcesoModal: React.FC<AgregarProcesoModalProps> = ({
  visible,
  onClose,
  onSubmit,
  onBack,
}) => {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagenes, setImagenes] = useState<ImagenSeleccionada[]>([]);
  const [loading, setLoading] = useState(false);

  const seleccionarImagenes = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permisos requeridos",
          "Necesitamos acceso a tu galería para seleccionar imágenes."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.5, // Comprimir imágenes para reducir tamaño
        base64: false,
      });

      if (!result.canceled) {
        const nuevasImagenes = result.assets.map(
          (asset: ImagePicker.ImagePickerAsset) => ({
            uri: asset.uri,
            name: asset.uri.split("/").pop() || "imagen.jpg",
            size: asset.fileSize || 0,
          })
        );

        // Verificar tamaño total
        const tamañoTotal = nuevasImagenes.reduce(
          (acc: number, img: ImagenSeleccionada) => acc + img.size,
          0
        );
        if (tamañoTotal > 1024 * 1024) {
          // 1MB máximo
          Alert.alert(
            "Error",
            "El tamaño total de las imágenes no puede superar 1MB"
          );
          return;
        }

        setImagenes([...imagenes, ...nuevasImagenes]);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudieron seleccionar las imágenes");
    }
  };

  const eliminarImagen = (index: number) => {
    setImagenes(imagenes.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!titulo.trim() || !descripcion.trim()) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }

    if (imagenes.length === 0) {
      Alert.alert("Error", "Debes seleccionar al menos una imagen");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        imagenes,
      });
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar el proceso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
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
          {/* Botón Volver */}
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
          <View style={[styles.header, { marginTop: 32 }]}>
            <Text style={styles.title}>Agregar Nuevo Proceso</Text>
          </View>

          {loading ? (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                marginVertical: 40,
              }}
            >
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text
                style={{
                  marginTop: 16,
                  fontSize: 16,
                  color: "#3B82F6",
                  fontWeight: "bold",
                }}
              >
                Creando proceso...
              </Text>
            </View>
          ) : (
            <>
              <ScrollView style={styles.scrollContent}>
                <TextInput
                  style={styles.input}
                  placeholder="Título del proceso"
                  value={titulo}
                  onChangeText={setTitulo}
                  editable={!loading}
                />

                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Descripción del proceso"
                  value={descripcion}
                  onChangeText={setDescripcion}
                  multiline
                  numberOfLines={4}
                  editable={!loading}
                />

                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={seleccionarImagenes}
                  disabled={loading}
                >
                  <Ionicons name="images-outline" size={24} color="#3B82F6" />
                  <Text style={styles.imageButtonText}>
                    Seleccionar Imágenes
                  </Text>
                </TouchableOpacity>

                {imagenes.length > 0 && (
                  <View style={styles.imagePreviewContainer}>
                    {imagenes.map((imagen, index) => (
                      <View key={index} style={styles.imagePreview}>
                        <Image
                          source={{ uri: imagen.uri }}
                          style={styles.previewImage}
                        />
                        <TouchableOpacity
                          style={styles.deleteImageButton}
                          onPress={() => eliminarImagen(index)}
                          disabled={loading}
                        >
                          <Ionicons
                            name="close-circle"
                            size={24}
                            color="#EF4444"
                          />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    loading && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  <Text style={styles.submitButtonText}>Guardar Proceso</Text>
                </TouchableOpacity>
              </ScrollView>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    width: "90%",
    maxWidth: 500,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  imageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  imageButtonText: {
    color: "#3B82F6",
    fontSize: 16,
    fontWeight: "600",
  },
  imagePreviewContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  deleteImageButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
  },
  submitButton: {
    backgroundColor: "#3B82F6",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#93C5FD",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
