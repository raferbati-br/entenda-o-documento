# Resumo da Implementação - Publicação Mobile

## O Que Foi Feito

Este PR adiciona toda a infraestrutura necessária para publicar o aplicativo "Entenda o Documento" na Apple Store e Google Play.

## Decisões de Arquitetura

### Estratégia: Aplicativo Híbrido com Capacitor

**Por que híbrido e não PWA puro ou nativo?**

✅ **Vantagens:**
- Presença nas lojas oficiais (descoberta, confiança)
- Acesso nativo à câmera e recursos do device
- Experiência de usuário nativa (ícone na home, splash screen)
- Código único: Next.js mantido como está
- Backend centralizado para IA (sem duplicação de lógica)

❌ **PWA puro não seria ideal porque:**
- Menor descoberta (usuários não procuram na web)
- Limitações de câmera em alguns browsers
- Menos confiança para dados sensíveis

❌ **Nativo puro não seria ideal porque:**
- Duplicação de código (Swift/Kotlin + Next.js)
- Manutenção complexa (3 codebases)
- IA backend precisaria ser separado de qualquer forma

### Arquitetura Implementada

```
┌─────────────────────┐
│   iOS / Android     │  ← App nativo (Capacitor WebView)
│   (Capacitor)       │  ← Ícone, splash, permissões
└─────────┬───────────┘
          │
          │ HTTPS (conexão segura)
          │
┌─────────▼───────────┐
│   Next.js Server    │  ← Backend existente (Vercel, etc.)
│   API Routes        │  ← /api/analyze, /api/ocr, /api/qa
│   - OpenAI/Gemini   │
│   - OCR             │
│   - Postprocessing  │
└─────────────────────┘
```

**Fluxo:**
1. Usuário abre app nativo no celular
2. App carrega interface do Next.js via WebView
3. Usuário tira foto (API nativa da câmera)
4. Foto é enviada para API Next.js via HTTPS
5. Backend processa com IA e retorna resultado
6. Interface mostra explicações

## Estrutura Criada

### 1. Configuração Capacitor

**`capacitor.config.ts`**
- App ID: `br.raferbati.entendaodocumento`
- App Name: `Entenda o Documento`
- Servidor: Conecta ao backend Next.js (configurável)
- Plugins:
  - **Keyboard**: `resize: 'native'` → **Soluciona accessory bar no iOS** ✅
  - **SplashScreen**: Tela inicial branca

### 2. Projetos Nativos

**iOS** (`ios/` - gitignored)
- Projeto Xcode completo
- Info.plist configurado:
  - Permissões de câmera em português
  - Orientação portrait apenas
  - Locale pt-BR
  - Configurações de privacidade

**Android** (`android/` - gitignored)
- Projeto Android Studio completo
- AndroidManifest.xml configurado:
  - Permissões de câmera e galeria
  - Orientação portrait
  - `windowSoftInputMode="adjustResize"` (layout com teclado)
  - `usesCleartextTraffic=true` (para desenvolvimento local)

### 3. Scripts NPM

```bash
# Setup inicial (criar projetos nativos)
npm run cap:init        # Cria out/ placeholder
npm run cap:add:ios     # Cria projeto iOS
npm run cap:add:android # Cria projeto Android

# Workflow de desenvolvimento
npm run cap:sync        # Sincroniza web → nativo
npm run cap:open:ios    # Abre Xcode
npm run cap:open:android # Abre Android Studio
```

### 4. Documentação

#### `docs/deployment/mobile-publishing.md` (14KB)
**Guia master de publicação**
- Estratégia de distribuição explicada
- Setup completo iOS e Android
- Processo de signing e certificados
- TestFlight e Google Play Console
- Requisitos de privacidade (LGPD, lojas)
- Checklist de submissão
- Troubleshooting

#### `docs/deployment/privacy-policy.md` (7KB)
**Template de política de privacidade**
- Pré-preenchido com o que o app faz
- Conformidade LGPD
- Seções obrigatórias para lojas
- Pronto para adaptar e publicar

#### `docs/deployment/marketing-assets.md` (11KB)
**Guia de materiais de marketing**
- Descrições do app (curta e completa)
- Palavras-chave
- Especificações de ícones (1024x1024, 512x512)
- Guia de screenshots (tamanhos, conteúdo)
- Templates de release notes
- URLs obrigatórias

