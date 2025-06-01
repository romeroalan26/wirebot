import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  TextInput,
  Modal,
  StatusBar,
  Platform,
  Image,
  Dimensions,
  FlatList,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import {
  sincronizarProcesos,
  Proceso as ProcesoSincronizado,
  cargarProcesosCache,
} from "./syncService";
import { OptionsMenu } from "./src/components/OptionsMenu";
import { LoginModal } from "./src/components/LoginModal";
import { AgregarProcesoModal } from "./src/components/AgregarProcesoModal";
import { supabase } from "./supabaseClient";

interface Proceso {
  titulo: string;
  descripcion: string;
  imagenes: string[];
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

const AsistenteVoz: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [procesos, setProcesos] = useState<Proceso[]>([]);
  const [procesoSeleccionado, setProcesoSeleccionado] =
    useState<Proceso | null>(null);
  const [error, setError] = useState<string>("");
  const [transcripcion, setTranscripcion] = useState<string>("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualText, setManualText] = useState("");
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [showVoiceConfig, setShowVoiceConfig] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [imagenAmpliada, setImagenAmpliada] = useState<{
    imagenes: string[];
    indiceActual: number;
  } | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showAgregarProceso, setShowAgregarProceso] = useState(false);

  // Solo configuración de velocidad de voz - idioma fijo es-MX
  const [voiceSpeed, setVoiceSpeed] = useState(0.75); // Velocidad por defecto

  // Configurar event listeners de reconocimiento de voz
  useSpeechRecognitionEvent("start", () => {
    console.log("🎤 Reconocimiento iniciado");
    setIsListening(true);
    setTranscripcion("🎤 Escuchando... Habla ahora");
  });

  useSpeechRecognitionEvent("end", () => {
    console.log("🛑 Reconocimiento terminado");
    setIsListening(false);
  });

  useSpeechRecognitionEvent("result", (event) => {
    console.log("📝 Resultado recibido:", event);
    if (event.results && event.results.length > 0) {
      const textoReconocido = event.results[0]?.transcript;
      console.log("✅ Texto reconocido:", textoReconocido);
      setTranscripcion(`Reconocido: "${textoReconocido}"`);

      if (event.isFinal) {
        console.log("🎯 Resultado final, procesando...");
        procesarComandoVoz(textoReconocido.toLowerCase());
      }
    }
  });

  useSpeechRecognitionEvent("error", (event) => {
    console.error("❌ Error en reconocimiento:", event);

    // Traducir errores comunes al español
    let mensajeError = "";
    const errorOriginal = event.message || event.error || "";

    if (
      errorOriginal.toLowerCase().includes("no speech") ||
      errorOriginal.toLowerCase().includes("speech not detected")
    ) {
      mensajeError =
        "🤫 No se detectó voz. Intenta hablar más cerca del micrófono.";
    } else if (
      errorOriginal.toLowerCase().includes("network") ||
      errorOriginal.toLowerCase().includes("internet")
    ) {
      mensajeError = "🌐 Error de conexión. Verifica tu conexión a internet.";
    } else if (
      errorOriginal.toLowerCase().includes("permission") ||
      errorOriginal.toLowerCase().includes("denied")
    ) {
      mensajeError =
        "🎤 Sin permisos de micrófono. Ve a configuración para habilitarlos.";
    } else if (
      errorOriginal.toLowerCase().includes("timeout") ||
      errorOriginal.toLowerCase().includes("time")
    ) {
      mensajeError =
        "⏰ Tiempo agotado. Intenta presionar el botón e hablar inmediatamente.";
    } else if (
      errorOriginal.toLowerCase().includes("busy") ||
      errorOriginal.toLowerCase().includes("in use")
    ) {
      mensajeError =
        "🔄 Micrófono ocupado. Espera un momento e intenta nuevamente.";
    } else if (
      errorOriginal.toLowerCase().includes("recognizer") ||
      errorOriginal.toLowerCase().includes("recognition")
    ) {
      mensajeError = "🎯 Error en el reconocimiento. Intenta hablar más claro.";
    } else {
      // Error genérico en español
      mensajeError = `❌ Error de reconocimiento: ${
        errorOriginal || "Error desconocido"
      }`;
    }

    setError(mensajeError);
    setIsListening(false);
    setTranscripcion("");
  });

  // Cargar datos de procesos al inicializar el componente
  useEffect(() => {
    console.log("🚀 Iniciando AsistenteVoz...");
    cargarProcesos();
    verificarPermisos();
  }, []);

  const verificarPermisos = async () => {
    try {
      console.log("🔍 Verificando permisos...");

      // Primero verificar el estado actual
      const status = await ExpoSpeechRecognitionModule.getPermissionsAsync();
      console.log("📱 Estado actual de permisos:", status);

      if (status.granted) {
        console.log("✅ Permisos ya concedidos");
        setPermissionGranted(true);
        setError("");
        return;
      }

      // Si no tiene permisos, solicitarlos
      console.log("🙋 Solicitando permisos...");
      const result =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      console.log("📱 Resultado de solicitud:", result);

      setPermissionGranted(result.granted);

      if (!result.granted) {
        console.log("❌ Permisos denegados por el usuario");

        // Mostrar mensaje más claro al usuario
        Alert.alert(
          "⚠️ Permisos Requeridos",
          "Esta aplicación necesita acceso al micrófono para funcionar.\n\n" +
            "Para habilitar los permisos:\n" +
            "1. Ve a Configuración del dispositivo\n" +
            "2. Busca esta aplicación\n" +
            "3. Habilita el permiso de Micrófono\n\n" +
            "¿Quieres abrir la configuración ahora?",
          [
            { text: "Más tarde", style: "cancel" },
            {
              text: "Abrir Configuración",
              onPress: () => {
                // En una app real, aquí abriríamos la configuración
                console.log("🔧 Debería abrir configuración del sistema");
                Alert.alert(
                  "💡 Instrucciones",
                  "Ve manualmente a Configuración > Aplicaciones > Asistente Fábrica > Permisos > Micrófono"
                );
              },
            },
          ]
        );

        setError(
          "⚠️ Permisos de micrófono requeridos para usar reconocimiento de voz"
        );
      } else {
        console.log("✅ Permisos concedidos exitosamente");
        setError("");
      }
    } catch (err) {
      console.error("❌ Error al verificar permisos:", err);
      setError("❌ Error al verificar permisos de micrófono");
    }
  };

