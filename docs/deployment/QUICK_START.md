# Quick Start - Mobile Development

Este é um guia rápido para desenvolvedores que querem trabalhar com o app mobile.

## TL;DR

```bash
# Instalar dependências (primeira vez)
npm install

# Desenvolvimento web local
npm run dev

# Abrir iOS no Xcode (macOS apenas)
npm run cap:sync
npm run cap:open:ios

# Abrir Android no Android Studio
npm run cap:sync
npm run cap:open:android
```

## Arquitetura

**Modo Híbrido (Capacitor):**
- 📱 App nativo (iOS/Android) com WebView
- 🌐 Backend Next.js (hospedado separadamente)
- 🔗 Comunicação via HTTPS

```
┌─────────────┐
│  Native App │ (iOS/Android)
│  (Capacitor)│
└──────┬──────┘
       │ HTTPS
       │
┌──────▼──────┐
│  Next.js    │ (Vercel/Cloud)
│  Backend    │
└─────────────┘
```

## Desenvolvimento

### Web (Local)

```bash
# Servidor de desenvolvimento
npm run dev

# Acesse: http://localhost:3000
```

**Nota:** O app mobile em desenvolvimento também conecta ao localhost.

### iOS (Requer macOS)

```bash
# Sincronizar alterações web → nativo
npm run cap:sync

# Abrir Xcode
npm run cap:open:ios

# No Xcode:
# 1. Selecione um simulador
# 2. Command + R para executar
```

**Primeira vez:**
- Instalar Xcode da App Store
- Instalar CocoaPods: `sudo gem install cocoapods`
- Adicionar plataforma: `npm run cap:add:ios`

### Android

```bash
# Sincronizar alterações web → nativo
npm run cap:sync

# Abrir Android Studio
npm run cap:open:android

# No Android Studio:
# 1. Aguardar Gradle sync
# 2. Selecione emulador ou device
# 3. Run (Shift + F10)
```

**Primeira vez:**
- Instalar Android Studio
- Instalar JDK 17+
- Adicionar plataforma: `npm run cap:add:android`

## Live Reload

Para ver mudanças em tempo real no app mobile:

### Opção 1: Configure IP Local

```bash
# 1. Descubra seu IP local
# macOS/Linux:
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows:
ipconfig

# 2. Rode o servidor
npm run dev

# 3. Configure Capacitor para usar seu IP
# Edite capacitor.config.ts:
server: {
  url: 'http://SEU.IP.LOCAL:3000',
  cleartext: true,
}

# 4. Sincronize
npm run cap:sync

# 5. Execute no device/emulador
```

**Nota:** Device precisa estar na mesma rede Wi-Fi.

### Opção 2: Use Ferramentas Nativas

**iOS:**
- Hot reload funciona automaticamente no simulador
- Para device físico, use opção 1

**Android:**
- Reverse port forwarding:
```bash
adb reverse tcp:3000 tcp:3000
```
- Configure `url: 'http://localhost:3000'`

## Debugging

### Web
```bash
# Chrome DevTools
# Acesse: http://localhost:3000
# F12 para abrir DevTools
```

### iOS
```bash
# Safari Web Inspector
# 1. No Mac: Safari > Develop > [Seu Device] > [App]
# 2. Habilite primeiro: Safari > Settings > Advanced > Show Develop menu
```

### Android
```bash
# Chrome DevTools
# 1. Acesse: chrome://inspect
# 2. Selecione seu device
# 3. Click "inspect"
```

## Estrutura de Arquivos

```
entenda-o-documento/
├── src/                    # Código Next.js (web)
│   ├── app/               # Pages e API routes
│   ├── ai/                # Lógica de IA
│   └── lib/               # Utilidades
├── public/                # Assets estáticos
│   ├── icon-192.png
│   └── icon-512.png
├── ios/                   # Projeto iOS (gitignored)
│   └── App/
│       └── App/
│           └── Info.plist # Permissões e config
├── android/               # Projeto Android (gitignored)
│   └── app/
│       └── src/main/
│           ├── AndroidManifest.xml
│           └── res/
├── capacitor.config.ts    # Config Capacitor
├── next.config.ts         # Config Next.js
└── docs/deployment/       # Documentação de publicação
```

