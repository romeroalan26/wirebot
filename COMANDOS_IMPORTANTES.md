# Comando para generar APK

cd android && ./gradlew assembleRelease

./gradlew clean && ./gradlew assembleRelease

# Comando para instalar la APK generada

# Si estás en el directorio raíz del proyecto:

adb install android/app/build/outputs/apk/release/app-release.apk

# Si estás dentro del directorio android:

adb install app/build/outputs/apk/release/app-release.apk

# Para verificar si el archivo APK existe:

dir app\build\outputs\apk\release