  const cargarProcesos = async () => {
    try {
      console.log("📂 Cargando procesos...");

      // 1. Cargar procesos desde cache local
      const procesosLocales = await cargarProcesosCache();

      // Convertir ProcesoSincronizado a Proceso (formato compatible)
      const procesosCompatibles: Proceso[] = procesosLocales.map((proceso) => ({
        titulo: proceso.titulo,
        descripcion: proceso.descripcion,
        imagenes: proceso.imagenes.map((img) => img.data), // Solo el nombre/data
      }));

      setProcesos(procesosCompatibles);
      console.log(`✅ ${procesosCompatibles.length} procesos cargados`);

      // 2. Intentar sincronizar en segundo plano
      const { procesos: procesosSincronizados, nuevos } =
        await sincronizarProcesos();
      if (nuevos > 0) {
        console.log(`🔄 ${nuevos} procesos nuevos sincronizados`);
        const procesosSincronizadosCompatibles = procesosSincronizados.map(
          (proceso) => ({
            titulo: proceso.titulo,
            descripcion: proceso.descripcion,
            imagenes: proceso.imagenes.map((img) => img.data),
          })
        );
        setProcesos(procesosSincronizadosCompatibles);
      }
    } catch (error) {
      console.error("❌ Error cargando procesos:", error);
      setError("❌ Error cargando datos de procesos");

      // Fallback: cargar datos del cache
      try {
        const procesosCache = await cargarProcesosCache();
        const procesosCompatibles = procesosCache.map((proceso) => ({
          titulo: proceso.titulo,
          descripcion: proceso.descripcion,
          imagenes: proceso.imagenes.map((img) => img.data),
        }));
        setProcesos(procesosCompatibles);
        console.log("🔄 Fallback a datos del cache exitoso");
      } catch (fallbackError) {
        console.error("❌ Error en fallback:", fallbackError);
      }
    }
  };

  const procesarComandoVoz = (texto: string) => {
    console.log("🎙️ Procesando comando de voz:", texto);
    const textoLimpio = texto.toLowerCase().trim();

    // 1. BUSCAR POR NOMBRE DE PROCESO
    const procesoEncontrado = buscarProceso(textoLimpio);
    if (procesoEncontrado) {
      mostrarProceso(procesoEncontrado);
      return;
    }

    // 2. COMANDOS ESPECIALES
    if (manejarComandosEspeciales(textoLimpio)) {
      return;
    }

    // 3. NO SE ENCONTRÓ NADA - SUGERENCIAS INTELIGENTES
    console.log("❌ No se detectó comando válido en:", texto);
    const sugerencia = generarSugerenciaInteligente(textoLimpio);
    setError(`No se reconoció el comando "${texto}". ${sugerencia}`);
    hablar(`No se reconoció el comando. ${sugerencia}`);
  };

  const buscarProceso = (texto: string): Proceso | null => {
    console.log("🔍 Buscando proceso en texto:", texto);

    // Patrones para buscar procesos específicos
    const patrones = [
      // TREFILADORA/OCTAVIN
      {
        palabras: ["trefiladora", "octavin", "octavín", "trefilar"],
        buscar: ["octavin", "trefiladora"],
      },

      // GALVANIZADO
      {
        palabras: ["galvanizado", "galvanizar", "zinc", "galvan"],
        buscar: ["galvanizado"],
      },

      // RECOCIDO
      {
        palabras: ["recocido", "recocer", "horno", "temple", "ablandar"],
        buscar: ["recocido"],
      },

      // CONTROL DE CALIDAD
      {
        palabras: [
          "calidad",
          "control",
          "medicion",
          "medición",
          "prueba",
          "ensayo",
          "awg",
        ],
        buscar: ["control", "calidad"],
      },

      // ENROLLADO
      {
        palabras: ["enrollado", "enrollar", "bobina", "carrete", "h6"],
        buscar: ["enrollado", "bobina"],
      },
    ];

    // Buscar por patrones específicos
    for (const patron of patrones) {
      for (const palabra of patron.palabras) {
        if (texto.includes(palabra)) {
          console.log(`✅ Palabra clave encontrada: ${palabra}`);

          // Buscar proceso que contenga alguna de las palabras de búsqueda
          for (const busqueda of patron.buscar) {
            const proceso = procesos.find((p) =>
              p.titulo.toLowerCase().includes(busqueda)
            );
            if (proceso) {
              console.log(`✅ Proceso encontrado: ${proceso.titulo}`);
              return proceso;
            }
          }
        }
      }
    }

    // Patrones de comandos generales
    const patronesGenerales = [
      /(?:proceso|cómo|como)\s*(?:de|del|de\s*la)?\s*(?:trefiladora|trefilar|octavin|octavín|galvanizado|recocido|calidad|enrollado)/gi,
      /(?:qué|que)\s*(?:hago|proceso|procedimiento)\s*(?:para|de|del)?\s*(?:trefilar|galvanizar|recocer|controlar|enrollar)/gi,
      /(?:procedimiento|método|pasos)\s*(?:para|de|del)?\s*(?:trefiladora|galvanizado|recocido|calidad|enrollado)/gi,
    ];

    for (const patron of patronesGenerales) {
      if (patron.test(texto)) {
        console.log(
          "✅ Patrón general encontrado, buscando primer proceso disponible"
        );
        if (procesos.length > 0) {
          return procesos[0]; // Devolver el primer proceso si no hay coincidencia específica
        }
      }
      patron.lastIndex = 0; // Reset regex
    }

    // Búsqueda fuzzy por palabras clave en títulos
    for (const proceso of procesos) {
      const tituloLower = proceso.titulo.toLowerCase();
      const palabrasTexto = texto.split(/\s+/);

      for (const palabra of palabrasTexto) {
        if (palabra.length > 3 && tituloLower.includes(palabra)) {
          console.log(
            `✅ Coincidencia fuzzy encontrada: ${palabra} en ${proceso.titulo}`
          );
          return proceso;
        }
      }
    }

    console.log("❌ No se encontró proceso para:", texto);
    return null;
  };

  const mostrarProceso = (proceso: Proceso) => {
    console.log("💬 Mostrando proceso:", proceso.titulo);
    setProcesoSeleccionado(proceso);
    setError("");
    hablar(proceso.descripcion);
  };