## Comandos Úteis

### NPM Scripts

```bash
# Desenvolvimento
npm run dev              # Next.js dev server
npm run build           # Build produção

# Capacitor
npm run cap:init        # Criar out/ placeholder
npm run cap:add:ios     # Adicionar iOS (primeira vez)
npm run cap:add:android # Adicionar Android (primeira vez)
npm run cap:sync        # Sincronizar web → nativo
npm run cap:open:ios    # Abrir Xcode
npm run cap:open:android # Abrir Android Studio

# Testes
npm test                # Todos os testes
npm run test:unit       # Testes unitários
npm run test:e2e        # Testes E2E
npm run lint            # ESLint
```

### Capacitor CLI

```bash
# Sincronizar
npx cap sync

# Copiar assets web
npx cap copy

# Atualizar plugins nativos
npx cap update

# Listar plugins instalados
npx cap ls

# Rodar no device
npx cap run ios         # iOS
npx cap run android     # Android
```

## Plugins Capacitor Instalados

- **@capacitor/keyboard** - Gerenciamento de teclado
  - Solução para accessory bar no iOS
  - Config: `resize: 'native'` no capacitor.config.ts

- **@capacitor/splash-screen** - Tela de splash
  - Background: branco
  - Duration: 0 (sem delay)

## Permissões Configuradas

### iOS (Info.plist)
- ✅ `NSCameraUsageDescription` - Câmera
- ✅ `NSPhotoLibraryUsageDescription` - Galeria
- ✅ `NSPhotoLibraryAddUsageDescription` - Salvar fotos

### Android (AndroidManifest.xml)
- ✅ `CAMERA` - Câmera
- ✅ `READ_MEDIA_IMAGES` - Galeria (Android 13+)
- ✅ `READ_EXTERNAL_STORAGE` - Galeria (Android 12-)
- ✅ `INTERNET` - Rede

## Solução de Problemas

### "Cannot find module '@capacitor/...'"
```bash
npm install
npx cap sync
```

### "iOS build failed"
```bash
cd ios/App
pod install
cd ../..
```

### "Android Gradle sync failed"
```bash
cd android
./gradlew clean
cd ..
npm run cap:sync
```

### "Camera not working"
- Verifique permissões no Info.plist / AndroidManifest.xml
- Teste em device real (câmera não funciona em todos os simuladores)
- No iOS Simulator: I/O > Camera pode simular câmera

### "App shows blank screen"
- Verifique URL do servidor em capacitor.config.ts
- Confirme que servidor Next.js está rodando
- Check logs do navegador (Web Inspector / Chrome Inspect)

### "Keyboard accessory bar aparece (iOS)"
- Confirme plugin instalado: `npm ls @capacitor/keyboard`
- Verifique config: `Keyboard.resize = 'native'`
- Resincronize: `npm run cap:sync`
- Rebuilde no Xcode

## Recursos Adicionais

### Documentação Completa
- **Mobile Publishing:** [docs/deployment/mobile-publishing.md](./mobile-publishing.md)
- **Privacy Policy:** [docs/deployment/privacy-policy.md](./privacy-policy.md)
- **Marketing Assets:** [docs/deployment/marketing-assets.md](./marketing-assets.md)

### Links Externos
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Android Design Guidelines](https://developer.android.com/design)

## Próximos Passos

1. **Para Desenvolvimento:**
   - Configure live reload conforme acima
   - Use Hot Module Replacement do Next.js
   - Teste em devices reais regularmente

2. **Para Publicação:**
   - Leia [mobile-publishing.md](./mobile-publishing.md)
   - Prepare assets de marketing
   - Configure certificados de produção

---

**Dica:** Mantenha o terminal aberto com `npm run dev` e outro terminal para comandos Capacitor.

**Última atualização:** 2 de fevereiro de 2026
