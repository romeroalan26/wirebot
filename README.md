# Asistente de Fábrica MERCAPLAS

Aplicación móvil para consulta y administración de procesos de fábrica, optimizada para operarios y supervisores de MERCAPLAS. Permite interactuar por voz o menú, consultar información técnica y gestionar procesos de manera sencilla y segura.

---

## Características principales

- 🎤 **Reconocimiento de voz en español** (consultas y comandos)
- 🔊 **Síntesis de voz** para respuestas habladas
- 🏭 **Gestión de procesos**: consulta, agrega y elimina procesos (requiere login)
- 🔐 **Autenticación de usuario** (Supabase)
- 📋 **Menú de opciones avanzado**: guía de uso, configuración de voz, lista de procesos, administración
- 🖼️ **Logo y branding MERCAPLAS**
- 📱 **Compatible con Android** (requiere build nativo)
- 💬 **Interfaz moderna y accesible** (botones grandes, navegación intuitiva)

---

## Requisitos

- Node.js 16 o superior
- Expo CLI
- Cuenta y proyecto en Supabase (con tabla `procesos`)
- Dispositivo físico Android (recomendado para reconocimiento de voz)

---

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

3. Configura tus variables de entorno de Supabase en `.env`:

   ```
   SUPABASE_URL=...
   SUPABASE_ANON_KEY=...
   ```

4. Genera los archivos nativos y compila la aplicación:

   ```bash
   npx expo prebuild --clean
   npx expo run:android    # Para Android
   ```

   > **Nota:** No funciona en Expo Go. Debes usar build nativo.

---

## Uso

### Funciones principales

- **Consultar procesos:** Pulsa el micrófono y di el nombre o tipo de proceso, o usa el menú para buscar manualmente.
- **Administrar procesos:** Desde el menú, entra a "Administrar Procesos" (requiere login) para agregar o eliminar procesos.
- **Configurar voz:** Ajusta la velocidad de la voz desde el menú.
- **Guía de uso:** Consulta la guía rápida desde el menú de opciones.

### Consejos

- Usa palabras claras y directas al hablar.
- Si tienes problemas con el micrófono, revisa los permisos en tu dispositivo.
- Solo usuarios autenticados pueden agregar o eliminar procesos.

---

## Estructura del Proyecto

```
assets/                # Imágenes y logo MERCAPLAS
src/components/        # Componentes principales (menús, modales, etc.)
AsistenteVoz.tsx       # Componente principal de la app
supabaseClient.ts      # Configuración de Supabase
syncService.ts         # Sincronización de procesos
...
```

---

## Créditos

Desarrollado para MERCAPLAS.
