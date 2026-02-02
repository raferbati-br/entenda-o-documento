# Deployment Documentation

Esta pasta contém toda a documentação necessária para publicar o aplicativo **Entenda o Documento** nas lojas de aplicativos móveis e manter o serviço em produção.

## Documentos Disponíveis

### 📱 [mobile-publishing.md](./mobile-publishing.md)
**Guia completo de publicação para Apple Store e Google Play**

Conteúdo:
- Estratégia de distribuição (Capacitor híbrido)
- Configuração de ambiente (Xcode, Android Studio)
- Setup iOS (signing, TestFlight, App Store Connect)
- Setup Android (keystore, AAB, Google Play Console)
- Requisitos de privacidade e compliance
- Checklist de submissão
- Configuração de servidor de produção
- Troubleshooting comum

**Quando usar:** Ao preparar primeira submissão ou atualizar versão

---

### 🔒 [privacy-policy.md](./privacy-policy.md)
**Política de Privacidade completa (obrigatória para lojas)**

Conteúdo:
- Informações coletadas (fotos, texto extraído)
- Como usamos os dados
- Compartilhamento com provedores de IA (OpenAI, Gemini)
- Direitos do usuário (LGPD)
- Medidas de segurança
- Retenção e exclusão de dados
- Contato e DPO

**Quando usar:** 
- Publicar em website antes de submeter app
- Linkar nas configurações do app
- Incluir no App Store Connect / Google Play Console

**⚠️ Importante:** Preencher campos marcados com `[...]` antes de publicar

---

### 🎨 [marketing-assets.md](./marketing-assets.md)
**Assets e materiais de marketing para as lojas**

Conteúdo:
- Descrições do app (curta e completa)
- Palavras-chave e tags
- Especificações de ícones
- Guia de screenshots (iPhone, iPad, Android)
- Script de vídeo de demonstração (opcional)
- Textos de release notes
- Templates de resposta a avaliações
- URLs obrigatórias
- Categorias e classificação etária

**Quando usar:** Ao criar perfil nas lojas e preparar materiais visuais

---

## Workflow de Publicação

### Primeira Publicação

1. **Preparação** (1-2 semanas)
   - [ ] Ler `mobile-publishing.md` completamente
   - [ ] Instalar ferramentas (Xcode, Android Studio)
   - [ ] Criar contas (Apple Developer, Google Play Console)
   - [ ] Preparar assets gráficos conforme `marketing-assets.md`
   - [ ] Publicar política de privacidade (adaptar `privacy-policy.md`)

2. **Configuração iOS** (3-5 dias)
   - [ ] Configurar signing no Xcode
   - [ ] Build para TestFlight
   - [ ] Testar com beta testers
   - [ ] Preencher App Store Connect
   - [ ] Submeter para revisão

3. **Configuração Android** (2-3 dias)
   - [ ] Gerar keystore de produção
   - [ ] Build AAB assinado
   - [ ] Teste interno no Google Play
   - [ ] Preencher Google Play Console
   - [ ] Submeter para revisão

4. **Aguardar Aprovação**
   - Apple: 1-3 dias (em média)
   - Google: Algumas horas a 3 dias

5. **Lançamento**
   - [ ] Verificar app nas lojas
   - [ ] Monitorar reviews e crashes
   - [ ] Responder a feedback inicial

### Atualizações Subsequentes

1. **Preparação**
   - [ ] Incrementar versionCode/Build Number
   - [ ] Atualizar versionName (semântico)
   - [ ] Preparar release notes

2. **Build e Teste**
   - [ ] Testar em dispositivos reais
   - [ ] Verificar regressões
   - [ ] TestFlight/Teste Interno (se mudanças significativas)

3. **Submissão**
   - [ ] Upload novo build
   - [ ] Atualizar informações (se necessário)
   - [ ] Submeter para revisão

4. **Deploy**
   - [ ] Aguardar aprovação
   - [ ] Lançamento gradual (staged rollout)
   - [ ] Monitorar métricas

---

## Scripts NPM Disponíveis

### Capacitor

```bash
# Inicializar placeholder out/
npm run cap:init

# Adicionar plataformas (primeira vez apenas)
npm run cap:add:ios
npm run cap:add:android

# Sincronizar código web com nativos
npm run cap:sync

# Abrir IDEs
npm run cap:open:ios      # Xcode
npm run cap:open:android  # Android Studio
```

