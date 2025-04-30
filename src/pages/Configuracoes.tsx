import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { database } from '../firebase';
import { ref, set, onValue, get } from 'firebase/database';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, Database as DatabaseIcon, Users, Server, AlertCircle, FileText, Eye, EyeOff, ShieldAlert, LogOut } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useAuth } from '@/context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Checkbox } from "@/components/ui/checkbox";

// Interface para usuários ativos
interface Usuario {
  id: string;
  nome: string;
  email: string;
  ultimoAcesso: string;
  perfil: string;
  username?: string; // Campo adicional para login
  precisaAlterarSenha?: boolean; // Flag para primeiro acesso
}

// Interface para informações do banco de dados
interface DatabaseInfo {
  conexoes: number;
  tamanho: string;
  ultimoBackup: string;
  status: 'online' | 'offline' | 'alerta';
  versao: string;
}

const Configuracoes = () => {
  const { isAdmin, logout, currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Log para verificar o currentUser do contexto
  console.log("CurrentUser no Configuracoes:", currentUser);
  console.log("isAdmin no Configuracoes:", isAdmin);
  
  const [title, setTitle] = useState('Controle - NVRs');
  const [appName, setAppName] = useState('BR Marinas');
  const [isSaving, setIsSaving] = useState(false);
  
  // Estados para a aba de Sistema
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo>({
    conexoes: 0,
    tamanho: '0 MB',
    ultimoBackup: 'Nunca',
    status: 'offline',
    versao: 'Desconhecida'
  });
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  
  // Estados para edição de usuário
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  
  // Estados para criação de usuário
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [newUserRole, setNewUserRole] = useState('admin');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [newUserForcePasswordChange, setNewUserForcePasswordChange] = useState(true);
  
  // Função para carregar usuários ativos
  const carregarUsuarios = async () => {
    setIsLoadingUsers(true);
    try {
      // Simulação de dados de usuários
      setTimeout(() => {
        setUsuarios([
          {
            id: '1',
            nome: 'Administrador',
            username: 'admin',
            email: 'admin@controle-nvr.local',
            ultimoAcesso: new Date().toLocaleString('pt-BR'),
            perfil: 'Administrador',
            precisaAlterarSenha: false 
          },
          {
            id: '2',
            nome: 'Juan Silva',
            username: 'Juan',
            email: 'juan@controle-nvr.local',
            ultimoAcesso: new Date(Date.now() - 30 * 60000).toLocaleString('pt-BR'),
            perfil: 'Usuário',
            precisaAlterarSenha: false
          }
        ]);
        setIsLoadingUsers(false);
      }, 1500);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      toast({
        title: "Erro ao carregar usuários",
        description: "Houve um problema ao obter a lista de usuários ativos.",
        variant: "destructive"
      });
      setIsLoadingUsers(false);
    }
  };

  // Função para fazer logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // Carregar configurações atuais
  useEffect(() => {
    try {
      // Primeiro tentar carregar do localStorage para rápida inicialização
      const localTitle = window.localStorage.getItem('app_title');
      const localAppName = window.localStorage.getItem('app_name');
      
      if (localTitle) setTitle(localTitle);
      if (localAppName) setAppName(localAppName);
      
      // Configuração padrão se não houver dados
      const defaultConfig = {
        title: 'Controle - NVRs',
        appName: 'BR Marinas'
      };
      
      // Então buscar a configuração mais atualizada do Firebase
      const configRef = ref(database, 'config/app');
      const unsubscribe = onValue(configRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (data.title) {
            setTitle(data.title);
            window.localStorage.setItem('app_title', data.title);
          }
          if (data.appName) {
            setAppName(data.appName);
            window.localStorage.setItem('app_name', data.appName);
          }
        } else {
          // Se não existirem configs, criar configurações padrão
          saveConfig(defaultConfig.title, defaultConfig.appName);
        }
      });

      // Cleanup
      return () => unsubscribe();
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
      toast({
        title: "Erro ao carregar configurações",
        description: "Houve um problema ao carregar as configurações do sistema.",
        variant: "destructive"
      });
    }
  }, []);
  
  // Carregar informações do banco de dados
  useEffect(() => {
    carregarInfoDB();
  }, []);
  
  // Carregar usuários ativos
  useEffect(() => {
    carregarUsuarios();
  }, []);

  // Função para salvar configurações
  const saveConfig = async (title: string, appName: string) => {
    try {
      setIsSaving(true);
      
      // Salvar as configurações no banco de dados
      await set(ref(database, 'config/app'), {
        title,
        appName,
        lastUpdated: new Date().toISOString()
      });

      // Atualizar o título da página
      document.title = title;

      toast({
        title: "Configurações salvas",
        description: "As configurações foram atualizadas com sucesso.",
      });
      
      // Atualizar as variáveis de aplicação para uso global
      window.localStorage.setItem('app_title', title);
      window.localStorage.setItem('app_name', appName);
      
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro ao salvar configurações",
        description: "Não foi possível salvar as configurações. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Função para carregar informações do banco de dados
  const carregarInfoDB = async () => {
    setIsLoadingData(true);
    try {
      // Aqui você normalmente faria uma chamada para obter dados reais
      // Para este exemplo, simulamos dados após um breve atraso
      setTimeout(() => {
        setDatabaseInfo({
          conexoes: 8,
          tamanho: '256 MB',
          ultimoBackup: new Date().toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          status: 'online',
          versao: 'Firebase Realtime 10.2.1'
        });
        setIsLoadingData(false);
      }, 1000);
    } catch (error) {
      console.error("Erro ao carregar informações do banco:", error);
      toast({
        title: "Erro ao carregar informações",
        description: "Houve um problema ao obter informações do banco de dados.",
        variant: "destructive"
      });
      setIsLoadingData(false);
    }
  };

  // Função para aplicar as configurações
  const handleApplyConfig = () => {
    saveConfig(title, appName);
  };

  // Função para voltar ao padrão
  const handleResetToDefault = () => {
    setTitle('Controle - NVRs');
    setAppName('BR Marinas');
  };

  // Função para salvar as alterações do usuário
  const handleSaveUserEdit = () => {
    if (!editingUser) return;

    // Verificar se este é o próprio usuário conectado
    const isCurrentUser = currentUser?.username === editingUser.username;
    
    // Revalidar permissão: Apenas admin ou o próprio usuário podem salvar
    if (!isCurrentUser && !isAdmin) {
      toast({
        title: "Acesso Negado",
        description: "Você não tem permissão para salvar alterações neste perfil.",
        variant: "destructive"
      });
      return;
    }

    // Validar se a senha foi alterada no primeiro acesso
    if (editingUser.precisaAlterarSenha && !newPassword) {
      toast({
        title: "Senha Obrigatória",
        description: "Você precisa definir uma nova senha no primeiro acesso.",
        variant: "destructive"
      });
      return;
    }

    try {
      const updatedUser = { ...editingUser };

      // Se não for admin, restringir quais campos podem ser alterados
      if (!isAdmin && isCurrentUser) {
        // Usuário comum só pode alterar sua própria senha e nome
        // Os outros campos como perfil, username, etc. não podem ser alterados
        console.log("Usuário alterando a própria senha:", newPassword ? "Senha alterada" : "Sem alteração de senha");
      }

      if (newPassword) {
        // Em uma aplicação real, você faria hash da senha aqui antes de salvar
        console.log(`Senha atualizada (simulação) para o usuário ${updatedUser.username}`);
        // A senha real não deve ser armazenada no estado `usuarios` diretamente
        // Aqui, apenas marcamos que a senha foi alterada, limpando a flag se necessário
        if (updatedUser.precisaAlterarSenha) {
          updatedUser.precisaAlterarSenha = false;
        }
      }

      // Atualizar o usuário na lista do estado
      const updatedUsers = usuarios.map(user =>
        user.id === updatedUser.id ? updatedUser : user
      );
      setUsuarios(updatedUsers);

      toast({
        title: "Usuário atualizado",
        description: "As informações do usuário foram atualizadas com sucesso.",
      });

      // Fechar o modal e limpar estados
      setEditingUser(null);
      setNewPassword('');
      setIsEditModalOpen(false);

    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      toast({
        title: "Erro ao atualizar usuário",
        description: "Não foi possível atualizar as informações. Tente novamente.",
        variant: "destructive"
      });
      // Não fechar o modal em caso de erro para permitir nova tentativa
    }
  };

  // Função para deletar usuário
  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId);
    setIsConfirmDeleteOpen(true);
  };

  // Confirmar a deleção do usuário
  const confirmDeleteUser = () => {
    if (!userToDelete) return;

    try {
      // Obter informações do usuário antes de removê-lo
      const userToRemove = usuarios.find(u => u.id === userToDelete);
      
      // Filtrar o usuário a ser removido
      const updatedUsers = usuarios.filter(user => user.id !== userToDelete);
      setUsuarios(updatedUsers);
      
      toast({
        title: "Usuário removido",
        description: "O usuário foi removido com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao remover usuário:", error);
      toast({
        title: "Erro ao remover usuário",
        description: "Não foi possível remover o usuário. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setUserToDelete(null);
      setIsConfirmDeleteOpen(false);
    }
  };

  // Função para criar novo usuário
  const handleCreateUser = async () => {
    if (!isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores podem criar novos usuários.",
        variant: "destructive"
      });
      return;
    }

    if (!newUserUsername || !newUserPassword || !newUserFullName) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome completo, nome de usuário e senha são obrigatórios.",
        variant: "destructive"
      });
      return;
    }
    
    setIsCreatingUser(true);
    try {
      // Simulação de criação de usuário
      setTimeout(() => {
        const novoUsuario: Usuario = {
          id: (usuarios.length + 1).toString(),
          nome: newUserFullName,
          username: newUserUsername.toLowerCase(),
          email: `${newUserUsername.toLowerCase()}@controle-nvr.local`,
          ultimoAcesso: 'Nunca',
          perfil: newUserRole === 'admin' ? 'Administrador' : 'Usuário',
          precisaAlterarSenha: newUserForcePasswordChange
        };
        
        setUsuarios([...usuarios, novoUsuario]);
        
        toast({
          title: "Usuário criado com sucesso",
          description: newUserForcePasswordChange 
            ? "O novo usuário precisará alterar a senha no primeiro acesso."
            : "O novo usuário foi criado.",
        });
        
        setNewUserFullName('');
        setNewUserUsername('');
        setNewUserPassword('');
        setNewUserRole('admin');
        setNewUserForcePasswordChange(true);
        setIsCreatingUser(false);
        setIsCreateUserModalOpen(false);

      }, 1000);
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      toast({
        title: "Erro ao criar usuário",
        description: "Não foi possível criar o novo usuário. Tente novamente mais tarde.",
        variant: "destructive"
      });
      setIsCreatingUser(false);
    }
  };

  // Função para abrir o modal de edição
  const handleEditUser = (user: Usuario) => {
    // Verificação de permissão baseada em username (mais confiável que ID)
    const isCurrentUser = currentUser?.username === user.username;
    const canEdit = isAdmin || isCurrentUser;
    
    console.log("Debug permissão:", { 
      usuarioAtual: currentUser?.username,
      usuarioEditando: user.username,
      isCurrentUser,
      isAdmin,
      canEdit
    });
    
    if (!canEdit) {
      toast({
        title: "Acesso Negado",
        description: "Você só pode editar seu próprio perfil.",
        variant: "destructive"
      });
      return;
    }
    
    setEditingUser({ ...user });
    setNewPassword('');
    setShowEditPassword(false);
    setIsEditModalOpen(true);

    // Avisar sobre a necessidade de trocar senha no primeiro acesso
    if (user.precisaAlterarSenha) {
      toast({
        title: "Primeiro Acesso - Alterar Senha",
        description: "Por favor, defina uma nova senha para sua conta.",
        variant: "default",
        duration: 9000,
      });
    }
  };

  return (
    <div className="p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-center">Configurações do Sistema</h1>
        <Button 
          variant="outline" 
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sair do Sistema
        </Button>
      </div>
      
      <Tabs defaultValue="sistema">
        <TabsList className="mb-4">
          <TabsTrigger value="sistema">Sistema</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sistema">
          {!isAdmin && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md flex items-center text-amber-600 dark:text-amber-500">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="text-sm">Você está visualizando as informações do sistema em modo somente leitura. Algumas ações requerem privilégios de administrador.</span>
            </div>
          )}

          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="text-center">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Server className="h-5 w-5 text-primary" />
                      <CardTitle>Status do Sistema</CardTitle>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={carregarInfoDB}
                      disabled={isLoadingData}
                    >
                      {isLoadingData ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <CardDescription className="text-center">
                    Informações sobre o desempenho do sistema e banco de dados.
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {isLoadingData ? (
                    <div className="flex justify-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-sm text-muted-foreground text-center w-full block">Status do Banco</Label>
                          <div className="flex justify-center">
                            {databaseInfo.status === 'online' ? (
                              <Badge className="bg-green-500 hover:bg-green-600">Online</Badge>
                            ) : databaseInfo.status === 'offline' ? (
                              <Badge variant="outline" className="text-gray-500 border-gray-300">Offline</Badge>
                            ) : (
                              <Badge className="bg-amber-500 hover:bg-amber-600">Alerta</Badge>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm text-muted-foreground text-center w-full block">Conexões Ativas</Label>
                          <div className="font-medium text-center">{databaseInfo.conexoes}</div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm text-muted-foreground text-center w-full block">Tamanho do Banco</Label>
                          <div className="font-medium text-center">{databaseInfo.tamanho}</div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm text-muted-foreground text-center w-full block">Último Backup</Label>
                          <div className="font-medium text-center">{databaseInfo.ultimoBackup}</div>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t">
                        <div className="mb-3 text-sm font-medium text-center">Recursos do Sistema</div>
                        <div className="space-y-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <Label className="text-sm">Uso de CPU</Label>
                              <span className="text-sm font-medium">28%</span>
                            </div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                              <div className="h-2 bg-green-500 rounded-full" style={{ width: '28%' }}></div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <Label className="text-sm">Uso de Memória</Label>
                              <span className="text-sm font-medium">62%</span>
                            </div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                              <div className="h-2 bg-amber-500 rounded-full" style={{ width: '62%' }}></div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <Label className="text-sm">Armazenamento</Label>
                              <span className="text-sm font-medium">45%</span>
                            </div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                              <div className="h-2 bg-blue-500 rounded-full" style={{ width: '45%' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-sm text-muted-foreground text-center w-full block">Tempo Ativo</Label>
                          <div className="font-medium text-center">15 dias, 7 horas</div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm text-muted-foreground text-center w-full block">Versão do Banco</Label>
                          <div className="font-medium text-center">{databaseInfo.versao}</div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <CardTitle>Usuários do Sistema</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={() => setIsCreateUserModalOpen(true)}
                          disabled={isCreatingUser}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                          Novo Usuário
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={carregarUsuarios}
                        disabled={isLoadingUsers}
                      >
                        {isLoadingUsers ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="text-center">
                    Lista de usuários cadastrados no sistema.
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {isLoadingUsers ? (
                    <div className="flex justify-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow className="text-center">
                            <TableHead className="text-center">Nome</TableHead>
                            <TableHead className="text-center">Usuário</TableHead>
                            <TableHead className="text-center">Perfil</TableHead>
                            <TableHead className="text-center">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {usuarios.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground">
                                Nenhum usuário cadastrado no momento.
                              </TableCell>
                            </TableRow>
                          ) : (
                            usuarios.map((usuario) => {
                              // Log para verificar a comparação de IDs
                              console.log(`Comparando: currentUser?.id=${currentUser?.id}, usuario.id=${usuario.id}, currentUser?.username=${currentUser?.username}, usuario.username=${usuario.username}`);
                              
                              // Verificar se este é o usuário atual (conectado)
                              const isCurrentUser = currentUser?.username === usuario.username;
                              
                              return (
                                <TableRow key={usuario.id} className={isCurrentUser ? "bg-primary/10" : ""}>
                                  <TableCell className="text-center">{usuario.nome}</TableCell>
                                  <TableCell className="text-center font-medium">
                                    {usuario.username || '(não definido)'}
                                    {isCurrentUser && <span className="ml-2 text-xs bg-primary/20 px-2 py-1 rounded">Você</span>}
                                  </TableCell>
                                  <TableCell className="text-center">{usuario.perfil}</TableCell>
                                  <TableCell className="text-center">
                                    <div className="flex flex-wrap justify-center gap-2">
                                      {/* Mostrar botão para admin OU para o próprio usuário */}
                                      {(isAdmin || isCurrentUser) && (
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => handleEditUser(usuario)}
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                          Editar
                                        </Button>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {isAdmin && (
              <Card className="text-center">
                <CardHeader>
                  <CardTitle>Personalização da Interface</CardTitle>
                  <CardDescription className="text-center">
                    Configure a aparência do sistema, como logo e títulos.
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-base font-medium text-center w-full block">Título da Página</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: Controle - NVRs"
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      Este texto aparecerá na aba do navegador.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="appName" className="text-base font-medium text-center w-full block">Nome da Aplicação</Label>
                    <Input
                      id="appName"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      placeholder="Ex: BR Marinas"
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      Este nome aparecerá ao lado da logo na barra lateral.
                    </p>
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-center">
                  <Button 
                    variant="outline" 
                    onClick={handleResetToDefault}
                    disabled={isSaving}
                    className="mx-2"
                  >
                    Restaurar Padrões
                  </Button>
                  <Button 
                    onClick={handleApplyConfig}
                    disabled={isSaving}
                    className="mx-2"
                  >
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </CardFooter>
              </Card>
            )}
            
          </div>
        </TabsContent>
      </Tabs>
      
      {editingUser && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader className="text-center">
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>
                Edite as informações do usuário. Clique em salvar quando terminar.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right col-span-1">
                  Nome
                </Label>
                <Input
                  id="edit-name"
                  value={editingUser.nome}
                  onChange={(e) => setEditingUser({...editingUser, nome: e.target.value})}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-username" className="text-right col-span-1">
                  Usuário
                </Label>
                <Input
                  id="edit-username"
                  value={editingUser.username || editingUser.nome}
                  onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-password" className="text-right col-span-1">
                  Senha
                </Label>
                <div className="col-span-3 relative">
                  <Input
                    id="edit-password"
                    type={showEditPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nova senha"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                  >
                    {showEditPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-perfil" className="text-right col-span-1">
                  Perfil
                </Label>
                <Select 
                  value={editingUser.perfil === 'Administrador' ? 'admin' : 'user'} 
                  onValueChange={(value) => 
                    setEditingUser({
                      ...editingUser, 
                      perfil: value === 'admin' ? 'Administrador' : 'Usuário'
                    })
                  }
                >
                  <SelectTrigger className="col-span-3" id="edit-perfil">
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="user">Usuário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex justify-center gap-4 mt-4">
              {isAdmin && (
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    if (editingUser) {
                      handleDeleteUser(editingUser.id);
                    }
                    setIsEditModalOpen(false); 
                  }}
                  title={currentUser?.id === editingUser?.id ? "Não é possível excluir o próprio usuário" : "Excluir usuário"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  Excluir
                </Button>
              )}
              <div className="flex gap-2">
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleSaveUserEdit}>Salvar</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-center">
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o usuário
              do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center">
            <AlertDialogCancel className="mx-2">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 mx-2"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isCreateUserModalOpen} onOpenChange={setIsCreateUserModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader className="text-center">
            <DialogTitle>Criar Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha as informações para criar um novo usuário no sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-fullname" className="text-right col-span-1">
                Nome
              </Label>
              <Input
                id="new-fullname"
                placeholder="Nome Completo do Usuário"
                value={newUserFullName}
                onChange={(e) => setNewUserFullName(e.target.value)}
                className="col-span-3"
              />
            </div>
          
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-username" className="text-right col-span-1">
                Usuário
              </Label>
              <Input
                id="new-username"
                placeholder="usuario.login"
                value={newUserUsername}
                onChange={(e) => setNewUserUsername(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-password" className="text-right col-span-1">
                Senha
              </Label>
              <div className="col-span-3 relative">
                <Input
                  id="new-password"
                  type={showNewUserPassword ? "text" : "password"}
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="********"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                >
                  {showNewUserPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-user-role" className="text-right col-span-1">
                Perfil
              </Label>
              <Select 
                value={newUserRole} 
                onValueChange={setNewUserRole}
                name="new-user-role"
              >
                <SelectTrigger className="col-span-3" id="new-user-role">
                  <SelectValue placeholder="Selecione o perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="user">Usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="force-password-change" className="text-right col-span-1"></Label> 
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox 
                  id="force-password-change"
                  checked={newUserForcePasswordChange}
                  onCheckedChange={(checked) => setNewUserForcePasswordChange(Boolean(checked))}
                />
                <Label htmlFor="force-password-change" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Exigir troca de senha no primeiro acesso
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-center">
            <Button 
              variant="outline" 
              onClick={() => setIsCreateUserModalOpen(false)}
              disabled={isCreatingUser}
              className="mx-2"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateUser}
              disabled={isCreatingUser}
              className="mx-2"
            >
              {isCreatingUser ? "Criando..." : "Criar Usuário"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Configuracoes; 