# Mobile Auth App (PIN, Password & Biometrics)

A production-ready React Native (Expo) mobile authentication application supporting **PIN**, **Password**, and **Biometric (Fingerprint / Face ID)** authentication.

---

## 🚀 Features

- **Master Password Authentication**: Secure, salted SHA-256 password setup and sign-in with show/hide toggle.
- **4-Digit Quick PIN**: Custom interactive dial pad with masked dot indicators, haptic feedback, and auto-submit upon completion.
- **Hardware-backed Biometrics**: Integrates with `expo-local-authentication` to support **Fingerprint (Touch ID / Android BiometricPrompt)** and **Facial Recognition (Face ID)**.
- **Hardware Keystore / Keychain**: Uses `expo-secure-store` to encrypt and store auth state in iOS Keychain / Android KeyStore.
- **Graceful Fallbacks**:
  - Seamlessly switch between PIN, Password, and Biometric unlock anytime.
  - Web and emulator fallbacks so you can test locally even without physical biometric hardware.
- **Authenticated Dashboard**:
  - Displays authentication method used for the current session.
  - Live hardware sensor diagnostics (Hardware present? Biometrics enrolled?).
  - Toggle biometric unlock on/off.
  - "Lock App" and "Reset Credentials" controls.

---

## 📱 How to Run on Your Mobile Phone

1. Install the **Expo Go** app on your phone:
   - **Android**: Download from Google Play Store.
   - **iOS**: Download from Apple App Store.

2. Open PowerShell or Terminal in this folder:
   ```powershell
   cd C:\Users\praja\Downloads\mobile
   npm start
   ```

3. Scan the QR code shown in the terminal:
   - On Android: Use the Expo Go app to scan the QR code.
   - On iOS: Use the built-in Camera app to scan the QR code.

4. The app will open on your phone with full native Fingerprint / Face ID support!

---

## 🌐 Running in the Web Browser

You can also test the UI, PIN keypad, and password flow in your web browser:
```powershell
npm run web
```
*(If prompted to install web dependencies like `@expo/metro-runtime`, press Y)*.

---

## 📂 Project Structure

```
mobile/
├── App.tsx                      # Root component & screen router
├── src/
│   ├── components/
│   │   └── PinKeypad.tsx        # Dial pad, masked dots, biometric shortcut
│   ├── context/
│   │   └── AuthContext.tsx      # Auth state, login/logout, profile
│   ├── screens/
│   │   ├── SetupScreen.tsx      # Initial onboarding (Password -> PIN -> Biometrics)
│   │   ├── LockScreen.tsx       # Lock screen (PIN, Password fallback, Biometric trigger)
│   │   └── HomeScreen.tsx       # Secure authenticated dashboard & settings
│   └── services/
│       └── authService.ts       # Hashing, SecureStore & LocalAuthentication API
├── app.json                     # Expo configuration with biometric permissions
└── package.json
```

---

## 🔒 Security Best Practices Implemented

1. **No Plaintext Storage**: PINs and passwords are salted and hashed using cryptographic SHA-256 (`expo-crypto`) before being written to persistent storage.
2. **Platform Secure Storage**: Credentials are encrypted at rest using `expo-secure-store`, backed by hardware security modules (HSM) on Android and Secure Enclave / Keychain on iOS.
3. **Biometric Security Flags**: Biometric authentication uses `disableDeviceFallback: true` to prevent OS-level PIN overrides from bypassing your custom application credentials.