  const manejarComandosEspeciales = (texto: string): boolean => {
    // Comandos de ayuda
    if (
      texto.includes("ayuda") ||
      texto.includes("help") ||
      texto.includes("como usar")
    ) {
      mostrarAyuda();
      return true;
    }

    // Listar todos los procesos
    if (
      texto.includes("lista") ||
      texto.includes("todos") ||
      texto.includes("disponibles")
    ) {
      listarTodosLosProcesos();
      return true;
    }

    return false;
  };

  const mostrarAyuda = () => {
    const mensaje = `Puedes usar comandos como: "proceso OCTAVIN", "cómo hacer trefiladora", "dame información del OCTAVIN", "cuál proceso uso para trefiladora", o simplemente di el nombre.`;
    setError(mensaje);
    hablar(mensaje);
  };

  const listarTodosLosProcesos = () => {
    const lista = procesos.map((p) => `Proceso: ${p.titulo}`).join(", ");
    const mensaje = `Procesos disponibles: ${lista}`;
    setError(mensaje);
    hablar(
      `Tenemos ${procesos.length} tipos de procesos disponibles. ${lista}`
    );
  };

  const generarSugerenciaInteligente = (texto: string): string => {
    const sugerencias = [
      'Intenta decir "proceso OCTAVIN" o "cómo hacer trefiladora"',
      'Puedes preguntar "proceso de galvanizado" o "cómo galvanizar alambre"',
      'También puedes decir "proceso de recocido" o "cómo recocer alambre"',
      'Pregunta "control de calidad" o "cómo controlar la calidad"',
      'Di "proceso de enrollado" o "cómo enrollar en bobinas"',
      'Pregunta natural como "qué proceso necesito para galvanizar"',
    ];

    // Sugerencias específicas basadas en palabras detectadas
    if (texto.includes("trefilar") || texto.includes("octavin")) {
      return 'Detecté que preguntas sobre trefilado. Intenta decir "proceso OCTAVIN" o "trefiladora principal".';
    }

    if (texto.includes("galvan") || texto.includes("zinc")) {
      return 'Detecté que preguntas sobre galvanizado. Intenta decir "proceso de galvanizado" o "galvanizar alambre".';
    }

    if (
      texto.includes("horno") ||
      texto.includes("recocer") ||
      texto.includes("temple")
    ) {
      return 'Detecté que preguntas sobre recocido. Intenta decir "proceso de recocido" o "recocer alambre".';
    }

    if (
      texto.includes("calidad") ||
      texto.includes("control") ||
      texto.includes("medicion")
    ) {
      return 'Detecté que preguntas sobre control. Intenta decir "control de calidad" o "proceso de control".';
    }

    if (
      texto.includes("bobina") ||
      texto.includes("enrollar") ||
      texto.includes("carrete")
    ) {
      return 'Detecté que preguntas sobre enrollado. Intenta decir "proceso de enrollado" o "enrollar bobinas".';
    }

    // Si contiene números pero no reconocidos, sugerir formato correcto
    if (/\d+/.test(texto)) {
      return 'Detecté un número. Los procesos se buscan por nombre, como "proceso OCTAVIN" o "galvanizado".';
    }

    // Si menciona aplicaciones pero no reconocidas
    if (texto.includes("para") || texto.includes("usar")) {
      return 'Puedes buscar por proceso como "proceso para galvanizar" o "proceso para trefilar".';
    }

    // Sugerencia aleatoria
    return sugerencias[Math.floor(Math.random() * sugerencias.length)];
  };

  // Función para obtener la configuración de voz - siempre es-MX
  const obtenerConfiguracionVozLatina = () => {
    console.log("🎤 Configurando voz es-MX:", {
      language: "es-MX",
      speed: voiceSpeed,
    });

    return {
      language: "es-MX",
      pitch: 1.2,
      rate: voiceSpeed,
    };
  };

  const hablar = (texto: string) => {
    try {
      // Detener cualquier síntesis previa
      Speech.stop();

      console.log("🔊 === INICIANDO SÍNTESIS DE VOZ ===");
      console.log("📝 Texto:", texto.substring(0, 100) + "...");

      setIsSpeaking(true);

      // Configuración simplificada y confiable
      const configuracion = obtenerConfiguracionVozLatina();

      console.log("🎤 Configuración de voz:", configuracion);

      Speech.speak(texto, {
        ...configuracion,
        onStart: () => {
          console.log("🔊 Síntesis de voz INICIADA");
          setIsSpeaking(true);
        },
        onDone: () => {
          console.log("✅ Síntesis de voz COMPLETADA");
          setIsSpeaking(false);
        },
        onStopped: () => {
          console.log("⏹️ Síntesis de voz DETENIDA");
          setIsSpeaking(false);
        },
        onError: (error) => {
          console.error("❌ Error en síntesis de voz:", error);
          setIsSpeaking(false);

          // Intentar con configuración mínima
          setTimeout(() => {
            console.log("🔄 Reintentando con configuración mínima...");
            Speech.speak(texto, {
              language: "es",
              rate: 0.8,
              onStart: () => setIsSpeaking(true),
              onDone: () => setIsSpeaking(false),
              onError: (fallbackError) => {
                console.error("❌ Error en segundo intento:", fallbackError);
                setIsSpeaking(false);
                setError(
                  "Error en síntesis de voz. Verifica el volumen del dispositivo."
                );
              },
            });
          }, 500);
        },
      });
    } catch (error) {
      console.error("❌ Error general en síntesis de voz:", error);
      setIsSpeaking(false);
      setError("Error al inicializar síntesis de voz.");
    }
  };

  const detenerVoz = () => {
    try {
      console.log("⏹️ Deteniendo síntesis de voz");
      Speech.stop();
      setIsSpeaking(false);
    } catch (error) {
      console.error("❌ Error al detener síntesis de voz:", error);
      setIsSpeaking(false);
    }
  };

