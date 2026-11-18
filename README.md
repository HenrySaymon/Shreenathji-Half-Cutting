# Shreenathji Billing – Android app

Billing, invoices, customers and sticker photos. Data is stored in a real SQLite
database on the phone (tables: invoices, customers, stickers, settings, meta).

## Get the APK (no software needed) – GitHub
1. Create a free GitHub account and a new empty repository.
2. Upload ALL files from this folder (drag the folder contents into the repo page).
3. Open the repo -> Actions -> "Build APK" -> Run workflow (it also runs on every upload).
4. After ~5 minutes open the finished run -> Artifacts -> download "Shreenathji-Billing-APK".
5. Unzip, copy app-debug.apk to the phone, open it, allow "Install unknown apps".

## Or build on your PC
Install Node 20, JDK 17 and Android Studio (SDK 34), then:
    npm install
    npm run apk        # APK: android/app/build/outputs/apk/debug/app-debug.apk
or open the `android` folder in Android Studio and press Run.

## Notes
- Update the app by installing a newer APK over the old one; data is kept.
- Use Settings -> Export backup regularly (uninstalling the app deletes its data).
- The APK is debug-signed: fine for your own phone, not for Play Store upload.
