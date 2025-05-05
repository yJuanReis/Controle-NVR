# Autenticação e Segurança com Firebase

Este documento explica como o fluxo de autenticação e segurança foi implementado no projeto Controle-NVR.

## Fluxo de Autenticação e Armazenamento de Dados

O sistema implementa o seguinte fluxo para autenticação e armazenamento de dados de usuários:

1. **Autenticação com Firebase Authentication**:
   - Quando um usuário se registra ou faz login, usamos o Firebase Authentication.
   - O Firebase Authentication gera um UID único para cada usuário.

2. **Armazenamento de Dados no Realtime Database**:
   - Após a autenticação, usamos o UID como chave para armazenar os dados adicionais do usuário no Realtime Database.
   - Os dados são salvos no caminho `/users/{uid}`.

3. **Proteção com Regras de Segurança**:
   - Regras de segurança do Firebase protegem os dados para que somente usuários autorizados possam acessá-los.

## Implementação Técnica

### Registro de Usuário

```typescript
// 1. Criar usuário no Firebase Authentication
const userCredential = await createUserWithEmailAndPassword(auth, email, password);
const user = userCredential.user;

// 2. Usar o UID gerado para armazenar dados adicionais
const userData = {
  username: username,
  isAdmin: isAdmin,
  displayName: displayName || username,
  email: email,
  createdAt: Date.now(),
  lastLogin: Date.now(),
  uid: user.uid
};

// 3. Salvar no Realtime Database usando o UID como chave
await set(ref(database, `users/${user.uid}`), userData);
```

### Login de Usuário

```typescript
// 1. Autenticar com Firebase Authentication
const userCredential = await signInWithEmailAndPassword(auth, email, password);
const user = userCredential.user;

// 2. Buscar dados adicionais do usuário
const userRef = ref(database, `users/${user.uid}`);
const snapshot = await get(userRef);

// 3. Se existirem dados, atualizar último login
if (snapshot.exists()) {
  await update(userRef, { lastLogin: Date.now() });
}
```

### Observador de Estado de Autenticação

```typescript
// Configurar um observador para mudanças no estado de autenticação
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Usuário logado - buscar dados adicionais
    const userData = await getUserByUid(user.uid);
    // Atualizar interface, estado da aplicação, etc.
  } else {
    // Nenhum usuário logado
    // Redirecionar para página de login, limpar estado, etc.
  }
});
```

## Regras de Segurança do Firebase

Para proteger seus dados, foi implementada a seguinte configuração de regras de segurança no Firebase Realtime Database:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && (auth.uid == $uid || root.child('users').child(auth.uid).child('isAdmin').val() == true)",
        ".write": "auth != null && (auth.uid == $uid || root.child('users').child(auth.uid).child('isAdmin').val() == true)"
      },
      ".read": "auth != null && root.child('users').child(auth.uid).child('isAdmin').val() == true"
    },
    
    "config": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('users').child(auth.uid).child('isAdmin').val() == true"
    },
    
    "nvrs": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('users').child(auth.uid).child('isAdmin').val() == true"
    },
    
    "contractedCamerasPerMarina": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('users').child(auth.uid).child('isAdmin').val() == true"
    },
    
    "system": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

Estas regras garantem que:

1. Um usuário só pode ler/escrever seus próprios dados (`users/$uid`), a menos que seja administrador.
2. Somente administradores podem ler a lista completa de usuários e gerenciar configurações.
3. Todos os usuários autenticados podem ler dados de NVRs e câmeras, mas apenas administradores podem modificá-los.
4. Ninguém pode acessar dados sem estar autenticado.

## Como Aplicar as Regras de Segurança

1. Acesse o [Console do Firebase](https://console.firebase.google.com/)
2. Selecione seu projeto
3. No menu lateral, clique em "Realtime Database"
4. Clique na aba "Regras"
5. Cole as regras do arquivo `firebase-rules.json`
6. Clique em "Publicar"

## Diagrama do Fluxo de Autenticação

```
┌────────────────┐       ┌─────────────────────┐       ┌───────────────────┐
│                │       │                     │       │                   │
│    Usuário     │──────▶│  Firebase Auth      │──────▶│  Realtime Database │
│                │       │                     │       │                   │
└────────────────┘       └─────────────────────┘       └───────────────────┘
        │                         │                             │
        │                         │                             │
        │                         │                             │
        ▼                         ▼                             ▼
┌────────────────┐       ┌─────────────────────┐       ┌───────────────────┐
│  1. Login/     │       │  2. Autentica e     │       │  3. Salva/busca   │
│     Registro   │       │     gera UID        │       │     dados com UID │
└────────────────┘       └─────────────────────┘       └───────────────────┘
```

## Melhores Práticas Implementadas

1. **Persistência de autenticação**: Configurada para `browserLocalPersistence` para manter o usuário logado mesmo após fechar o navegador.

2. **Separação de dados**: Os dados de autenticação (email, senha) são gerenciados pelo Firebase Authentication, enquanto os dados adicionais de perfil são armazenados no Realtime Database.

3. **Validação e verificação**: Verificação de dados tanto no cliente quanto no servidor (através das regras de segurança).

4. **Backup local removido**: Todo o armazenamento local foi removido para garantir que os dados sejam sempre consistentes com o Firebase.

5. **Logs detalhados**: Adicionamos logs detalhados para facilitar depuração e monitoramento do fluxo de autenticação. 