  const iniciarReconocimientoVoz = async () => {
    console.log("🎤 === INICIANDO RECONOCIMIENTO DE VOZ ===");

    try {
      if (!permissionGranted) {
        console.log("❌ No hay permisos, solicitando...");
        await verificarPermisos();
        return;
      }

      console.log("✅ Iniciando reconocimiento...");

      // Limpiar estados
      setError("");
      setTranscripcion("");
      setProcesoSeleccionado(null);

      // Configurar opciones de reconocimiento
      const options = {
        lang: "es-ES",
        interimResults: true,
        maxAlternatives: 3,
        continuous: false,
        requiresOnDeviceRecognition: false,
        androidIntentOptions: {
          EXTRA_LANGUAGE_MODEL: "web_search" as "web_search",
        },
      };

      console.log("🔧 Configurando reconocimiento con opciones:", options);

      // Iniciar reconocimiento
      ExpoSpeechRecognitionModule.start(options);
    } catch (error) {
      console.error("❌ Error al iniciar reconocimiento de voz:", error);
      setError(
        "Error al iniciar el reconocimiento de voz. Intenta nuevamente."
      );
      setIsListening(false);
    }
  };

  const detenerReconocimiento = () => {
    console.log("🛑 === DETENIENDO RECONOCIMIENTO ===");
    try {
      ExpoSpeechRecognitionModule.stop();
      console.log("✅ Reconocimiento detenido");
    } catch (error) {
      console.error("❌ Error al detener reconocimiento:", error);
    }
  };

  const procesarTextoManual = () => {
    if (manualText.trim()) {
      console.log("📝 Procesando texto manual:", manualText);
      setTranscripcion(`Procesando: "${manualText}"`);
      procesarComandoVoz(manualText.toLowerCase());
      setShowManualInput(false);
      setManualText("");
    }
  };

  const manejarPresionBoton = () => {
    console.log("👆 === BOTÓN PRESIONADO ===");
    console.log(
      "Estado actual - permissionGranted:",
      permissionGranted,
      "isListening:",
      isListening,
      "isSpeaking:",
      isSpeaking
    );

    // Detener la voz si está hablando
    if (isSpeaking) {
      console.log("🔊 Deteniendo síntesis de voz antes de usar micrófono");
      detenerVoz();
    }

    if (!permissionGranted) {
      console.log("🔒 No hay permisos, verificando...");
      verificarPermisos();
      return;
    }

    if (isListening) {
      console.log("🛑 Reconocimiento activo, deteniendo...");
      detenerReconocimiento();
    } else {
      console.log("🎤 Iniciando nuevo reconocimiento...");
      iniciarReconocimientoVoz();
    }
  };

  const mostrarSelectorRapido = () => {
    console.log("📋 Mostrando selector rápido");
    setShowListModal(true);
  };

  const seleccionarProcesoDeModal = (titulo: string) => {
    setShowListModal(false);
    const proceso = procesos.find(
      (p) => p.titulo.toLowerCase() === titulo.toLowerCase()
    );
    if (proceso) {
      mostrarProceso(proceso);
    }
  };

  const limpiarPantalla = () => {
    console.log("🧹 Limpiando pantalla");
    setProcesoSeleccionado(null);
    setError("");
    setTranscripcion("");
    if (isSpeaking) {
      detenerVoz();
    }
    if (isListening) {
      detenerReconocimiento();
    }
  };

  // Función para detectar voces disponibles
  const detectarVocesDisponibles = async () => {
    try {
      console.log("🔍 Detectando voces disponibles...");

      // Intentar obtener voces disponibles (si Expo Speech lo soporta)
      const voices = await Speech.getAvailableVoicesAsync();
      console.log("🎤 Voces disponibles:", voices);

      // Filtrar voces en español
      const vocesEspanol = voices.filter(
        (voice) =>
          voice.language.startsWith("es") || voice.identifier.includes("es")
      );

      console.log("🇪🇸 Voces en español encontradas:", vocesEspanol);

      return vocesEspanol;
    } catch (error) {
      console.log("❌ Error detectando voces (función no disponible):", error);
      return [];
    }
  };

  const getLocalImageSource = (imageName: string, isLocal: boolean = true) => {
    // Si es imagen local (assets), usar require
    if (isLocal) {
      // Mapeo de nombres de imágenes locales a archivos
      const imageMap: { [key: string]: any } = {
        "trefiladora-octavin-1": require("./assets/images/trefiladora-octavin-1.jpg"),
        "trefiladora-octavin-2": require("./assets/images/trefiladora-octavin-2.jpg"),
        "trefiladora-octavin-3": require("./assets/images/trefiladora-octavin-3.jpg"),
        "trefiladora-octavin-4": require("./assets/images/trefiladora-octavin-4.jpg"),
      };

      return imageMap[imageName] || null;
    } else {
      // Si es imagen remota (Base64), usar directamente
      if (imageName.startsWith("data:image/")) {
        return { uri: imageName };
      } else {
        // Fallback para URLs externas
        return { uri: imageName };
      }
    }
  };

  const abrirVisorImagenes = (imagenes: string[], indice: number) => {
    setImagenAmpliada({ imagenes, indiceActual: indice });
  };

  const cerrarVisorImagenes = () => {
    setImagenAmpliada(null);
  };

  const navegarImagen = (direccion: "anterior" | "siguiente") => {
    if (!imagenAmpliada) return;

    const { imagenes, indiceActual } = imagenAmpliada;
    let nuevoIndice = indiceActual;

    if (direccion === "anterior") {
      nuevoIndice = indiceActual > 0 ? indiceActual - 1 : imagenes.length - 1;
    } else {
      nuevoIndice = indiceActual < imagenes.length - 1 ? indiceActual + 1 : 0;
    }

    setImagenAmpliada({ imagenes, indiceActual: nuevoIndice });
  };

  const handleLoginSuccess = (user: any) => {
    console.log("✅ Login exitoso:", user);
    setShowAgregarProceso(true);
  };

