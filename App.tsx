// Polyfills para Supabase en React Native
import "react-native-url-polyfill/auto";
import "react-native-get-random-values";

import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { LoginModal } from "./src/components/LoginModal";
import { AgregarProcesoModal } from "./src/components/AgregarProcesoModal";
import { supabase } from "./supabaseClient";
import AsistenteVoz from "./AsistenteVoz";
import { User } from "@supabase/supabase-js";

interface Proceso {
  id: string;
  titulo: string;
  descripcion: string;
  imagenes: {
    nombre: string;
    data: string;
    isLocal?: boolean;
    size?: number;
  }[];
  created_at: string;
  updated_at: string;
  created_by: string;
  origen: "local" | "remoto";
}

interface NuevoProcesoData {
  titulo: string;
  descripcion: string;
  imagenes: {
    uri: string;
    name: string;
    size: number;
  }[];
}

export default function App() {
  const [procesos, setProcesos] = useState<Proceso[]>([]);
  const [showLogin, setShowLogin] = useState(false);
  const [showAgregarProceso, setShowAgregarProceso] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
    setShowLogin(false);
    setShowAgregarProceso(true);
  };

  const handleAgregarProceso = async (datos: NuevoProcesoData) => {
    try {
      // 1. Convertir imágenes a Base64
      const imagenesBase64 = await Promise.all(
        datos.imagenes.map(async (imagen) => {
          const response = await fetch(imagen.uri);
          const blob = await response.blob();
          return new Promise<{
            nombre: string;
            data: string;
            isLocal: boolean;
            size: number;
          }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                nombre: imagen.name,
                data: reader.result as string,
                isLocal: false,
                size: imagen.size,
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        })
      );

      // 2. Crear objeto proceso
      const nuevoProceso = {
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        imagenes: imagenesBase64,
        created_by: user?.id,
      };

      // 3. Guardar en Supabase
      const { data, error } = await supabase
        .from("procesos")
        .insert(nuevoProceso)
        .select()
        .single();

      if (error) throw error;

      // 4. Actualizar lista local
      setProcesos([...procesos, { ...data, origen: "remoto" }]);

      // 5. Cerrar modal y mostrar éxito
      setShowAgregarProceso(false);
      Alert.alert("✅ Éxito", "Proceso agregado correctamente");
    } catch (error) {
      Alert.alert(
        "❌ Error",
        "No se pudo agregar el proceso: " + (error as Error).message
      );
    }
  };

  return (
    <View style={styles.container}>
      <AsistenteVoz />
      <StatusBar style="dark" />

      <LoginModal
        visible={showLogin}
        onClose={() => setShowLogin(false)}
        onSuccess={handleLoginSuccess}
      />

      <AgregarProcesoModal
        visible={showAgregarProceso}
        onClose={() => setShowAgregarProceso(false)}
        onSubmit={handleAgregarProceso}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
