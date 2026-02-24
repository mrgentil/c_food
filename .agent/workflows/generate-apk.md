---
description: How to generate an APK using EAS Build
---

# Workflow: Génération d'APK (EAS Build)

Ce workflow vous guide pour transformer votre code React Native / Expo en un fichier APK installable.

1. **Installation des outils**
   ```powershell
   npm install -g eas-cli
   ```

2. **Identification**
   ```powershell
   eas login
   ```

3. **Initialisation (Dans le dossier de l'app)**
   ```powershell
   eas build:configure
   ```

4. **Lancement du Build Cloud**
   // turbo
   ```powershell
   eas build -p android --profile preview
   ```
   *Note: Le profil "preview" doit être configuré avec `buildType: "apk"` dans `eas.json`.*

5. **Récupération**
   Suivez le lien généré dans le terminal pour télécharger l'APK.
