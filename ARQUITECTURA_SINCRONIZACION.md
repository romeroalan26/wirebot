# 🏗️ Arquitectura de Sincronización - Asistente Fábrica MERCAPLAS

## 📋 Requisitos del Proyecto

### 🎯 **Contexto:**

- **Proyecto académico** para presentación de grado
- **4 usuarios** máximo
- **Presupuesto:** $0 (completamente gratis)
- **Uso:** Demostración y pruebas ocasionales

### 📱 **Funcionalidades Requeridas:**

- ✅ **Offline-first:** Debe funcionar sin internet
- ✅ **Sincronización:** Actualizar cuando hay conexión
- ✅ **Multi-usuario:** 4 usuarios pueden agregar procesos
- ✅ **Autenticación:** Login requerido para agregar
- ✅ **Imágenes pequeñas:** Pocos KB por imagen

---

## 🛠️ Stack Tecnológico

### **🗄️ Base de Datos: Supabase (Gratis)**

```
Plan Gratuito Incluye:
✅ 500MB Database
✅ 1GB Storage
✅ 50,000 requests/mes
✅ Autenticación integrada
✅ APIs REST automáticas
✅ Row Level Security (RLS)
```

### **📂 Almacenamiento Local:**

```
procesos.json (archivo local)
├── Procesos originales (OCTAVIN, etc.)
├── Procesos agregados remotamente
└── Cache completo para modo offline
```

### **🖼️ Estrategia de Imágenes:**

```
Híbrido Base64 + Assets:
├── Locales: require('./assets/images/...')
├── Remotas: Base64 embebido en JSON
└── Tamaño: <50KB por imagen
```

---

## 📊 Estructura de Datos

### **🔹 Tabla Supabase: `procesos`**

```sql
CREATE TABLE procesos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  imagenes JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Row Level Security
ALTER TABLE procesos ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso
CREATE POLICY "Todos pueden leer procesos" ON procesos
  FOR SELECT USING (true);

CREATE POLICY "Usuarios autenticados pueden insertar" ON procesos
  FOR INSERT WITH CHECK (auth.uid() = created_by);
```

### **🔹 Interface TypeScript:**

```typescript
interface Proceso {
  id: string;
  titulo: string;
  descripcion: string;
  imagenes: ImagenProceso[];
  created_at: string;
  updated_at: string;
  created_by: string;
  origen: "local" | "remoto";
}

interface ImagenProceso {
  nombre: string;
  data: string; // Base64 para remotas, nombre para locales
  isLocal?: boolean; // true para require(), false para base64
  size?: number;
}
```

### **🔹 procesos.json Estructura:**

```json
[
  {
    "id": "local-octavin-1",
    "titulo": "Proceso de trefiladora principal \"OCTAVIN\"",
    "descripcion": "1-Se empieza colocando...",
    "imagenes": [
      {
        "nombre": "trefiladora-octavin-1",
        "data": "trefiladora-octavin-1",
        "isLocal": true
      }
    ],
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "created_by": "sistema",
    "origen": "local"
  },
  {
    "id": "remote-nuevo-proceso",
    "titulo": "Proceso agregado por usuario",
    "descripcion": "Nuevo proceso...",
    "imagenes": [
      {
        "nombre": "nueva-imagen-1",
        "data": "data:image/jpeg;base64,/9j/4AAQ...",
        "isLocal": false,
        "size": 25600
      }
    ],
    "created_at": "2024-12-01T10:30:00Z",
    "updated_at": "2024-12-01T10:30:00Z",
    "created_by": "uuid-usuario",
    "origen": "remoto"
  }
]
```

---

## 🔄 Flujos de Trabajo

### **🚀 1. Inicialización de la App**

```typescript
const inicializarApp = async () => {
  // 1. Cargar procesos.json (siempre disponible)
  const procesosLocales = await cargarProcesosJson();
  setProcesos(procesosLocales);

  // 2. Intentar sincronización (background)
  sincronizarEnBackground();
};
```

### **🔄 2. Sincronización Automática**