#### `docs/deployment/README.md` (8KB)
**Overview da pasta deployment**
- Resumo de cada documento
- Workflow de publicação
- Scripts disponíveis
- Checklist rápido

#### `docs/deployment/QUICK_START.md` (7KB)
**Guia rápido para desenvolvedores**
- TL;DR de comandos
- Live reload setup
- Debugging (Safari Inspector, Chrome Inspect)
- Estrutura de arquivos
- Solução de problemas comuns

### 5. Modificações em Arquivos Existentes

**`package.json`**
- Dependências Capacitor adicionadas:
  - @capacitor/core, @capacitor/cli
  - @capacitor/ios, @capacitor/android
  - @capacitor/keyboard, @capacitor/splash-screen
- Scripts de desenvolvimento mobile

**`.gitignore`**
- Ignorar `android/`, `ios/`, `.capacitor/`
- Projetos nativos são gerados localmente por cada dev

**`README.md`**
- Link para documentação de mobile publishing

## Solução do Problema da Accessory Bar (iOS)

### Problema Original
No iOS, quando o teclado aparece, uma barra cinza com botões (Previous, Next, Done) aparece acima do teclado, ocupando espaço extra.

### Solução Implementada ✅

1. **Plugin instalado**: `@capacitor/keyboard`
2. **Configuração**: `Keyboard.resize = 'native'` em `capacitor.config.ts`
3. **Resultado**: O iOS usa o comportamento nativo do teclado, sem a barra accessória

### Como Funciona
- `resize: 'native'` = usa KeyboardResizeMode nativo do iOS
- O conteúdo é redimensionado naturalmente quando o teclado aparece
- Sem barras extras, mais espaço para o conteúdo

## Próximos Passos (Para o Usuário)

### Imediato (Setup)
1. ✅ Código está pronto
2. ⏳ Instalar ferramentas:
   - **macOS**: Xcode da App Store, CocoaPods
   - **Qualquer OS**: Android Studio, JDK 17+
3. ⏳ Criar contas:
   - Apple Developer ($99/ano): https://developer.apple.com
   - Google Play Console ($25 única): https://play.google.com/console

### Desenvolvimento Local
```bash
# Em um terminal
npm run dev

# Em outro terminal (para testar no iOS)
npm run cap:sync
npm run cap:open:ios

# Ou para Android
npm run cap:sync
npm run cap:open:android
```

### Preparação para Lançamento

#### 1. Assets Gráficos (1-2 semanas)
- [ ] Criar ícone 1024x1024 (iOS) e 512x512 (Android)
- [ ] Capturar screenshots:
  - iPhone 6.7", 6.5", 5.5" (mínimo 3 cada)
  - Android 1080x1920 (mínimo 2)
- [ ] (Opcional) Gravar vídeo de 15-30s
- **Guia**: `docs/deployment/marketing-assets.md`

#### 2. Legal (1 semana)
- [ ] Adaptar `docs/deployment/privacy-policy.md`
- [ ] Publicar em website acessível publicamente
- [ ] Designar DPO (se aplicável)
- [ ] Criar página de suporte

#### 3. Deploy do Backend
- [ ] Deploy Next.js em produção (ex: Vercel)
- [ ] Configurar variáveis de ambiente
- [ ] Testar APIs em produção
- [ ] Atualizar `CAPACITOR_SERVER_URL` no config

#### 4. Build de Produção

**iOS:**
```bash
# No Xcode
1. Configurar Signing & Capabilities
2. Selecionar "Any iOS Device (arm64)"
3. Product > Archive
4. Window > Organizer > Distribute App
5. Upload para App Store Connect
```

**Android:**
```bash
# Gerar keystore (UMA VEZ, guardar com segurança!)
keytool -genkey -v -keystore entenda-release.keystore \
  -alias entenda-release -keyalg RSA -keysize 2048 -validity 10000

# Build AAB
cd android
./gradlew bundleRelease

# Arquivo gerado em:
# app/build/outputs/bundle/release/app-release.aab
```

#### 5. Submissão

