import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase, ProcesoRemoto } from "./supabaseClient";

// Interfaces locales (compatibles con las existentes)
export interface Proceso {
  id: string;
  titulo: string;
  descripcion: string;
  imagenes: ImagenProceso[];
  created_at: string;
  updated_at: string;
  created_by: string;
  origen: "local" | "remoto";
}

export interface ImagenProceso {
  nombre: string;
  data: string; // Base64 para remotas, nombre para locales
  isLocal?: boolean; // true para require(), false para base64
  size?: number;
}

// Claves para AsyncStorage
const PROCESOS_KEY = "@procesos_cache";
const ULTIMO_SYNC_KEY = "@ultimo_sync";

// ===== FUNCIONES DE STORAGE LOCAL =====

/**
 * Guardar procesos en cache local (AsyncStorage)
 */
export const guardarProcesosCache = async (
  procesos: Proceso[]
): Promise<void> => {
  try {
    await AsyncStorage.setItem(PROCESOS_KEY, JSON.stringify(procesos));
    console.log(`💾 ${procesos.length} procesos guardados en cache`);
  } catch (error) {
    console.error("❌ Error guardando cache:", error);
  }
};

/**
 * Cargar procesos desde cache local
 */
export const cargarProcesosCache = async (): Promise<Proceso[]> => {
  try {
    const cached = await AsyncStorage.getItem(PROCESOS_KEY);
    if (cached) {
      const procesos = JSON.parse(cached);
      console.log(`📱 ${procesos.length} procesos cargados desde cache`);
      return procesos;
    }
    return [];
  } catch (error) {
    console.error("❌ Error cargando cache:", error);
    return [];
  }
};

/**
 * Obtener timestamp de última sincronización
 */
export const getUltimoSync = async (): Promise<string> => {
  try {
    const timestamp = await AsyncStorage.getItem(ULTIMO_SYNC_KEY);
    return timestamp || "2024-01-01T00:00:00Z";
  } catch (error) {
    console.error("❌ Error obteniendo último sync:", error);
    return "2024-01-01T00:00:00Z";
  }
};

/**
 * Guardar timestamp de última sincronización
 */
export const setUltimoSync = async (timestamp: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(ULTIMO_SYNC_KEY, timestamp);
  } catch (error) {
    console.error("❌ Error guardando último sync:", error);
  }
};

/**
 * Verificar si hay conexión a internet
 */
export const hayInternet = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("procesos")
      .select("id")
      .limit(1);
    return !error;
  } catch (error) {
    return false;
  }
};

// ===== FUNCIONES DE MERGE =====

/**
 * Algoritmo inteligente para combinar procesos locales y remotos
 */
export const mergeProcesos = (
  locales: Proceso[],
  remotos: ProcesoRemoto[]
): Proceso[] => {
  const procesosMap = new Map<string, Proceso>();

  // 1. Agregar todos los procesos locales (nunca se sobrescriben)
  locales.forEach((proceso) => {
    procesosMap.set(proceso.id, proceso);
  });

  // 2. Procesar procesos remotos
  remotos.forEach((procesoRemoto) => {
    const procesoLocal = procesosMap.get(procesoRemoto.id);

    if (!procesoLocal) {
      // Proceso nuevo remoto - agregar
      procesosMap.set(procesoRemoto.id, {
        ...procesoRemoto,
        imagenes: procesoRemoto.imagenes.map((img) => ({
          ...img,
          isLocal: false, // Las remotas son Base64
        })),
        origen: "remoto",
      });
    } else if (procesoLocal.origen === "remoto") {
      // Proceso existente remoto - verificar si es más nuevo
      if (
        new Date(procesoRemoto.updated_at) > new Date(procesoLocal.updated_at)
      ) {
        procesosMap.set(procesoRemoto.id, {
          ...procesoRemoto,
          imagenes: procesoRemoto.imagenes.map((img) => ({
            ...img,
            isLocal: false,
          })),
          origen: "remoto",
        });
        console.log(`🔄 Proceso actualizado: ${procesoRemoto.titulo}`);
      }
    }
    // Los procesos locales originales nunca se tocan
  });

  // 3. Retornar ordenados por fecha de creación
  return Array.from(procesosMap.values()).sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
};

// ===== FUNCIÓN PRINCIPAL DE SINCRONIZACIÓN =====

/**
 * Sincronización principal: obtiene datos remotos y hace merge con locales
 */
export const sincronizarProcesos = async (): Promise<{
  procesos: Proceso[];
  nuevos: number;
  error?: string;
}> => {
  try {
    // 1. Cargar procesos desde cache local
    const procesosLocales = await cargarProcesosCache();
    console.log(`📱 ${procesosLocales.length} procesos locales cargados`);

    // 2. Verificar conexión a internet
    const tieneInternet = await hayInternet();
    if (!tieneInternet) {
      console.log("📱 Sin conexión - usando solo procesos locales");
      return { procesos: procesosLocales, nuevos: 0 };
    }

    // 3. Obtener procesos remotos desde Supabase
    const { data: procesosRemotos, error } = await supabase
      .from("procesos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // 4. Si no hay procesos remotos, limpiar el caché local
    if (!procesosRemotos || procesosRemotos.length === 0) {
      console.log("🗑️ No hay procesos en Supabase - limpiando caché local");
      await guardarProcesosCache([]);
      return { procesos: [], nuevos: -procesosLocales.length };
    }

    // 5. Combinar procesos locales y remotos
    const procesosCombinados = mergeProcesos(
      procesosLocales,
      procesosRemotos || []
    );
    console.log(`🔄 ${procesosCombinados.length} procesos combinados`);

    // 6. Guardar en cache
    await guardarProcesosCache(procesosCombinados);

    // 7. Actualizar timestamp de última sincronización
    await setUltimoSync(new Date().toISOString());

    return {
      procesos: procesosCombinados,
      nuevos: procesosCombinados.length - procesosLocales.length,
    };
  } catch (error) {
    console.error("❌ Error en sincronización:", error);
    return {
      procesos: await cargarProcesosCache(),
      nuevos: 0,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
};

// ===== FUNCIONES PARA AGREGAR PROCESOS =====

export const crearProceso = async (proceso: {
  titulo: string;
  descripcion: string;
  imagenes: ImagenProceso[];
}): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from("procesos")
      .insert({
        titulo: proceso.titulo,
        descripcion: proceso.descripcion,
        imagenes: proceso.imagenes,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    console.log("✅ Proceso creado en Supabase:", data.id);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