```typescript
const sincronizarProcesos = async () => {
  try {
    // 1. Verificar conectividad
    if (!hayInternet()) {
      console.log("Modo offline - usando cache local");
      return;
    }

    // 2. Obtener última fecha de sync
    const ultimoSync = await getUltimoSync();

    // 3. Consultar nuevos/actualizados desde Supabase
    const { data: procesosRemotos } = await supabase
      .from("procesos")
      .select("*")
      .gte("updated_at", ultimoSync)
      .order("created_at", { ascending: true });

    // 4. Merge inteligente
    const procesosActualizados = await mergeProcesos(
      procesosLocales,
      procesosRemotos
    );

    // 5. Guardar en procesos.json
    await guardarProcesosJson(procesosActualizados);

    // 6. Actualizar UI
    setProcesos(procesosActualizados);

    // 7. Guardar timestamp de sync
    await setUltimoSync(new Date().toISOString());

    console.log(`Sincronización exitosa: ${procesosRemotos.length} nuevos`);
  } catch (error) {
    console.log("Error de sync, continuando offline:", error);
  }
};
```

### **🔄 3. Algoritmo de Merge**

```typescript
const mergeProcesos = async (locales: Proceso[], remotos: Proceso[]) => {
  const procesosMap = new Map();

  // 1. Agregar todos los procesos locales
  locales.forEach((proceso) => {
    procesosMap.set(proceso.id, proceso);
  });

  // 2. Procesar procesos remotos
  remotos.forEach((procesoRemoto) => {
    const procesoLocal = procesosMap.get(procesoRemoto.id);

    if (!procesoLocal) {
      // Proceso nuevo - agregar
      procesosMap.set(procesoRemoto.id, {
        ...procesoRemoto,
        origen: "remoto",
      });
    } else if (procesoLocal.origen === "remoto") {
      // Proceso existente remoto - verificar si es más nuevo
      if (
        new Date(procesoRemoto.updated_at) > new Date(procesoLocal.updated_at)
      ) {
        procesosMap.set(procesoRemoto.id, {
          ...procesoRemoto,
          origen: "remoto",
        });
      }
    }
    // Los procesos locales originales nunca se sobrescriben
  });

  return Array.from(procesosMap.values()).sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
};
```

### **👤 4. Flujo de Autenticación**

```typescript
const manejarAgregarProceso = async () => {
  // 1. Verificar si ya está autenticado
  const usuario = supabase.auth.getUser();

  if (!usuario) {
    // 2. Mostrar modal de login
    const credenciales = await mostrarModalLogin();

    // 3. Autenticar con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credenciales.email,
      password: credenciales.password,
    });

    if (error) {
      Alert.alert("Error de autenticación", error.message);
      return;
    }
  }

  // 4. Mostrar formulario de agregar proceso
  setShowAgregarProceso(true);
};
```

### **➕ 5. Flujo de Agregar Proceso**

```typescript
const crearNuevoProceso = async (datos: NuevoProcesoData) => {
  try {
    // 1. Preparar imágenes en Base64
    const imagenesBase64 = await Promise.all(
      datos.imagenes.map(async (imagen) => ({
        nombre: imagen.name,
        data: await convertirABase64(imagen),
        isLocal: false,
        size: imagen.size,
      }))
    );

    // 2. Crear objeto proceso
    const nuevoProceso = {
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      imagenes: imagenesBase64,
    };

    // 3. Guardar en Supabase
    const { data, error } = await supabase
      .from("procesos")
      .insert(nuevoProceso)
      .select()
      .single();

    if (error) throw error;

    // 4. Sincronizar inmediatamente para verlo en la app
    await sincronizarProcesos();

    // 5. Feedback al usuario
    Alert.alert(
      "✅ Proceso agregado",
      "El proceso se ha agregado exitosamente"
    );

    // 6. Cerrar formulario
    setShowAgregarProceso(false);
  } catch (error) {
    Alert.alert("❌ Error", "No se pudo agregar el proceso: " + error.message);
  }
};
```

---

## 📱 Componentes UI Nuevos

### **🔑 1. Modal de Login**

```typescript
interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  // Formulario email/password
  // Botón "Iniciar Sesión"
  // Link "¿Registrarte?" (opcional)
};
```

### **➕ 2. Modal Agregar Proceso**

```typescript
interface AgregarProcesoModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (datos: NuevoProcesoData) => void;
}

const AgregarProcesoModal: React.FC<AgregarProcesoModalProps> = ({ ... }) => {
  // Input: Título del proceso
  // TextArea: Descripción (pasos del proceso)
  // ImagePicker: Seleccionar múltiples imágenes
  // Preview: Vista previa de imágenes seleccionadas
  // Botones: Cancelar / Guardar Proceso
};
```

### **🔄 3. Indicador de Sincronización**