### Desenvolvimento

```bash
# Rodar servidor Next.js localmente
npm run dev

# Build de produção (para deploy do servidor)
npm run build

# Iniciar servidor de produção
npm start
```

### Testes

```bash
# Rodar todos os testes
npm test

# Apenas testes unitários
npm run test:unit

# Apenas testes E2E
npm run test:e2e

# Cobertura
npm run test:coverage
```

---

## Arquivos Importantes

### Configuração Capacitor

**`/capacitor.config.ts`**
- App ID: `br.raferbati.entendaodocumento`
- App Name: `Entenda o Documento`
- Web Dir: `out` (placeholder para Capacitor sync)
- Server URL: Configurável via `CAPACITOR_SERVER_URL`
- Plugins: Keyboard (resolve accessory bar iOS), SplashScreen

**Importante:** O app roda em modo híbrido, conectando-se ao backend Next.js.

### iOS

**`/ios/App/App/Info.plist`**
- Permissões de câmera configuradas
- Orientação: Portrait apenas
- Descrições de uso em português

### Android

**`/android/app/src/main/AndroidManifest.xml`**
- Permissões de câmera e armazenamento
- Orientação: Portrait
- `windowSoftInputMode="adjustResize"`

**`/android/app/build.gradle`**
- versionCode: 1
- versionName: "1.0"
- minSdk: 22 (Android 5.0+)
- targetSdk: 34 (Android 14)

---

## Ambientes

### Desenvolvimento
- **URL:** http://localhost:3000
- **Configuração:** `.env.local`
- **Capacitor:** Aponta para localhost

### Produção
- **URL:** https://seu-app.vercel.app (ou outro provider)
- **Configuração:** Variáveis de ambiente no hosting
- **Capacitor:** Atualizar `CAPACITOR_SERVER_URL` ou `server.url` no config

---

## Checklist Rápido

### Antes da Primeira Submissão

**Documentação Legal:**
- [ ] Política de privacidade publicada em URL pública
- [ ] Email de contato/suporte ativo
- [ ] DPO designado (se aplicável pela LGPD)

**Assets Visuais:**
- [ ] Ícone 1024x1024 (iOS) e 512x512 (Android)
- [ ] Screenshots para todos os tamanhos obrigatórios
- [ ] Vídeo preview (opcional)

**Contas e Certificados:**
- [ ] Apple Developer account ativo ($99/ano)
- [ ] Google Play Console account ativo ($25 one-time)
- [ ] Certificados de produção configurados

**Testes:**
- [ ] App testado em dispositivos reais (iOS e Android)
- [ ] Permissões de câmera funcionando
- [ ] Conexão com backend funcionando
- [ ] Fluxo completo: captura → análise → resultado

**Configurações Técnicas:**
- [ ] Bundle ID/Package name registrados
- [ ] Versioning correto (1.0, versionCode 1)
- [ ] Signing configurado (iOS e Android)
- [ ] Backend em produção e funcionando

---

## Recursos Externos

### Apple
- [App Store Connect](https://appstoreconnect.apple.com)
- [Developer Account](https://developer.apple.com/account/)
- [Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

### Google
- [Google Play Console](https://play.google.com/console)
- [Developer Policy Center](https://play.google.com/about/developer-content-policy/)
- [App Signing](https://support.google.com/googleplay/android-developer/answer/9842756)

### Capacitor
- [Documentation](https://capacitorjs.com/docs)
- [iOS Setup](https://capacitorjs.com/docs/ios)
- [Android Setup](https://capacitorjs.com/docs/android)

### Compliance
- [LGPD - Lei 13.709/2018](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [ANPD - Autoridade Nacional](https://www.gov.br/anpd)

---

## Suporte

### Questões Técnicas
- **GitHub Issues:** [raferbati-br/entenda-o-documento](https://github.com/raferbati-br/entenda-o-documento/issues)
- **Documentação Principal:** [/docs/README.md](../README.md)

### Problemas de Submissão
- Consultar `mobile-publishing.md` seção "Troubleshooting"
- Fóruns oficiais: Apple Developer Forums, Android Developers Community

---

**Última atualização:** 2 de fevereiro de 2026

**Próximos Passos:** Ler `mobile-publishing.md` e começar preparação das contas e assets!
