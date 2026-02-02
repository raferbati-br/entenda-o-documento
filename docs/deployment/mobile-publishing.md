# Guia de Publicação Mobile - Apple Store e Google Play

Este documento fornece orientações completas para publicar o aplicativo "Entenda o Documento" nas lojas de aplicativos móveis.

## Estratégia de Distribuição

**Abordagem Escolhida:** Aplicativo híbrido usando Capacitor

O aplicativo usa **Capacitor** para empacotar a aplicação web Next.js como um aplicativo nativo para iOS e Android. Esta abordagem oferece:

- ✅ Acesso nativo à câmera e recursos do dispositivo
- ✅ Presença nas lojas oficiais (Apple Store e Google Play)
- ✅ Experiência de usuário nativa
- ✅ Manutenção de código única (Next.js)
- ✅ Backend centralizado para processamento de IA

### Arquitetura Híbrida

O aplicativo funciona conectando-se ao backend Next.js:
- **Mobile App (iOS/Android):** Interface nativa com Capacitor
- **Backend:** Next.js hospedado (ex: Vercel) com API routes
- **Comunicação:** HTTPS entre app e servidor

## Configuração do Ambiente

### Pré-requisitos

**Para iOS:**
- macOS com Xcode 14+ instalado
- Conta Apple Developer (USD $99/ano)
- CocoaPods: `sudo gem install cocoapods`

**Para Android:**
- Android Studio instalado
- JDK 17+ configurado
- Conta Google Play Console (taxa única de USD $25)

### Instalação

As dependências já estão instaladas no projeto:
```bash
npm install
```

Dependências Capacitor incluídas:
- `@capacitor/core` - Framework principal
- `@capacitor/cli` - Ferramentas de CLI
- `@capacitor/ios` - Plataforma iOS
- `@capacitor/android` - Plataforma Android
- `@capacitor/keyboard` - Gerenciamento de teclado (solução para accessory bar iOS)
- `@capacitor/splash-screen` - Tela de splash

## Configuração iOS

### 1. Preparar Projeto iOS

```bash
# Sincronizar projeto iOS
npm run cap:sync
```

### 2. Abrir no Xcode

```bash
npm run cap:open:ios
```

### 3. Configurações Importantes no Xcode

#### Signing & Capabilities
1. Selecione o target "App"
2. Em "Signing & Capabilities":
   - **Team:** Selecione sua equipe Apple Developer
   - **Bundle Identifier:** `br.raferbati.entendaodocumento`
   - ✅ Marque "Automatically manage signing"

#### Info.plist
As seguintes permissões já foram configuradas:
- `NSCameraUsageDescription` - Acesso à câmera
- `NSPhotoLibraryUsageDescription` - Acesso à galeria
- `NSPhotoLibraryAddUsageDescription` - Salvar fotos

#### Keyboard Accessory Bar (Resolvido)
A barra accessória acima do teclado no iOS foi desabilitada através de:
- Configuração `Keyboard.resize = 'native'` no `capacitor.config.ts`
- Plugin `@capacitor/keyboard` instalado

### 4. Build iOS

#### Para Teste (Simulador)
1. Selecione um simulador no Xcode
2. Command + R para executar

#### Para TestFlight
1. No Xcode: Product > Archive
2. Window > Organizer
3. Selecione o arquivo
4. "Distribute App" > "App Store Connect"
5. Siga o assistente para upload

### 5. App Store Connect