```typescript
const SyncIndicator: React.FC = () => {
  // Icono: 🔄 (sincronizando) | ✅ (sincronizado) | ❌ (error) | 📱 (offline)
  // Texto: "Sincronizando..." | "Actualizado" | "Error de conexión" | "Modo offline"
  // TouchableOpacity: Al tocar, forzar sincronización manual
};
```

---

## 🚀 Plan de Implementación

### **📅 Fase 1: Setup Backend (30-45 min)**

1. ✅ Crear proyecto Supabase gratuito
2. ✅ Configurar tabla `procesos` con RLS
3. ✅ Setup autenticación email/password
4. ✅ Crear usuarios de prueba (4 cuentas)
5. ✅ Probar API desde Postman/navegador

### **📅 Fase 2: Integración Base (1-2 horas)**

1. ✅ Instalar `@supabase/supabase-js`
2. ✅ Crear `supabaseClient.ts`
3. ✅ Implementar funciones de sincronización
4. ✅ Adaptar `getLocalImageSource()` para híbrido
5. ✅ Probar sync manual desde console

### **📅 Fase 3: UI de Autenticación (1 hora)**

1. ✅ Crear `LoginModal` component
2. ✅ Integrar con botón "Agregar Proceso"
3. ✅ Manejar estados de auth (loading, error, success)
4. ✅ Persistir sesión entre reinicios

### **📅 Fase 4: UI Agregar Proceso (1-2 horas)**

1. ✅ Crear `AgregarProcesoModal` component
2. ✅ Implementar `expo-image-picker`
3. ✅ Preview de imágenes seleccionadas
4. ✅ Validación de formulario
5. ✅ Integrar con función `crearNuevoProceso()`

### **📅 Fase 5: UX de Sincronización (30 min)**

1. ✅ Agregar `SyncIndicator` al header
2. ✅ Sincronización automática al abrir app
3. ✅ Botón "pull to refresh" manual
4. ✅ Feedback visual de estados

### **📅 Fase 6: Testing y Polish (30 min)**

1. ✅ Probar flujo completo offline → online
2. ✅ Probar con múltiples usuarios
3. ✅ Verificar manejo de errores
4. ✅ Optimizar UX y mensajes

---

## 🔧 Configuración Técnica

### **🔹 Variables de Entorno**

```typescript
// supabaseConfig.ts
export const supabaseConfig = {
  url: "https://tu-proyecto.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  // Estas son públicas, no necesitan .env para demo
};
```

### **🔹 Dependencias Nuevas**

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "expo-image-picker": "~14.7.1",
    "@react-native-async-storage/async-storage": "1.21.0"
  }
}
```

### **🔹 Permisos Android**

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.CAMERA" />
```

---

## ✅ Criterios de Éxito

### **🎯 Funcional:**

- ✅ App funciona 100% offline con datos actuales
- ✅ Sincronización automática al conectarse
- ✅ 4 usuarios pueden agregar procesos autenticados
- ✅ Nuevos procesos aparecen en todos los dispositivos
- ✅ Imágenes se cargan correctamente (locales + remotas)

### **🎯 Técnico:**

- ✅ No rompe funcionalidad existente
- ✅ procesos.json mantiene compatibilidad
- ✅ Manejo robusto de errores de red
- ✅ UI/UX consistente con diseño actual

### **🎯 Presentación:**

- ✅ Demo offline impresiona
- ✅ Agregar proceso en vivo es wow factor
- ✅ Múltiples usuarios demuestran colaboración
- ✅ Cero costo = viabilidad real

---

## 🚨 Consideraciones y Limitaciones

### **⚠️ Limitaciones Técnicas:**

- **Tamaño máximo:** 1MB total de imágenes por proceso
- **Usuarios concurrentes:** 4 máximo (plan gratuito)
- **Requests:** 50k/mes (suficiente para demo)
- **Storage:** 1GB total (más que suficiente)

### **⚠️ Fallbacks:**

- **Sin internet:** Funciona normal con datos locales
- **Error de auth:** Mensaje claro, no bloquea lectura
- **Error de sync:** Log en console, continúa offline
- **Supabase down:** App sigue funcionando normalmente

### **⚠️ Seguridad:**

- **RLS habilitado:** Solo lecturas públicas, escrituras autenticadas
- **No datos sensibles:** Solo procesos industriales públicos
- **Validación client-side:** Tamaño de archivos, formatos

---

_📝 Documento creado para guiar la implementación de sincronización en el Asistente de Fábrica MERCAPLAS - Universidad [Nombre] - 2024_
