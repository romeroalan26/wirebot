# Solución al error de Android SDK en React Native/Expo

## Problema

Al compilar la app para Android, aparecía el siguiente error:

```
A problem occurred configuring project ':app'.
> Trailing char < > at index 40: C:\Users\Alan2\AppData\Local\Android\Sdk
```

## Causa

El archivo `android/local.properties` tenía un espacio al final de la línea donde se define la ruta del SDK:

```
sdk.dir=C:/Users/Alan2/AppData/Local/Android/Sdk␣
```

(Ese espacio invisible al final de la línea causaba el error)

## Solución

1. Abrir el archivo `android/local.properties`.
2. Eliminar cualquier espacio al final de la línea, dejando exactamente así:
   ```
   sdk.dir=C:/Users/Alan2/AppData/Local/Android/Sdk
   ```
   (Sin espacios antes ni después)
3. Guardar el archivo.
4. Volver a ejecutar el comando:
   ```
   npx expo run:android
   ```
5. La compilación y ejecución de la app funcionó correctamente.

---

**Recomendación:**
Siempre revisa que las rutas en archivos de configuración no tengan espacios al final, especialmente en `local.properties` para Android.
