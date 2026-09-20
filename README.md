# Mobile Auth App (PIN, Character Password & Pattern Lock)

A production-ready React Native (Expo) mobile authentication application supporting **Numeric PIN**, **Character Password**, and **3x3 Grid Pattern Lock**.

---

## 🚀 Features

- **1. Numeric PIN**: 4-digit numeric dial pad with masked circle indicators, auto-submit, and backspace/clear controls.
- **2. Character Password**: Alphanumeric text password (supporting letters, numbers, and special characters) with show/hide password visibility toggle.
- **3. Pattern Lock**: Interactive 3x3 dot grid connect-the-dots gesture unlock with real-time SVG lines, minimum 4-dot path validation, and error flash.
- **Hardware-backed Encryption**: Uses `expo-secure-store` and salted cryptographic SHA-256 (`expo-crypto`) to store and verify credentials.
- **Multi-Method Switcher**: The lock screen allows switching between PIN, Pattern, and Password anytime with 1 tap.
- **Cross-Platform**: Runs natively on Android & iOS via Expo Go, and runs on web browsers with full mouse and touch support.

---

## 📱 Running on Mobile (Expo Go)

1. Open PowerShell:
   ```powershell
   cd C:\Users\praja\Downloads\mobile
   npm start
   ```
2. Scan the QR code using the **Expo Go** app on Android or the **Camera** app on iPhone.

---

## 🌐 Running Locally in Web Browser

```powershell
cd C:\Users\praja\Downloads\mobile
npm run web
```
Then visit `http://localhost:8081`.

---

## ☁️ Deploying to Vercel

The project contains `vercel.json` and a production web export script (`npm run build`).
1. Connect your repository `https://github.com/prajaktaukirde/mobile` on [vercel.com/new](https://vercel.com/new).
2. Click **Deploy**. Vercel will build and host the app automatically.
