# Instruções de Uso - Sistema de Autenticação Firebase

## O que mudou?
O sistema foi completamente refatorado para usar **exclusivamente o Firebase** para autenticação. Isso significa:

- Não há mais modo "fallback" ou offline
- Todos os usuários são agora armazenados no Firebase Authentication e Firestore
- É necessário ter conexão com a internet para acessar o sistema

## Como fazer login pela primeira vez?

### 1. Inicializar os usuários padrão
Na tela de login, clique no botão "Inicializar Usuários Padrão" para criar as contas de admin e Juan no Firebase.

### 2. Login com usuários predefinidos
Após inicializar os usuários, você pode fazer login com:

- **Admin:**
  - Username: admin
  - Senha: M8n8s53489,

- **Juan:**
  - Username: Juan
  - Senha: j@9738gt

## Gerenciamento de Usuários

### Como criar novos usuários?
1. Faça login como administrador
2. Vá para a página de Configurações
3. Na seção "Usuários do Sistema", clique em "Novo Usuário"
4. Preencha os dados e clique em "Criar Usuário"

### Como editar usuários existentes?
1. Faça login no sistema
2. Vá para a página de Configurações
3. Na lista de usuários, clique em "Editar" ao lado do usuário desejado
   - Administradores podem editar qualquer usuário
   - Usuários comuns só podem editar seu próprio perfil

## Solução de Problemas

### Erro: "Usuário não encontrado"
- Certifique-se de que os usuários padrão foram inicializados
- Verifique se está usando as credenciais corretas
- Confirme que sua conexão com a internet está funcionando

### Erro: "Email já em uso" ou "Nome de usuário já existe"
- Tente usar outro nome de usuário ou email
- Contacte um administrador para verificar se o usuário já existe no sistema

### Erro de conexão com o Firebase
- Verifique sua conexão com a internet
- Tente acessar o sistema mais tarde
- Entre em contato com o suporte técnico se o problema persistir

## Perguntas Frequentes

**P: Posso acessar o sistema offline?**
R: Não, o sistema agora requer uma conexão com a internet para autenticação.

**P: O que aconteceu com meus dados de usuário anteriores?**
R: Se você já usava o sistema antes, precisará clicar em "Inicializar Usuários Padrão" para criar as contas no Firebase. Quaisquer usuários personalizados precisarão ser recriados.

**P: Como recuperar senha esquecida?**
R: Atualmente é necessário que um administrador redefina sua senha. Em breve implementaremos a recuperação de senha por email.

## Contato
Para ajuda adicional, entre em contato com a equipe de suporte técnico. 