**Apple Store Connect:**
- Criar app no App Store Connect
- Preencher metadados, descrições, screenshots
- Responder questionário de privacidade
- Submeter build para revisão
- Aguardar 1-3 dias

**Google Play Console:**
- Criar app no Google Play Console
- Preencher store listing
- Configurar Data Safety
- Fazer upload do AAB
- Submeter para revisão
- Aguardar horas a 3 dias

**Guia completo**: `docs/deployment/mobile-publishing.md`

## Diferenças do PWA Atual

### O Que Muda
- ✅ Usuários instalam das lojas (não do navegador)
- ✅ Ícone aparece como app nativo
- ✅ Melhor acesso à câmera
- ✅ Mais confiança (lojas oficiais)
- ✅ Notificações push (futuro)

### O Que NÃO Muda
- 🔄 Backend Next.js continua igual
- 🔄 APIs continuam iguais
- 🔄 Processamento de IA continua igual
- 🔄 Desenvolvimento web continua igual (`npm run dev`)

## Manutenção Futura

### Atualizar Versão
```json
// package.json
"version": "1.1.0"

// iOS: Xcode > Target > General
Version: 1.1.0
Build: auto-incremento

// Android: build.gradle
versionCode 2        // sempre incrementar
versionName "1.1.0"  // semântico
```

### Deploy de Atualização
1. Fazer mudanças no código
2. `npm run build` (testar)
3. `npm run cap:sync`
4. Build e upload novo binário (iOS/Android)
5. Submeter para revisão
6. Lançamento

## Recursos de Referência

### Documentação Criada
- 📖 [Mobile Publishing Guide](docs/deployment/mobile-publishing.md)
- 🔒 [Privacy Policy Template](docs/deployment/privacy-policy.md)
- 🎨 [Marketing Assets Guide](docs/deployment/marketing-assets.md)
- ⚡ [Quick Start](docs/deployment/QUICK_START.md)

### Links Externos
- [Capacitor Docs](https://capacitorjs.com/docs)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Google Play Console](https://play.google.com/console)
- [Apple Developer](https://developer.apple.com)
- [Android Developers](https://developer.android.com)

## Perguntas Frequentes

### "Preciso manter dois códigos?"
**Não.** O código Next.js é único. Capacitor só empacota a interface web.

### "Como funciona em produção?"
O app mobile faz HTTPS para o servidor Next.js (Vercel, etc.). Tudo server-side continua igual.

### "E a câmera?"
Capacitor usa a API nativa (UIImagePickerController no iOS, Intent.ACTION_IMAGE_CAPTURE no Android). Mais rápida e confiável que MediaDevices Web API.

### "Preciso publicar em ambas as lojas?"
Não, pode publicar em apenas uma. Mas recomenda-se ambas para maior alcance.

### "Quanto custa?"
- **Apple:** $99/ano (conta Developer)
- **Google:** $25 uma vez (conta Console)
- **Hospedagem:** Conforme seu plano (Vercel free tier pode ser suficiente)

### "Quanto tempo leva?"
- **Setup técnico:** 1-2 dias (se já tem ferramentas)
- **Assets e legal:** 1-2 semanas
- **Revisão das lojas:** 1-3 dias (Apple) a horas-3 dias (Google)
- **Total:** 2-3 semanas para primeira publicação

### "E se for rejeitado?"
Apple e Google fornecem feedback. Geralmente é algo simples:
- Screenshot errado
- Descrição confusa
- Falta de política de privacidade
- Permissão sem justificativa

Corrija e resubmeta. É normal precisar de 1-2 iterações.

## Status Atual

✅ **Concluído:**
- Capacitor configurado
- Projetos iOS e Android criados
- Permissões configuradas
- Accessory bar iOS resolvido
- Documentação completa criada
- Scripts NPM prontos

⏳ **Próximos passos (usuário):**
- Instalar ferramentas (Xcode, Android Studio)
- Criar contas (Apple, Google)
- Preparar assets gráficos
- Publicar política de privacidade
- Deploy backend em produção
- Submeter para lojas

---

**Autor:** GitHub Copilot  
**Data:** 2 de fevereiro de 2026  
**Issue:** #[número] - Publicar app na Apple Store e Google Play
