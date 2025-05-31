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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";

interface Alambre {
  numero: number;
  diametro: string;
  hilo: string;
  bobina: string;
  tuerca: string;
  pesoMetro: string;
  resistencia: string;
  temperaturaMaxima: string;
  velocidadMaquina: string;
  tensionRecomendada: string;
  amperaje: string;
  aplicacion: string;
  colorCodigo: string;
  materialExtra: string;
}

const AsistenteVoz: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [alambres, setAlambres] = useState<Alambre[]>([]);
  const [alambreSeleccionado, setAlambreSeleccionado] =
    useState<Alambre | null>(null);
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

  // Cargar datos de alambres al inicializar el componente
  useEffect(() => {
    console.log("🚀 Iniciando AsistenteVoz...");
    cargarAlambres();
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

        // Confirmar al usuario que ya puede usar la función
        Alert.alert(
          "✅ ¡Listo!",
          "Permisos concedidos. Ahora puedes usar el reconocimiento de voz.",
          [{ text: "Entendido" }]
        );
      }
    } catch (error) {
      console.error("❌ Error al verificar permisos:", error);

      Alert.alert(
        "❌ Error de Permisos",
        `Error al solicitar permisos: ${(error as any)?.message || error}\n\n` +
          "Intenta reiniciar la aplicación o concede permisos manualmente en la configuración del dispositivo.",
        [{ text: "Entendido" }]
      );

      setError(
        `Error al verificar permisos: ${
          (error as any)?.message || "Error desconocido"
        }`
      );
      setPermissionGranted(false);
    }
  };

  const cargarAlambres = async () => {
    try {
      console.log("📂 Cargando datos de alambres...");
      const datosAlambres = require("./assets/alambres.json");
      setAlambres(datosAlambres);
      console.log(
        "✅ Datos de alambres cargados:",
        datosAlambres.length,
        "alambres"
      );
    } catch (err) {
      console.error("❌ Error al cargar alambres:", err);
      console.log("🔄 Usando datos de respaldo...");

      const datosRespaldo: Alambre[] = [
        {
          numero: 8,
          diametro: "3.26 mm",
          hilo: "Cobre 2.0mm",
          bobina: "Bobina A - Grande",
          tuerca: "Tuerca T1 - 15mm",
          pesoMetro: "83.6 g/m",
          resistencia: "5.27 Ω/km",
          temperaturaMaxima: "75°C",
          velocidadMaquina: "720 rpm",
          tensionRecomendada: "18 kg",
          amperaje: "32 A",
          aplicacion: "Instalaciones principales",
          colorCodigo: "#FF6B35",
          materialExtra: "Aislamiento PVC estándar",
        },
        {
          numero: 10,
          diametro: "2.59 mm",
          hilo: "Cobre 1.5mm",
          bobina: "Bobina A - Grande",
          tuerca: "Tuerca T1 - 15mm",
          pesoMetro: "52.5 g/m",
          resistencia: "8.43 Ω/km",
          temperaturaMaxima: "60°C",
          velocidadMaquina: "850 rpm",
          tensionRecomendada: "15 kg",
          amperaje: "24 A",
          aplicacion: "Circuitos de iluminación",
          colorCodigo: "#4ECDC4",
          materialExtra: "Aislamiento PVC flexible",
        },
        {
          numero: 12,
          diametro: "2.05 mm",
          hilo: "Cobre 1.2mm",
          bobina: "Bobina B - Mediana",
          tuerca: "Tuerca T2 - 12mm",
          pesoMetro: "33.0 g/m",
          resistencia: "13.4 Ω/km",
          temperaturaMaxima: "60°C",
          velocidadMaquina: "950 rpm",
          tensionRecomendada: "12 kg",
          amperaje: "20 A",
          aplicacion: "Tomacorrientes residenciales",
          colorCodigo: "#45B7D1",
          materialExtra: "Aislamiento PVC estándar",
        },
        {
          numero: 14,
          diametro: "1.63 mm",
          hilo: "Cobre 1.0mm",
          bobina: "Bobina B - Mediana",
          tuerca: "Tuerca T2 - 12mm",
          pesoMetro: "20.8 g/m",
          resistencia: "21.3 Ω/km",
          temperaturaMaxima: "60°C",
          velocidadMaquina: "1100 rpm",
          tensionRecomendada: "10 kg",
          amperaje: "15 A",
          aplicacion: "Circuitos de control",
          colorCodigo: "#96CEB4",
          materialExtra: "Aislamiento PVC fino",
        },
        {
          numero: 16,
          diametro: "1.29 mm",
          hilo: "Cobre 0.8mm",
          bobina: "Bobina C - Pequeña",
          tuerca: "Tuerca T3 - 10mm",
          pesoMetro: "13.1 g/m",
          resistencia: "33.9 Ω/km",
          temperaturaMaxima: "60°C",
          velocidadMaquina: "1250 rpm",
          tensionRecomendada: "8 kg",
          amperaje: "10 A",
          aplicacion: "Señalización y control",
          colorCodigo: "#FFEAA7",
          materialExtra: "Aislamiento PVC delgado",
        },
        {
          numero: 18,
          diametro: "1.02 mm",
          hilo: "Cobre 0.6mm",
          bobina: "Bobina C - Pequeña",
          tuerca: "Tuerca T3 - 10mm",
          pesoMetro: "8.2 g/m",
          resistencia: "53.9 Ω/km",
          temperaturaMaxima: "60°C",
          velocidadMaquina: "1400 rpm",
          tensionRecomendada: "6 kg",
          amperaje: "7 A",
          aplicacion: "Conexiones internas",
          colorCodigo: "#DDA0DD",
          materialExtra: "Aislamiento PVC ultrafino",
        },
      ];
      setAlambres(datosRespaldo);
      console.log("✅ Datos de respaldo cargados");
    }
  };

  const procesarComandoVoz = (texto: string) => {
    console.log("🎙️ Procesando comando de voz:", texto);
    const textoLimpio = texto.toLowerCase().trim();

    // 1. BUSCAR POR NÚMERO DE ALAMBRE (múltiples patrones)
    const numeroEncontrado = buscarNumeroAlambre(textoLimpio);
    if (numeroEncontrado) {
      buscarAlambre(numeroEncontrado);
      return;
    }

    // 2. BUSCAR POR APLICACIÓN
    const alambresEncontrados = buscarPorAplicacion(textoLimpio);
    if (alambresEncontrados.length > 0) {
      mostrarResultadosAplicacion(alambresEncontrados, textoLimpio);
      return;
    }

    // 3. PREGUNTAS ESPECÍFICAS DE FABRICACIÓN
    const respuestaEspecifica = procesarPreguntaEspecifica(textoLimpio);
    if (respuestaEspecifica) {
      mostrarRespuestaEspecifica(respuestaEspecifica);
      return;
    }

    // 4. BUSCAR POR CARACTERÍSTICAS TÉCNICAS
    const alambrePorCaracteristica = buscarPorCaracteristica(textoLimpio);
    if (alambrePorCaracteristica) {
      buscarAlambre(alambrePorCaracteristica.numero);
      return;
    }

    // 5. COMANDOS ESPECIALES
    if (manejarComandosEspeciales(textoLimpio)) {
      return;
    }

    // 5. NO SE ENCONTRÓ NADA - SUGERENCIAS INTELIGENTES
    console.log("❌ No se detectó comando válido en:", texto);
    const sugerencia = generarSugerenciaInteligente(textoLimpio);
    setError(`No se reconoció el comando "${texto}". ${sugerencia}`);
    hablar(`No se reconoció el comando. ${sugerencia}`);
  };

  const buscarNumeroAlambre = (texto: string): number | null => {
    // Patrones para números de alambre
    const patrones = [
      // Patrones directos
      /(?:alambre|cable)\s*(?:número|numero|num|n[oº]?)\s*(\d+)/gi,
      /(?:número|numero|num|n[oº]?)\s*(\d+)/gi,
      /alambre\s*(\d+)/gi,
      /cable\s*(\d+)/gi,

      // Frases naturales
      /(?:dame|busca|quiero|necesito|dime|cuál es|cual es)\s*(?:el\s*)?(?:alambre|cable)\s*(?:número|numero|num|n[oº]?)?\s*(\d+)/gi,
      /(?:información|info|datos)\s*(?:del|de)\s*(?:alambre|cable)\s*(?:número|numero|num|n[oº]?)?\s*(\d+)/gi,
      /(?:especificaciones|specs|características)\s*(?:del|de)\s*(?:alambre|cable)\s*(?:número|numero|num|n[oº]?)?\s*(\d+)/gi,

      // Patrones conversacionales para bobinas, tuercas, etc.
      /(?:qué|que)\s*(?:bobina|carrete|rollo)\s*(?:necesito|uso|ocupo)\s*(?:para|del|de)\s*(?:el\s*)?(?:alambre|cable)\s*(?:número|numero|num|n[oº]?)?\s*(\d+)/gi,
      /(?:qué|que)\s*(?:tuerca|ajuste|tornillo)\s*(?:necesito|uso|ocupo)\s*(?:para|del|de)\s*(?:el\s*)?(?:alambre|cable)\s*(?:número|numero|num|n[oº]?)?\s*(\d+)/gi,
      /(?:cómo|como)\s*(?:configuro|ajusto|pongo)\s*(?:la\s*máquina|la\s*maquina)\s*(?:para|del|de)\s*(?:el\s*)?(?:alambre|cable)\s*(?:número|numero|num|n[oº]?)?\s*(\d+)/gi,
      /(?:qué|que)\s*(?:diámetro|diametro|grosor|medida)\s*(?:tiene|es)\s*(?:el\s*)?(?:alambre|cable)\s*(?:número|numero|num|n[oº]?)?\s*(\d+)/gi,

      // Solo números (cuando es claro el contexto)
      /^(\d+)$/gi,
      /(?:^|\s)(\d+)(?:\s|$)/gi,
    ];

    // Convertir números en texto a dígitos
    const textoConDigitos = convertirNumerosTextoADigitos(texto);

    for (const patron of patrones) {
      const match = patron.exec(textoConDigitos);
      if (match && match[1]) {
        const numero = parseInt(match[1], 10);
        if (numero >= 8 && numero <= 18) {
          console.log("🔍 Número de alambre encontrado:", numero);
          return numero;
        }
      }
      patron.lastIndex = 0; // Reset regex
    }

    return null;
  };

  const convertirNumerosTextoADigitos = (texto: string): string => {
    const numerosTexto: { [key: string]: string } = {
      cero: "0",
      uno: "1",
      dos: "2",
      tres: "3",
      cuatro: "4",
      cinco: "5",
      seis: "6",
      siete: "7",
      ocho: "8",
      nueve: "9",
      diez: "10",
      once: "11",
      doce: "12",
      trece: "13",
      catorce: "14",
      quince: "15",
      dieciséis: "16",
      dieciseis: "16",
      diecisiete: "17",
      dieciocho: "18",
    };

    let textoModificado = texto;
    for (const [palabra, digito] of Object.entries(numerosTexto)) {
      const regex = new RegExp(`\\b${palabra}\\b`, "gi");
      textoModificado = textoModificado.replace(regex, digito);
    }

    return textoModificado;
  };

  const buscarPorAplicacion = (texto: string): Alambre[] => {
    const aplicaciones: { [key: string]: string[] } = {
      "instalaciones principales": [
        "principal",
        "principales",
        "general",
        "generales",
      ],
      "circuitos de iluminación": [
        "iluminación",
        "iluminacion",
        "luz",
        "luces",
        "luminaria",
        "luminarias",
      ],
      "tomacorrientes residenciales": [
        "tomacorriente",
        "tomacorrientes",
        "enchufe",
        "enchufes",
        "residencial",
        "casa",
        "hogar",
      ],
      "circuitos de control": [
        "control",
        "controles",
        "automatización",
        "automatizacion",
      ],
      "señalización y control": [
        "señalización",
        "senalizacion",
        "señal",
        "señales",
        "senal",
        "senales",
      ],
      "conexiones internas": [
        "interno",
        "interna",
        "internos",
        "internas",
        "conexion",
        "conexiones",
      ],
    };

    const resultados: Alambre[] = [];

    for (const [aplicacion, keywords] of Object.entries(aplicaciones)) {
      for (const keyword of keywords) {
        if (texto.includes(keyword)) {
          const alambre = alambres.find(
            (a) => a.aplicacion.toLowerCase() === aplicacion
          );
          if (alambre && !resultados.find((r) => r.numero === alambre.numero)) {
            resultados.push(alambre);
          }
        }
      }
    }

    return resultados;
  };

  const buscarPorCaracteristica = (texto: string): Alambre | null => {
    // Buscar por diámetro
    const patronDiametro = /(\d+(?:\.\d+)?)\s*mm/gi;
    const matchDiametro = patronDiametro.exec(texto);
    if (matchDiametro) {
      const diametro = matchDiametro[1];
      const alambre = alambres.find((a) => a.diametro.includes(diametro));
      if (alambre) return alambre;
    }

    // Buscar por amperaje
    const patronAmperaje = /(\d+)\s*(?:ampere|amper|amp|a)\b/gi;
    const matchAmperaje = patronAmperaje.exec(texto);
    if (matchAmperaje) {
      const amperaje = matchAmperaje[1];
      const alambre = alambres.find((a) => a.amperaje.includes(amperaje));
      if (alambre) return alambre;
    }

    return null;
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

    // Listar todos los alambres
    if (
      texto.includes("lista") ||
      texto.includes("todos") ||
      texto.includes("disponibles")
    ) {
      listarTodosLosAlambres();
      return true;
    }

    return false;
  };

  const mostrarResultadosAplicacion = (
    alambresEncontrados: Alambre[],
    busqueda: string
  ) => {
    if (alambresEncontrados.length === 1) {
      buscarAlambre(alambresEncontrados[0].numero);
    } else {
      const opciones = alambresEncontrados
        .map((a) => `Alambre ${a.numero}`)
        .join(", ");
      const mensaje = `Encontré ${alambresEncontrados.length} alambres para "${busqueda}": ${opciones}. ¿Cuál necesitas?`;
      setError(mensaje);
      hablar(mensaje);

      // Mostrar selector con los resultados
      Alert.alert("Múltiples Resultados", mensaje, [
        ...alambresEncontrados.map((alambre) => ({
          text: `Alambre ${alambre.numero}`,
          onPress: () => buscarAlambre(alambre.numero),
        })),
        { text: "Cancelar", style: "cancel" },
      ]);
    }
  };

  const mostrarAyuda = () => {
    const mensaje = `Puedes usar comandos como: "alambre número 10", "cable para iluminación", "dame información del 12", "cuál alambre uso para tomacorrientes", o simplemente di el número.`;
    setError(mensaje);
    hablar(mensaje);
  };

  const listarTodosLosAlambres = () => {
    const lista = alambres
      .map((a) => `Alambre ${a.numero} para ${a.aplicacion}`)
      .join(", ");
    const mensaje = `Alambres disponibles: ${lista}`;
    setError(mensaje);
    hablar(`Tenemos ${alambres.length} tipos de alambre disponibles. ${lista}`);
  };

  const procesarPreguntaEspecifica = (texto: string) => {
    // Extraer número de alambre de la pregunta
    const numeroAlambre = buscarNumeroAlambre(texto);
    if (!numeroAlambre) return null;

    const alambre = alambres.find((a) => a.numero === numeroAlambre);
    if (!alambre) return null;

    // Patrones de preguntas específicas
    const preguntasPatrones = [
      // Diámetros y medidas
      {
        patrones: [
          /diámetro|diametro|medida|grosor|tamaño/i,
          /(?:qué|que)\s*(?:diámetro|diametro|grosor|medida)\s*(?:tiene|es)/i,
        ],
        tipo: "diametro",
        respuesta: `El alambre ${alambre.numero} tiene un diámetro de ${alambre.diametro}. Vas a necesitar hilo de cobre de ${alambre.hilo}.`,
      },

      // Bobinas
      {
        patrones: [
          /bobina|carrete|rollo/i,
          /(?:qué|que)\s*(?:bobina|carrete|rollo)\s*(?:necesito|uso|ocupo)/i,
        ],
        tipo: "bobina",
        respuesta: `Para armar un alambre ${alambre.numero} necesitarás una ${alambre.bobina}. Es la bobina perfecta para este calibre.`,
      },

      // Tuercas y ajustes
      {
        patrones: [
          /tuerca|ajuste|tornillo|sujeción|sujecion/i,
          /(?:qué|que)\s*(?:tuerca|ajuste|tornillo)\s*(?:necesito|uso|ocupo)/i,
        ],
        tipo: "tuerca",
        respuesta: `Para el alambre ${alambre.numero} vas a usar ${alambre.tuerca}. Con esta tuerca tendrás el ajuste perfecto.`,
      },

      // Configuración de máquina
      {
        patrones: [
          /máquina|maquina|velocidad|configurar|configuro|rpm/i,
          /(?:cómo|como)\s*(?:configuro|ajusto|pongo)\s*(?:la\s*máquina|la\s*maquina)/i,
        ],
        tipo: "maquina",
        respuesta: `Para el alambre ${alambre.numero} debes configurar la máquina a ${alambre.velocidadMaquina} con tensión de ${alambre.tensionRecomendada}. Recuerda no pasar de ${alambre.temperaturaMaxima}.`,
      },

      // Materiales
      {
        patrones: [/material|materiales|cobre|hilo/i],
        tipo: "materiales",
        respuesta: `Para armar un alambre ${alambre.numero} necesitas hilo de cobre ${alambre.hilo} y ${alambre.materialExtra}. El peso final será de ${alambre.pesoMetro}.`,
      },

      // Especificaciones eléctricas
      {
        patrones: [/eléctric|electrico|amperaje|amperes|resistencia|ohm/i],
        tipo: "electrico",
        respuesta: `El alambre ${alambre.numero} maneja ${alambre.amperaje} con una resistencia de ${alambre.resistencia}. Perfecto para ${alambre.aplicacion}.`,
      },

      // Proceso completo
      {
        patrones: [/proceso|fabricar|hacer|producir|cómo|como/i],
        tipo: "proceso",
        respuesta: `Proceso completo para alambre número ${alambre.numero}: 
                   1. Preparar hilo ${alambre.hilo}
                   2. Instalar ${alambre.bobina} 
                   3. Ajustar ${alambre.tuerca}
                   4. Configurar máquina: ${alambre.velocidadMaquina}, tensión ${alambre.tensionRecomendada}
                   5. Aplicar ${alambre.materialExtra}
                   Resultado: Diámetro ${alambre.diametro}, ${alambre.amperaje}, para ${alambre.aplicacion}.`,
      },
    ];

    // Buscar qué tipo de pregunta es
    for (const pregunta of preguntasPatrones) {
      for (const patron of pregunta.patrones) {
        if (patron.test(texto)) {
          return {
            alambre,
            tipo: pregunta.tipo,
            respuesta: pregunta.respuesta,
            preguntaOriginal: texto,
          };
        }
      }
    }

    return null;
  };

  const mostrarRespuestaEspecifica = (respuesta: any) => {
    console.log("💬 Mostrando respuesta específica:", respuesta.tipo);

    // Configurar la transcripción con la pregunta
    setTranscripcion(`Pregunta: "${respuesta.preguntaOriginal}"`);

    // Mostrar el alambre seleccionado
    setAlambreSeleccionado(respuesta.alambre);

    // Limpiar errores
    setError("");

    // Hablar la respuesta específica
    hablar(respuesta.respuesta);

    // Mostrar alert específico para la pregunta
    const titulo = `🔧 Alambre ${respuesta.alambre.numero} - ${getTituloTipo(
      respuesta.tipo
    )}`;
    Alert.alert(titulo, respuesta.respuesta, [
      { text: "🔊 Repetir", onPress: () => hablar(respuesta.respuesta) },
      {
        text: "📋 Ver Todo",
        onPress: () => leerDatosAlambre(respuesta.alambre),
      },
      { text: "✅ Entendido", style: "default" },
    ]);
  };

  const getTituloTipo = (tipo: string): string => {
    const titulos: { [key: string]: string } = {
      diametro: "Diámetros y Medidas",
      bobina: "Bobinas Requeridas",
      tuerca: "Ajustes y Tuercas",
      maquina: "Configuración Máquina",
      materiales: "Materiales Necesarios",
      electrico: "Especificaciones Eléctricas",
      proceso: "Proceso de Fabricación",
    };
    return titulos[tipo] || "Información Técnica";
  };

  const generarSugerenciaInteligente = (texto: string): string => {
    const sugerencias = [
      'Intenta decir "alambre número 10" o "qué bobina necesito para alambre 12"',
      'Puedes preguntar "qué diámetro tiene el alambre 10" o "cómo configuro la máquina para alambre 12"',
      'También puedes decir "qué tuerca uso para alambre 14" o "dame información del alambre 16"',
      'Pregunta natural como "que necesito para armar un alambre 12"',
    ];

    // Si contiene números pero no reconocidos, sugerir formato correcto
    if (/\d+/.test(texto)) {
      return 'Detecté un número. Intenta decir "alambre número" seguido del número.';
    }

    // Si menciona aplicaciones pero no reconocidas
    if (texto.includes("para") || texto.includes("usar")) {
      return 'Puedes buscar por aplicación como "alambre para iluminación" o "cable para tomacorrientes".';
    }

    // Sugerencia aleatoria
    return sugerencias[Math.floor(Math.random() * sugerencias.length)];
  };

  const buscarAlambre = (numero: number) => {
    console.log("🔍 Buscando alambre número:", numero);
    const alambre = alambres.find((a) => a.numero === numero);

    if (alambre) {
      console.log("✅ Alambre encontrado:", alambre);
      setAlambreSeleccionado(alambre);
      setError("");
      leerDatosAlambre(alambre);
    } else {
      console.log("❌ Alambre no encontrado:", numero);
      setError(`No se encontró información para el alambre número ${numero}`);
      setAlambreSeleccionado(null);
      hablar(`No se encontró información para el alambre número ${numero}`);
    }
  };

  const leerDatosAlambre = (alambre: Alambre) => {
    const mensaje = `Aquí tienes todo sobre el alambre ${alambre.numero}. 
                     Tiene un diámetro de ${alambre.diametro} y vas a usar hilo de cobre ${alambre.hilo}.
                     Necesitarás una ${alambre.bobina} y ${alambre.tuerca}, además de ${alambre.materialExtra}.
                     Configura la máquina a ${alambre.velocidadMaquina} con tensión de ${alambre.tensionRecomendada}.
                     Maneja ${alambre.amperaje} con resistencia de ${alambre.resistencia}.
                     Es ideal para ${alambre.aplicacion}.`;
    console.log("🔊 Reproduciendo información completa del alambre");
    hablar(mensaje);
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
      const configuracion = {
        language: "es",
        pitch: 1.1,
        rate: 0.7,
        volume: 1.0,
      };

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
      setAlambreSeleccionado(null);

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

  const seleccionarAlambreDeModal = (numero: number) => {
    setShowListModal(false);
    buscarAlambre(numero);
  };

  const limpiarPantalla = () => {
    console.log("🧹 Limpiando pantalla");
    setAlambreSeleccionado(null);
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
                {(alambreSeleccionado || error || transcripcion) && (
                  <TouchableOpacity
                    style={styles.botonLimpiar}
                    onPress={limpiarPantalla}
                  >
                    <Ionicons
                      name="refresh-outline"
                      size={24}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                )}

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

          {alambreSeleccionado && (
            <View style={styles.resultadoContainer}>
              <Text style={styles.resultadoTitulo}>
                Información del Alambre
              </Text>

              <View style={styles.datosContainer}>
                {/* Datos básicos destacados */}
                <View style={[styles.datoItem, styles.datoDestacado]}>
                  <Text style={styles.datoLabel}>🔌 Número:</Text>
                  <Text style={[styles.datoValor, styles.numeroDestacado]}>
                    {alambreSeleccionado.numero}
                  </Text>
                </View>

                <View style={[styles.datoItem, styles.datoDestacado]}>
                  <Text style={styles.datoLabel}>📏 Diámetro:</Text>
                  <Text style={[styles.datoValor, styles.valorDestacado]}>
                    {alambreSeleccionado.diametro}
                  </Text>
                </View>

                {/* Sección de materiales */}
                <Text style={styles.seccionTitulo}>📦 MATERIALES</Text>

                <View style={styles.datoItem}>
                  <Text style={styles.datoLabel}>🔩 Hilo de Cobre:</Text>
                  <Text style={styles.datoValor}>
                    {alambreSeleccionado.hilo}
                  </Text>
                </View>

                <View style={styles.datoItem}>
                  <Text style={styles.datoLabel}>📦 Bobina:</Text>
                  <Text style={styles.datoValor}>
                    {alambreSeleccionado.bobina}
                  </Text>
                </View>

                <View style={styles.datoItem}>
                  <Text style={styles.datoLabel}>🔧 Tuerca:</Text>
                  <Text style={styles.datoValor}>
                    {alambreSeleccionado.tuerca}
                  </Text>
                </View>

                <View style={styles.datoItem}>
                  <Text style={styles.datoLabel}>🛡️ Material Extra:</Text>
                  <Text style={styles.datoValor}>
                    {alambreSeleccionado.materialExtra}
                  </Text>
                </View>

                {/* Sección de especificaciones técnicas */}
                <Text style={styles.seccionTitulo}>⚡ ESPECIFICACIONES</Text>

                <View style={styles.datoItem}>
                  <Text style={styles.datoLabel}>⚖️ Peso/Metro:</Text>
                  <Text style={styles.datoValor}>
                    {alambreSeleccionado.pesoMetro}
                  </Text>
                </View>

                <View style={styles.datoItem}>
                  <Text style={styles.datoLabel}>⚡ Resistencia:</Text>
                  <Text style={styles.datoValor}>
                    {alambreSeleccionado.resistencia}
                  </Text>
                </View>

                <View style={styles.datoItem}>
                  <Text style={styles.datoLabel}>🔌 Amperaje:</Text>
                  <Text style={styles.datoValor}>
                    {alambreSeleccionado.amperaje}
                  </Text>
                </View>

                <View style={styles.datoItem}>
                  <Text style={styles.datoLabel}>🌡️ Temp. Máxima:</Text>
                  <Text style={styles.datoValor}>
                    {alambreSeleccionado.temperaturaMaxima}
                  </Text>
                </View>

                {/* Sección de configuración de máquina */}
                <Text style={styles.seccionTitulo}>⚙️ CONFIGURACIÓN</Text>

                <View style={styles.datoItem}>
                  <Text style={styles.datoLabel}>⚙️ Velocidad Máquina:</Text>
                  <Text style={styles.datoValor}>
                    {alambreSeleccionado.velocidadMaquina}
                  </Text>
                </View>

                <View style={styles.datoItem}>
                  <Text style={styles.datoLabel}>💪 Tensión:</Text>
                  <Text style={styles.datoValor}>
                    {alambreSeleccionado.tensionRecomendada}
                  </Text>
                </View>

                {/* Aplicación */}
                <View style={[styles.datoItem, styles.aplicacionItem]}>
                  <Text style={styles.datoLabel}>🎯 Aplicación:</Text>
                  <Text style={[styles.datoValor, styles.aplicacionTexto]}>
                    {alambreSeleccionado.aplicacion}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.botonLeerNuevamente,
                  isSpeaking && styles.botonLeerDeshabilitado,
                ]}
                onPress={() => leerDatosAlambre(alambreSeleccionado)}
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
                Ejemplo: "alambre número 10" o simplemente "12"
              </Text>

              <TextInput
                style={styles.textInput}
                value={manualText}
                onChangeText={setManualText}
                placeholder='Escribe "alambre número 10"'
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

        {/* Modal de lista de alambres */}
        <Modal
          visible={showListModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowListModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, styles.modalLista]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitulo}>📋 Seleccionar Alambre</Text>
                <TouchableOpacity
                  style={styles.botonCerrarModal}
                  onPress={() => setShowListModal(false)}
                >
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitulo}>
                Elige el número de alambre que necesitas:
              </Text>

              <View style={styles.listaAlambres}>
                {alambres.map((alambre) => (
                  <TouchableOpacity
                    key={alambre.numero}
                    style={styles.itemAlambre}
                    onPress={() => seleccionarAlambreDeModal(alambre.numero)}
                  >
                    <View style={styles.numeroCirculo}>
                      <Text style={styles.numeroTexto}>{alambre.numero}</Text>
                    </View>
                    <View style={styles.infoAlambre}>
                      <Text style={styles.nombreAlambre}>
                        Alambre {alambre.numero}
                      </Text>
                      <Text style={styles.aplicacionAlambre}>
                        {alambre.aplicacion}
                      </Text>
                      <Text style={styles.diametroAlambre}>
                        {alambre.diametro} • {alambre.amperaje}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>
                ))}
              </View>
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
                      `Hola, soy el asistente de voz de MERCAPLAS a velocidad ${voiceSpeed}. Esta es una prueba de mi configuración para ayudarte con información de alambres en nuestra fábrica.`
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

        {/* Modal de menú de opciones */}
        <Modal
          visible={showOptionsMenu}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowOptionsMenu(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowOptionsMenu(false)}
          >
            <View style={styles.menuContainer}>
              <View style={styles.menuContent}>
                <View style={styles.menuHeader}>
                  <Text style={styles.menuTitulo}>Opciones</Text>
                </View>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowOptionsMenu(false);
                    setShowInstructions(true);
                  }}
                >
                  <Ionicons
                    name="help-circle-outline"
                    size={24}
                    color="#3B82F6"
                  />
                  <Text style={styles.menuItemText}>Guía de Uso</Text>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowOptionsMenu(false);
                    setShowVoiceConfig(true);
                  }}
                >
                  <Ionicons
                    name="volume-high-outline"
                    size={24}
                    color="#3B82F6"
                  />
                  <Text style={styles.menuItemText}>Configuración de Voz</Text>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowOptionsMenu(false);
                    setShowListModal(true);
                  }}
                >
                  <Ionicons name="list-outline" size={24} color="#3B82F6" />
                  <Text style={styles.menuItemText}>Lista de Alambres</Text>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
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
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    marginHorizontal: 8,
    borderWidth: 0,
    borderColor: "transparent",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  resultadoTitulo: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A365D",
    textAlign: "center",
    marginBottom: 24,
    letterSpacing: -0.3,
  },
  datosContainer: {
    gap: 12,
    marginBottom: 24,
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
  },
  numeroDestacado: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1D4ED8",
    letterSpacing: -0.5,
  },
  valorDestacado: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E40AF",
    letterSpacing: -0.3,
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
  botonLimpiar: {
    padding: 8,
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
  },
  listaAlambres: {
    gap: 12,
    marginBottom: 24,
  },
  itemAlambre: {
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
  infoAlambre: {
    flex: 1,
    marginLeft: 16,
  },
  nombreAlambre: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  aplicacionAlambre: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  diametroAlambre: {
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
  botonMenu: {
    padding: 8,
  },
});

export default AsistenteVoz;