1. Acesse [App Store Connect](https://appstoreconnect.apple.com)
2. Crie um novo app:
   - **Nome:** Entenda o Documento
   - **Bundle ID:** br.raferbati.entendaodocumento
   - **SKU:** entenda-o-documento-001
   - **Idioma principal:** Português (Brasil)

3. Preencha metadados:
   - **Categoria:** Produtividade ou Educação
   - **Descrição:** [Ver seção de Marketing]
   - **Screenshots:** 6.7", 6.5", 5.5" (iPhone) e 12.9" (iPad)
   - **Ícones:** Já incluídos no projeto

4. Configuração de Privacidade (ver seção abaixo)

5. TestFlight:
   - Adicione testadores beta
   - Teste funcionalidades críticas
   - Colete feedback

6. Submeter para revisão

## Configuração Android

### 1. Preparar Projeto Android

```bash
# Sincronizar projeto Android
npm run cap:sync
```

### 2. Abrir no Android Studio

```bash
npm run cap:open:android
```

### 3. Configurações Importantes

#### build.gradle (app)
Já configurado com:
- `applicationId`: br.raferbati.entendaodocumento
- `versionCode`: 1
- `versionName`: "1.0"
- `minSdkVersion`: 22 (Android 5.0+)
- `targetSdkVersion`: 34 (Android 14)

#### AndroidManifest.xml
Permissões já configuradas:
- `INTERNET` - Conexão com backend
- `CAMERA` - Captura de documentos
- `READ_MEDIA_IMAGES` - Acesso à galeria (Android 13+)
- `READ_EXTERNAL_STORAGE` - Acesso à galeria (Android 12-)

Configurações adicionais:
- `screenOrientation="portrait"` - Força modo retrato
- `windowSoftInputMode="adjustResize"` - Ajusta layout com teclado
- `usesCleartextTraffic="true"` - Permite HTTP em desenvolvimento

### 4. Gerar Keystore de Assinatura

```bash
# Criar keystore para produção (faça isso UMA VEZ e guarde com segurança)
keytool -genkey -v -keystore entenda-o-documento-release.keystore \
  -alias entenda-release \
  -keyalg RSA -keysize 2048 -validity 10000

# Guarde a senha em local seguro (ex: gerenciador de senhas)
```

### 5. Configurar Assinatura no Gradle

Crie `android/key.properties` (NÃO commitar):
```properties
storePassword=SUA_SENHA_KEYSTORE
keyPassword=SUA_SENHA_KEY
keyAlias=entenda-release
storeFile=../entenda-o-documento-release.keystore
```

Adicione ao `android/app/build.gradle` (antes de `android {`):
```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

E dentro de `android { ... }`:
```gradle
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
        storePassword keystoreProperties['storePassword']
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

### 6. Gerar APK/AAB para Produção

```bash
cd android
./gradlew assembleRelease  # Gera APK
# ou
./gradlew bundleRelease    # Gera AAB (recomendado para Play Store)

# Arquivos gerados em:
# app/build/outputs/apk/release/app-release.apk
# app/build/outputs/bundle/release/app-release.aab
```

### 7. Google Play Console

1. Acesse [Google Play Console](https://play.google.com/console)
2. Crie um novo aplicativo:
   - **Nome:** Entenda o Documento
   - **Idioma padrão:** Português (Brasil)
   - **Tipo:** Aplicativo

3. Preencha formulário de conteúdo do app:
   - **Categoria:** Produtividade
   - **Descrição:** [Ver seção de Marketing]
   - **Screenshots:** Mínimo 2, recomendado 8 (1080x1920)
   - **Ícone:** 512x512 (já incluído no projeto)

4. Configuração de Privacidade (ver seção abaixo)

5. Classificação de conteúdo:
   - Responda questionário
   - App será classificado apropriadamente

6. Teste interno/fechado (opcional mas recomendado):
   - Adicione testadores
   - Faça upload do AAB
   - Teste por alguns dias

7. Produção:
   - Fazer upload do AAB
   - Configurar países de distribuição
   - Submeter para revisão

## Requisitos de Privacidade e Compliance

### Dados Coletados

O aplicativo processa:
- ✅ **Fotos de documentos** - Processadas no servidor, não armazenadas permanentemente
- ✅ **Texto extraído de documentos** - Temporário, para análise
- ✅ **Dados sensíveis redatados** - CPF, RG, etc. são ocultados (***) na interface

### Não Coletamos

- ❌ Dados de localização
- ❌ Dados de identificação pessoal (nome, email, telefone)
- ❌ Dados financeiros
- ❌ Histórico de navegação
- ❌ Contatos

### Política de Privacidade

**Obrigatório:** Hospedar política de privacidade acessível publicamente.

Conteúdo mínimo:
1. Quais dados são coletados (fotos de documentos)
2. Como são usados (análise por IA)
3. Quanto tempo são mantidos (processamento temporário)
4. Com quem são compartilhados (provedores de IA: OpenAI/Gemini)
5. Direitos do usuário (exclusão, acesso)
6. Contato para questões de privacidade

### LGPD (Brasil)

- ✅ Implementar base legal adequada (legítimo interesse ou consentimento)
- ✅ Fornecer informações claras sobre processamento
- ✅ Permitir exclusão de dados
- ✅ Notificar sobre vazamentos (se ocorrerem)

### Declarações para Lojas

#### Apple Store
- **Data Collection:** Marcar "Diagnostic Data" apenas se usar telemetria
- **Data Usage:** "App Functionality"
- **Data Linked to User:** Nenhum (se não houver login)
- **Encryption Export Compliance:** Marcar "No" se não usar criptografia proprietária

#### Google Play
- **Data Safety Section:**
  - Tipos de dados: Fotos e vídeos
  - Propósito: Funcionalidade do app
  - Compartilhamento: Sim (com provedores de IA)
  - Criptografia em trânsito: Sim (HTTPS)
  - Opção de exclusão: Sim (dados não persistentes)

## Checklist de Submissão

### Antes de Submeter

#### Geral
- [ ] App testado em múltiplos dispositivos/versões de OS
- [ ] Política de privacidade publicada e linkada
- [ ] Termos de serviço (se aplicável)
- [ ] Página de suporte/contato criada
- [ ] Screenshots e ícones de alta qualidade preparados
- [ ] Vídeo de demonstração (opcional mas recomendado)

#### iOS (Apple Store)
- [ ] Certificado de desenvolvedor Apple ativo
- [ ] Bundle ID registrado no App Store Connect
- [ ] App assinado com certificado de produção
- [ ] TestFlight testado por pelo menos 5 testadores
- [ ] Info.plist com todas as permissões justificadas
- [ ] Screenshots para todos os tamanhos de tela requeridos
- [ ] Ícones 1024x1024 preparados
- [ ] Questões de privacidade respondidas
- [ ] Compliance de exportação respondido

#### Android (Google Play)
- [ ] Conta Google Play Console ativa
- [ ] App assinado com keystore de produção
- [ ] AAB gerado (não APK)
- [ ] Teste interno realizado
- [ ] Formulário de conteúdo completo
- [ ] Data Safety preenchido
- [ ] Classificação de conteúdo obtida
- [ ] Screenshots (mínimo 2, recomendado 8)
- [ ] Ícone 512x512 preparado

### Após Submissão

- [ ] Monitorar status de revisão (Apple: 1-3 dias, Google: horas a dias)
- [ ] Responder a quaisquer rejeições prontamente
- [ ] Testar versão publicada após aprovação
- [ ] Configurar alertas para crashes e problemas

## Configuração de Servidor de Produção

### Deploy do Backend Next.js

O app mobile precisa se conectar a um servidor Next.js em produção:

#### Opção 1: Vercel (Recomendado)
```bash
# Instalar CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Opção 2: Docker + Cloud Provider
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Atualizar URL do Servidor

Após deploy, atualize o Capacitor:

1. Defina a variável de ambiente:
```bash
export CAPACITOR_SERVER_URL=https://seu-app.vercel.app
```

2. Reconstrua os projetos nativos:
```bash
npm run cap:sync
```

3. Ou edite diretamente `capacitor.config.ts`:
```typescript
server: {
  url: 'https://seu-app.vercel.app',
  cleartext: false,
}
```

### Variáveis de Ambiente no Servidor

Configure no seu provedor de hosting:
```env
OPENAI_API_KEY=sk-...
LLM_PROVIDER=openai
API_TOKEN_SECRET=seu-segredo-forte
APP_ORIGIN=https://seu-app.vercel.app
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

## Atualizações Futuras

### Versionamento

Para cada nova versão:

1. Atualize `package.json`:
```json
{
  "version": "1.1.0"
}
```

2. **iOS:** Atualize no Xcode:
   - Version: 1.1.0
   - Build: auto-incremento

3. **Android:** Atualize `build.gradle`:
```gradle
versionCode 2        // Sempre incrementar
versionName "1.1.0"  // Semântico
```

4. Reconstrua e submeta novamente

### Over-the-Air Updates (Opcional)

Para atualizações de conteúdo web sem resubmissão:
- Considere Capacitor Live Updates
- Ou CodePush (Microsoft)

## Troubleshooting

### iOS: "Keychain Access" Problemas
```bash
# Limpar dados de keychain
security delete-identity -c "iPhone Developer"
# Reabrir Xcode e reconfigurar signing
```

### Android: Build Falha
```bash
# Limpar build
cd android
./gradlew clean
cd ..
npm run cap:sync
```

### App Não Conecta ao Servidor
1. Verifique CORS no Next.js
2. Confirme HTTPS (não HTTP) em produção
3. Teste URL do servidor no navegador móvel

### Keyboard Accessory Bar Ainda Aparece (iOS)
- Confirme que `@capacitor/keyboard` está instalado
- Verifique `capacitor.config.ts` tem `Keyboard.resize = 'native'`
- Reconstrua o projeto: `npm run cap:sync`

## Recursos Adicionais

### Documentação Oficial
- [Capacitor](https://capacitorjs.com/docs)
- [Apple Developer](https://developer.apple.com/documentation/)
- [Android Developers](https://developer.android.com/docs)

### Guias de Submissão
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy](https://play.google.com/about/developer-content-policy/)

### Ferramentas Úteis
- [App Icon Generator](https://appicon.co/)
- [Screenshot Frames](https://screenshots.pro/)
- [ASO Tools](https://www.apptweak.com/) - Otimização de busca em lojas

## Contato e Suporte

Para questões sobre este guia ou o processo de publicação:
- GitHub Issues: [raferbati-br/entenda-o-documento](https://github.com/raferbati-br/entenda-o-documento/issues)

---

**Última atualização:** 2026-02-02
