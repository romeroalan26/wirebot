# Asistente de Fábrica de Alambres

Una aplicación React Native con Expo que permite consultar información de alambres mediante comandos de voz en español.

## Características

- 🎤 **Reconocimiento de voz en español** usando expo-speech-recognition
- 🔊 **Síntesis de voz en español** con expo-speech
- 📊 **Base de datos local** de especificaciones de alambres
- 🏭 **Diseño optimizado para fábrica** con texto grande y contraste alto
- 📱 **Compatible con iOS y Android**

## Requisitos

- Node.js 16 o superior
- Expo CLI
- Dispositivo físico (recomendado para reconocimiento de voz)

## Instalación

1. Clona el repositorio:

```bash
git clone <url-del-repositorio>
cd asistente-fabrica-alambres
```

2. Instala las dependencias:

```bash
npm install
```

3. Genera los archivos nativos y compila la aplicación:

```bash
npx expo prebuild --clean
npx expo run:android    # Para Android
# o
npx expo run:ios        # Para iOS
```

**Nota importante:** Esta aplicación requiere código nativo para el reconocimiento de voz, por lo que NO funciona con `expo start` en Expo Go. Debes usar los comandos de arriba para generar un build nativo.

## Uso

### Comandos de Voz Soportados

La aplicación reconoce los siguientes tipos de comandos:

- **"Alambre número 10"**
- **"Quiero fabricar alambre 12"**
- **"Número 14"**
- **"Alambre 16"**

### Funcionamiento

1. **Presiona el botón del micrófono** para activar el reconocimiento de voz
2. **Habla claramente** uno de los comandos soportados
3. **Escucha la respuesta** con la información del alambre solicitado
4. **Visualiza los datos** en pantalla: número, diámetro, hilo, bobina y tuerca

### Números de Alambre Disponibles

- **Alambre 8**: Diámetro 3.26 mm, Cobre 2.0mm, Bobina A, Tuerca T1
- **Alambre 10**: Diámetro 2.59 mm, Cobre 1.5mm, Bobina A, Tuerca T1
- **Alambre 12**: Diámetro 2.05 mm, Cobre 1.2mm, Bobina B, Tuerca T2
- **Alambre 14**: Diámetro 1.63 mm, Cobre 1.0mm, Bobina B, Tuerca T2
- **Alambre 16**: Diámetro 1.29 mm, Cobre 0.8mm, Bobina C, Tuerca T3
- **Alambre 18**: Diámetro 1.02 mm, Cobre 0.6mm, Bobina C, Tuerca T3

## Estructura del Proyecto

```
asistente-fabrica-alambres/
├── App.tsx                 # Componente principal
├── AsistenteVoz.tsx       # Componente del asistente de voz
├── assets/
│   └── alambres.json      # Base de datos de alambres

├── package.json
├── tsconfig.json
└── README.md
```

## Personalización

### Agregar Nuevos Alambres

Edita el archivo `assets/alambres.json` con la siguiente estructura:

```json
{
  "numero": 20,
  "diametro": "0.81 mm",
  "hilo": "Cobre 0.5mm",
  "bobina": "Bobina D",
  "tuerca": "Tuerca T4"
}
```

### Modificar Comandos de Voz

En `AsistenteVoz.tsx`, modifica la función `procesarComandoVoz` para agregar nuevos patrones de reconocimiento:

```typescript
const patronNumero = /(?:alambre|número|numero|wire)\s*(\d+)|(\d+)/gi;
```

### Cambiar Idioma

Para cambiar el idioma del reconocimiento y síntesis de voz:

```typescript
// Reconocimiento de voz
await Voice.start("en-US"); // Para inglés

// Síntesis de voz
Speech.speak(texto, {
  language: "en-US",
  pitch: 1.0,
  rate: 0.8,
});
```

## Tecnologías Utilizadas

- **React Native** con Expo
- **TypeScript** para tipado estático
- **expo-speech-recognition** para reconocimiento de voz
- **expo-speech** para síntesis de voz
- **@expo/vector-icons** para iconografía

## Permisos Requeridos

La aplicación requiere los siguientes permisos:

- **Micrófono**: Para el reconocimiento de voz
- **Audio**: Para la síntesis de voz

## Troubleshooting

### Problemas Comunes

1. **El reconocimiento de voz no funciona**:

   - Asegúrate de usar un dispositivo físico con Android 13+ o iOS
   - Verifica que los permisos de micrófono estén habilitados
   - La aplicación debe construirse con `npx expo run:android` o `npx expo run:ios`

2. **No se escucha el audio**:

   - Verifica el volumen del dispositivo
   - Comprueba que no esté en modo silencioso

3. **La aplicación no encuentra los datos**:
   - Los datos de respaldo se cargan automáticamente
   - Verifica que el archivo `alambres.json` esté en la carpeta assets

## Desarrollo

### Scripts Disponibles

```bash
npm start          # Inicia el servidor de desarrollo
npm run android    # Ejecuta en Android
npm run ios        # Ejecuta en iOS
npm run web        # Ejecuta en navegador web
```

### Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Contacto

Para soporte técnico o preguntas sobre el proyecto, abre un issue en el repositorio.