  const handleAgregarProceso = async (datos: NuevoProcesoData) => {
    try {
      // 1. Obtener el usuario actual
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("No hay usuario autenticado");
      }

      // 2. Convertir imágenes a Base64
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

      // 3. Crear objeto proceso
      const nuevoProceso = {
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        imagenes: imagenesBase64,
        created_by: user.id,
      };

      // 4. Guardar en Supabase
      const { data, error } = await supabase
        .from("procesos")
        .insert(nuevoProceso)
        .select()
        .single();

      if (error) throw error;

      // 5. Forzar sincronización inmediata
      console.log("🔄 Forzando sincronización después de agregar proceso...");
      const resultado = await sincronizarProcesos();

      if (resultado.error) {
        console.warn("⚠️ Error en sincronización:", resultado.error);
        Alert.alert(
          "⚠️ Advertencia",
          "El proceso se guardó pero hubo un error al sincronizar. Los cambios se verán reflejados en la próxima sincronización exitosa."
        );
      } else {
        console.log(
          `✅ Sincronización exitosa: ${resultado.nuevos} procesos nuevos`
        );
        Alert.alert(
          "✅ Éxito",
          "Proceso agregado y sincronizado correctamente"
        );
      }

      // 6. Actualizar UI y cerrar modal
      setShowAgregarProceso(false);

      // 7. Recargar procesos en la UI
      await cargarProcesos();
    } catch (error: any) {
      Alert.alert(
        "❌ Error",
        "No se pudo agregar el proceso: " + error.message
      );
    }
  };

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#1E40AF"
        translucent={false}
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.statusBarBackground} />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <View style={styles.header}>
            {/* Barra superior con menú */}
            <View style={styles.topBar}>
              <View style={styles.topBarLeft}>
                {/* Espacio reservado para balance visual */}
              </View>

              <View style={styles.topBarRight}>
                <TouchableOpacity
                  style={styles.botonMenu}
                  onPress={() => setShowOptionsMenu(true)}
                >
                  <Ionicons
                    name="ellipsis-vertical"
                    size={24}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sección de títulos centrados */}
            <View style={styles.titleSection}>
              <Text style={styles.titulo}>MERCAPLAS</Text>
              <Text style={styles.subtitulo}>
                Asistente de Fábrica • Control por Voz
              </Text>
            </View>
          </View>

          {!permissionGranted && (
            <View style={styles.warningContainer}>
              <Ionicons name="warning-outline" size={24} color="#FF9800" />
              <View style={styles.warningTextContainer}>
                <Text style={styles.warningText}>
                  Se requieren permisos de micrófono para usar la función de voz
                </Text>
                <TouchableOpacity
                  style={styles.botonPermisos}
                  onPress={verificarPermisos}
                >
                  <Ionicons name="mic-outline" size={16} color="#fff" />
                  <Text style={styles.textoBotonPermisos}>
                    Solicitar Permisos
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.botonesContainer}>
            {/* Botón principal de micrófono */}
            <TouchableOpacity
              style={[
                styles.botonMicrofono,
                isListening && styles.botonEscuchando,
                !permissionGranted && styles.botonDeshabilitado,
              ]}
              onPress={manejarPresionBoton}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isListening ? "mic" : "mic-outline"}
                size={64}
                color={
                  isListening
                    ? "#FFFFFF"
                    : permissionGranted
                    ? "#203289"
                    : "#9CA3AF"
                }
              />
            </TouchableOpacity>

            <Text style={styles.textoBoton}>
              {isSpeaking
                ? "Hablando... 🔊"
                : isListening
                ? "Escuchando... 🎤"
                : !permissionGranted
                ? "Permisos requeridos"
                : "Presiona para hablar"}
            </Text>

            {/* Debug info - Solo visible en desarrollo */}
            {__DEV__ && (
              <Text style={styles.debugText}>
                Debug: Permisos={permissionGranted ? "✅" : "❌"} | Escuchando=
                {isListening ? "🎤" : "⏸️"} | Hablando=
                {isSpeaking ? "🔊" : "🔇"}
              </Text>
            )}

            {/* Botón para detener voz cuando está hablando */}
            {isSpeaking && (
              <TouchableOpacity
                style={styles.botonDetenerVoz}
                onPress={detenerVoz}
                activeOpacity={0.7}
              >
                <Ionicons name="stop-circle" size={28} color="#FFFFFF" />
                <Text style={styles.textoDetenerVoz}>Detener Voz</Text>
              </TouchableOpacity>
            )}

            {/* Botones de acceso rápido */}
            <View style={styles.botonesRapidos}>
              <TouchableOpacity
                style={styles.botonRapido}
                onPress={() => setShowManualInput(true)}
              >
                <Ionicons name="create-outline" size={20} color="#64748B" />
                <Text style={styles.textoBotonRapido}>Texto</Text>
              </TouchableOpacity>
            </View>
          </View>

          {transcripcion !== "" && (
            <View style={styles.transcripcionContainer}>
              <Text style={styles.transcripcionLabel}>Estado:</Text>
              <Text style={styles.transcripcionTexto}>{transcripcion}</Text>
            </View>
          )}

          {error !== "" && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={24} color="#F44336" />
              <Text style={styles.errorTexto}>{error}</Text>
            </View>
          )}

          {procesoSeleccionado && (
            <View style={styles.resultadoContainer}>
              <Text style={styles.resultadoTitulo}>
                Información del Proceso
              </Text>

              <View style={styles.datosContainer}>
                {/* Datos básicos destacados */}
                <View style={[styles.datoItem, styles.datoDestacado]}>
                  <View style={styles.tituloContainer}>
                    <Text style={styles.datoLabel}>🔌 Título:</Text>
                    <Text style={[styles.datoValor, styles.tituloDestacado]}>
                      {procesoSeleccionado.titulo}
                    </Text>
                  </View>
                </View>

                {/* Sección de descripción */}
                <Text style={styles.seccionTitulo}>📋 DESCRIPCIÓN</Text>

                <View style={[styles.datoItem, styles.descripcionItem]}>
                  <Text style={styles.datoLabel}>🔩 Descripción:</Text>
                  <Text style={styles.descripcionTexto}>
                    {procesoSeleccionado.descripcion}
                  </Text>
                </View>

                {/* Sección de imágenes */}
                <Text style={styles.seccionTitulo}>🖼️ IMÁGENES</Text>

                {procesoSeleccionado.imagenes &&
                procesoSeleccionado.imagenes.length > 0 ? (
                  <View style={styles.imagenesContainer}>
                    {procesoSeleccionado.imagenes.map((imagen, index) => {
                      const localImageSource = getLocalImageSource(imagen);
                      return (
                        <TouchableOpacity
                          key={index}
                          style={styles.imagenWrapper}
                          onPress={() =>
                            abrirVisorImagenes(
                              procesoSeleccionado.imagenes,
                              index
                            )
                          }
                          activeOpacity={0.8}
                        >
                          <Image
                            source={
                              localImageSource
                                ? localImageSource
                                : { uri: imagen }
                            }
                            style={styles.imagenProceso}
                            resizeMode="contain"
                          />
                          <View style={styles.imagenFooter}>
                            <Text style={styles.imagenNumero}>
                              Imagen {index + 1}
                            </Text>
                            <Ionicons
                              name="expand-outline"
                              size={16}
                              color="#FFFFFF"
                            />
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={styles.datoValor}>
                    No hay imágenes disponibles
                  </Text>
                )}
              </View>

              <View style={styles.botonesAccion}>
                <TouchableOpacity
                  style={[
                    styles.botonLeerNuevamente,
                    isSpeaking && styles.botonLeerDeshabilitado,
                  ]}
                  onPress={() => mostrarProceso(procesoSeleccionado)}
                  disabled={isSpeaking}
                >
                  <Ionicons
                    name={isSpeaking ? "volume-high" : "volume-high-outline"}
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.textoBotonLeer}>
                    {isSpeaking ? "Reproduciendo..." : "Leer nuevamente"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.botonLimpiarNuevo}
                  onPress={limpiarPantalla}
                >
                  <Ionicons name="refresh-outline" size={20} color="#64748B" />
                  <Text style={styles.textoBotonLimpiar}>Nueva consulta</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Modal para entrada manual */}
        <Modal
          visible={showManualInput}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowManualInput(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitulo}>Ingresa tu comando</Text>
              <Text style={styles.modalSubtitulo}>
                Ejemplo: "proceso OCTAVIN" o simplemente "trefiladora"
              </Text>

              <TextInput
                style={styles.textInput}
                value={manualText}
                onChangeText={setManualText}
                placeholder='Escribe "proceso OCTAVIN"'
                autoFocus={true}
              />

              <View style={styles.modalBotones}>
                <TouchableOpacity
                  style={[styles.modalBoton, styles.modalBotonCancelar]}
                  onPress={() => setShowManualInput(false)}
                >
                  <Text style={styles.textoModalBoton}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBoton, styles.modalBotonProcesar]}
                  onPress={procesarTextoManual}
                >
                  <Text style={[styles.textoModalBoton, { color: "#fff" }]}>
                    Buscar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal de instrucciones */}
        <Modal
          visible={showInstructions}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowInstructions(false)}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, styles.modalInstrucciones]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitulo}>📖 Guía de Uso</Text>
                <TouchableOpacity
                  style={styles.botonCerrarModal}
                  onPress={() => setShowInstructions(false)}
                >
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.instruccionesScroll}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.categoriaTexto}>
                  🔧 Preguntas de Fabricación:
                </Text>
                <Text style={styles.ejemploTexto}>
                  • "dame los diámetros para alambre 10"
                </Text>
                <Text style={styles.ejemploTexto}>
                  • "qué bobina necesito para alambre 12"
                </Text>
                <Text style={styles.ejemploTexto}>
                  • "cómo configuro la máquina para alambre 14"
                </Text>
                <Text style={styles.ejemploTexto}>
                  • "qué materiales lleva el alambre 16"
                </Text>

                <Text style={styles.categoriaTexto}>
                  ⚙️ Configuración Técnica:
                </Text>
                <Text style={styles.ejemploTexto}>
                  • "cuál es la velocidad del alambre 10"
                </Text>
                <Text style={styles.ejemploTexto}>
                  • "qué tensión usa el alambre 12"
                </Text>
                <Text style={styles.ejemploTexto}>
                  • "cuántos amperes aguanta el alambre 14"
                </Text>

                <Text style={styles.categoriaTexto}>📋 Proceso Completo:</Text>
                <Text style={styles.ejemploTexto}>
                  • "cómo fabrico alambre número 10"
                </Text>
                <Text style={styles.ejemploTexto}>
                  • "proceso completo alambre 12"
                </Text>

                <Text style={styles.categoriaTexto}>🎯 Búsquedas Rápidas:</Text>
                <Text style={styles.ejemploTexto}>
                  • "alambre para iluminación"
                </Text>
                <Text style={styles.ejemploTexto}>
                  • "lista todos los alambres"
                </Text>

                <Text style={styles.infoTexto}>
                  💡 Pregunta como si estuvieras hablando con un supervisor
                  experimentado de MERCAPLAS. El sistema entiende preguntas
                  específicas sobre fabricación y te dará respuestas detalladas
                  paso a paso.
                </Text>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal de lista de procesos */}
        <Modal
          visible={showListModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowListModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, styles.modalLista]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitulo}>📋 Seleccionar Proceso</Text>
                <TouchableOpacity
                  style={styles.botonCerrarModal}
                  onPress={() => setShowListModal(false)}
                >
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitulo}>
                Elige el nombre de proceso que necesitas:
              </Text>

              {procesos.length === 0 ? (
                <View style={styles.sinProcesosContainer}>
                  <View style={styles.sinProcesosContent}>
                    <Ionicons
                      name="document-text-outline"
                      size={48}
                      color="#94A3B8"
                    />
                    <Text style={styles.sinProcesosTitulo}>
                      No hay procesos disponibles
                    </Text>
                    <Text style={styles.sinProcesosDescripcion}>
                      No se encontraron procesos en la base de datos. Puedes
                      agregar nuevos procesos usando la opción "Agregar Proceso"
                      en el menú.
                    </Text>
                  </View>
                </View>
              ) : (
                <FlatList
                  data={procesos}
                  keyExtractor={(item) => item.titulo}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.itemProceso}
                      onPress={() => seleccionarProcesoDeModal(item.titulo)}
                    >
                      <View style={styles.numeroCirculo}>
                        <Text style={styles.numeroTexto}>{item.titulo}</Text>
                      </View>
                      <View style={styles.infoProceso}>
                        <Text style={styles.nombreProceso}>
                          Proceso: {item.titulo}
                        </Text>
                        <Text style={styles.aplicacionProceso}>
                          {item.descripcion}
                        </Text>
                        <Text style={styles.imagenesProceso}>
                          Imágenes: {item.imagenes.length}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#94A3B8"
                      />
                    </TouchableOpacity>
                  )}
                  contentContainerStyle={styles.listaProcesos}
                  showsVerticalScrollIndicator={true}
                />
              )}
            </View>
          </View>
        </Modal>

        {/* Modal de configuración de voz */}
        <Modal
          visible={showVoiceConfig}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowVoiceConfig(false)}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, styles.modalConfigVoz]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitulo}>🎤 Configuración de Voz</Text>
                <TouchableOpacity
                  style={styles.botonCerrarModal}
                  onPress={() => setShowVoiceConfig(false)}
                >
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.configScroll}
                showsVerticalScrollIndicator={false}
              >
                {/* Control de Velocidad */}
                <Text style={styles.configLabel}>⚡ Velocidad de Voz:</Text>
                <View style={styles.velocidadContainer}>
                  <Text style={styles.velocidadLabel}>Lenta</Text>
                  <View style={styles.velocidadSlider}>
                    {[0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map((speed) => (
                      <TouchableOpacity
                        key={speed}
                        style={[
                          styles.velocidadDot,
                          Math.abs(voiceSpeed - speed) < 0.05 &&
                            styles.velocidadDotSeleccionado,
                        ]}
                        onPress={() => setVoiceSpeed(speed)}
                      />
                    ))}
                  </View>
                  <Text style={styles.velocidadLabel}>Rápida</Text>
                </View>
                <Text style={styles.velocidadValue}>
                  Velocidad: {voiceSpeed.toFixed(1)}x
                </Text>

                {/* Botón de Prueba */}
                <TouchableOpacity
                  style={styles.botonPruebaVoz}
                  onPress={() => {
                    const config = obtenerConfiguracionVozLatina();
                    console.log("🔊 Probando voz con configuración:", config);

                    hablar(
                      `Hola, soy el asistente de voz de MERCAPLAS a velocidad ${voiceSpeed}. Esta es una prueba de mi configuración para ayudarte con información de procesos en nuestra fábrica.`
                    );
                  }}
                >
                  <Ionicons name="play-circle" size={24} color="#FFFFFF" />
                  <Text style={styles.textoPruebaVoz}>Probar Voz</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Replace the old menu modal with the new OptionsMenu component */}
        <OptionsMenu
          visible={showOptionsMenu}
          onClose={() => setShowOptionsMenu(false)}
          onShowInstructions={() => setShowInstructions(true)}
          onShowVoiceConfig={() => setShowVoiceConfig(true)}
          onShowListModal={() => setShowListModal(true)}
          onShowAgregarProceso={() => {
            setShowOptionsMenu(false);
            setShowLogin(true);
          }}
        />

        {/* Botón flotante de limpiar cuando hay contenido */}
        {(procesoSeleccionado || error || transcripcion) && (
          <TouchableOpacity
            style={styles.botonFlotanteLimpiar}
            onPress={limpiarPantalla}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* Modal visor de imágenes */}
        <Modal
          visible={imagenAmpliada !== null}
          transparent={false}
          animationType="fade"
          onRequestClose={cerrarVisorImagenes}
          statusBarTranslucent={true}
        >
          <StatusBar
            barStyle="light-content"
            backgroundColor="#000000"
            translucent={true}
          />
          <View style={styles.visorImagenContainer}>
            <TouchableOpacity
              style={styles.visorOverlay}
              activeOpacity={1}
              onPress={cerrarVisorImagenes}
            >
              <View style={styles.visorContent}>
                {/* Botón cerrar */}
                <TouchableOpacity
                  style={styles.botonCerrarVisor}
                  onPress={cerrarVisorImagenes}
                >
                  <Ionicons name="close" size={28} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Contador de imágenes */}
                {imagenAmpliada && imagenAmpliada.imagenes.length > 1 && (
                  <View style={styles.contadorImagenes}>
                    <Text style={styles.textoContador}>
                      {imagenAmpliada.indiceActual + 1} de{" "}
                      {imagenAmpliada.imagenes.length}
                    </Text>
                  </View>
                )}

                {/* Imagen ampliada */}
                {imagenAmpliada && (
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={(e) => e.stopPropagation()}
                    style={styles.imagenAmpliada}
                  >
                    <Image
                      source={
                        getLocalImageSource(
                          imagenAmpliada.imagenes[imagenAmpliada.indiceActual]
                        ) || {
                          uri: imagenAmpliada.imagenes[
                            imagenAmpliada.indiceActual
                          ],
                        }
                      }
                      style={styles.imagenCompleta}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                )}

                {/* Navegación entre imágenes */}
                {imagenAmpliada && imagenAmpliada.imagenes.length > 1 && (
                  <>
                    <TouchableOpacity
                      style={[styles.botonNavegacion, styles.botonAnterior]}
                      onPress={() => navegarImagen("anterior")}
                    >
                      <Ionicons name="chevron-back" size={32} color="#FFFFFF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.botonNavegacion, styles.botonSiguiente]}
                      onPress={() => navegarImagen("siguiente")}
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={32}
                        color="#FFFFFF"
                      />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </Modal>
      </SafeAreaView>

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
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  statusBarBackground: {
    height: Platform.OS === "ios" ? 44 : 0,
    backgroundColor: "#203289",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: "center",
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: "#203289",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#203289",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 20,
    marginTop: -16,
    marginLeft: -24,
    marginRight: -24,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  topBarLeft: {
    flex: 1,
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  titulo: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.5,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitulo: {
    fontSize: 18,
    color: "#E0E7FF",
    textAlign: "center",
    fontWeight: "600",
    opacity: 0.95,
    letterSpacing: 0.3,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FEF7E7",
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#F59E0B",
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  warningText: {
    fontSize: 16,
    color: "#92400E",
    lineHeight: 22,
    fontWeight: "500",
  },
  botonesContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    marginTop: 8,
    backgroundColor: "transparent",
    padding: 0,
    borderRadius: 0,
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    marginHorizontal: 0,
  },
  botonMicrofono: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#FFFFFF",
    borderWidth: 0,
    borderColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  botonEscuchando: {
    backgroundColor: "#3B82F6",
    borderColor: "transparent",
    shadowColor: "#1D4ED8",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    transform: [{ scale: 1.1 }],
  },
  botonDeshabilitado: {
    backgroundColor: "#F1F5F9",
    borderColor: "#CBD5E1",
    shadowOpacity: 0.1,
  },
  textoBoton: {
    fontSize: 18,
    color: "#374151",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: 0.2,
    lineHeight: 24,
  },
  debugText: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 16,
    fontFamily: "monospace",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "center",
  },
  botonesRapidos: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    paddingHorizontal: 40,
  },
  botonRapido: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    minWidth: 70,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textoBotonRapido: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  transcripcionContainer: {
    backgroundColor: "#EBF8FF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 8,
    borderWidth: 0,
    borderColor: "transparent",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  transcripcionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1D4ED8",
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  transcripcionTexto: {
    fontSize: 16,
    color: "#1E40AF",
    lineHeight: 22,
    fontWeight: "500",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FEF2F2",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 8,
    borderWidth: 0,
    borderColor: "transparent",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  errorTexto: {
    fontSize: 16,
    color: "#DC2626",
    marginLeft: 12,
    flex: 1,
    lineHeight: 22,
    fontWeight: "500",
  },
  resultadoContainer: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 16,
    marginBottom: 20,
    marginHorizontal: 4,
    borderWidth: 0,
    borderColor: "transparent",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  resultadoTitulo: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1A365D",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  datosContainer: {
    gap: 10,
    marginBottom: 16,
  },
  datoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
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
  datoLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    flex: 1,
    lineHeight: 20,
  },
  datoValor: {
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "700",
    flex: 2,
    textAlign: "right",
    lineHeight: 20,
  },
  botonLeerNuevamente: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  textoBotonLeer: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    width: "90%",
    maxWidth: 400,
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#333",
  },
  modalSubtitulo: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  modalBotones: {
    flexDirection: "row",
    gap: 10,
  },
  modalBoton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  modalBotonCancelar: {
    backgroundColor: "#f5f5f5",
  },
  modalBotonProcesar: {
    backgroundColor: "#2196F3",
  },
  textoModalBoton: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  // Nuevos estilos para la información técnica expandida
  datoDestacado: {
    backgroundColor: "#EBF8FF",
    borderColor: "#3B82F6",
    borderWidth: 2,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: "column",
    alignItems: "stretch",
  },
  tituloContainer: {
    gap: 8,
  },
  tituloDestacado: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1D4ED8",
    letterSpacing: -0.3,
    lineHeight: 24,
    textAlign: "left",
  },
  seccionTitulo: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#6366F1",
    borderRadius: 16,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
    letterSpacing: 0.5,
  },
  aplicacionItem: {
    backgroundColor: "#FFFBEB",
    borderColor: "#F59E0B",
    borderWidth: 2,
    marginTop: 12,
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  aplicacionTexto: {
    color: "#92400E",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.2,
  },
  categoriaTexto: {
    fontSize: 16,
    fontWeight: "800",
    color: "#4338CA",
    marginTop: 16,
    marginBottom: 8,
    paddingLeft: 8,
    letterSpacing: 0.3,
  },
  warningTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  botonPermisos: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F59E0B",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  textoBotonPermisos: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  botonDetenerVoz: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 8,
    marginTop: 16,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: "#DC2626",
  },
  textoDetenerVoz: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  botonLeerDeshabilitado: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0.1,
  },
  botonLimpiarNuevo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  textoBotonLimpiar: {
    color: "#64748B",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  botonFlotanteLimpiar: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  modalInstrucciones: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  botonCerrarModal: {
    padding: 8,
  },
  instruccionesScroll: {
    padding: 16,
  },
  ejemploTexto: {
    fontSize: 15,
    color: "#4B5563",
    marginVertical: 6,
    paddingLeft: 16,
    lineHeight: 20,
    fontWeight: "500",
  },
  infoTexto: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 16,
    paddingHorizontal: 16,
    fontStyle: "italic",
    lineHeight: 20,
    textAlign: "center",
  },
  modalLista: {
    padding: 20,
    maxHeight: "80%", // Limitar altura máxima
  },
  listaProcesos: {
    gap: 12,
    paddingBottom: 24,
  },
  itemProceso: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  numeroCirculo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },
  numeroTexto: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  infoProceso: {
    flex: 1,
    marginLeft: 16,
  },
  nombreProceso: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  aplicacionProceso: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  imagenesProceso: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  botonConfigVoz: {
    padding: 8,
  },
  modalConfigVoz: {
    padding: 20,
  },
  configScroll: {
    padding: 16,
  },
  configLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1D4ED8",
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  paisesContainer: {
    flexDirection: "column",
    gap: 8,
    marginBottom: 20,
  },
  paisItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  paisSeleccionado: {
    backgroundColor: "#3B82F6",
    borderColor: "#FFFFFF",
  },
  paisFlag: {
    fontSize: 24,
    color: "#3B82F6",
    marginRight: 8,
  },
  paisName: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "600",
  },
  paisNameSeleccionado: {
    color: "#FFFFFF",
  },
  paisInfo: {
    flex: 1,
    marginLeft: 12,
  },
  paisDesc: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  paisDescSeleccionado: {
    color: "#FFFFFF",
  },
  velocidadContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  velocidadLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },
  velocidadSlider: {
    flexDirection: "row",
    gap: 8,
  },
  velocidadDot: {
    width: 40,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E2E8F0",
  },
  velocidadDotSeleccionado: {
    backgroundColor: "#3B82F6",
  },
  velocidadValue: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },
  botonPruebaVoz: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 8,
    marginTop: 16,
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: "#1976D2",
  },
  textoPruebaVoz: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  visorImagenContainer: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  visorOverlay: {
    flex: 1,
    width: "100%",
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  visorContent: {
    flex: 1,
    width: "100%",
    backgroundColor: "#000000",
    position: "relative",
  },
  botonCerrarVisor: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    right: 20,
    zIndex: 10,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  contadorImagenes: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    left: 20,
    zIndex: 10,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  textoContador: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  imagenAmpliada: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  imagenCompleta: {
    width: "100%",
    height: "100%",
  },
  botonNavegacion: {
    position: "absolute",
    top: "50%",
    marginTop: -25,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  botonAnterior: {
    left: 20,
  },
  botonSiguiente: {
    right: 20,
  },
  botonesAccion: {
    gap: 12,
    marginTop: 16,
  },
  descripcionItem: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 8,
  },
  descripcionTexto: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
    lineHeight: 24,
    textAlign: "left",
  },
  imagenesContainer: {
    flexDirection: "column",
    gap: 16,
    marginBottom: 20,
  },
  imagenWrapper: {
    width: "100%",
    height: 250,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  imagenProceso: {
    width: "100%",
    height: 210,
  },
  imagenFooter: {
    height: 40,
    backgroundColor: "#374151",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  imagenNumero: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  botonMenu: {
    padding: 8,
  },
  sinProcesosContainer: {
    minHeight: 300,
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    marginTop: 16,
    padding: 20,
  },
  sinProcesosContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  sinProcesosTitulo: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  sinProcesosDescripcion: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 24,
  },
});

export default AsistenteVoz;
