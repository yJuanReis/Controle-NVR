import React, { useEffect, useState } from 'react';
import { 
  db, 
  getAllUsers, 
  initializeDefaultUsers, 
  checkFirestoreAccess 
} from './firebase';
import { collection, getDocs } from 'firebase/firestore';

const VerificarFirestore: React.FC = () => {
  const [status, setStatus] = useState<string>('Verificando...');
  const [error, setError] = useState<string | null>(null);
  const [usuarios, setUsuarios] = useState<any[]>([]);

  useEffect(() => {
    const verificar = async () => {
      try {
        // Verificar acesso ao Firestore
        const acessivel = await checkFirestoreAccess();
        setStatus(acessivel ? 'Firestore está acessível' : 'Firestore NÃO está acessível');
        
        if (acessivel) {
          // Inicializar usuários padrão
          const initResult = await initializeDefaultUsers();
          if (initResult.success) {
            console.log('Usuários padrão inicializados com sucesso');
          } else {
            console.error('Erro ao inicializar usuários padrão:', initResult.error);
            setError(`Erro ao inicializar: ${initResult.error}`);
          }
          
          // Tentar listar usuários
          const users = await getAllUsers();
          setUsuarios(users);
          console.log('Usuários encontrados:', users);
          
          // Tentar listar usuários diretamente
          try {
            const usersRef = collection(db, "users");
            const querySnapshot = await getDocs(usersRef);
            const listaUsuarios: any[] = [];
            querySnapshot.forEach((doc) => {
              listaUsuarios.push({ id: doc.id, ...doc.data() });
            });
            console.log('Usuários encontrados diretamente:', listaUsuarios);
          } catch (collectionError) {
            console.error('Erro ao acessar collection diretamente:', collectionError);
            setError(`Erro na collection: ${collectionError}`);
          }
        }
      } catch (e: any) {
        console.error('Erro ao verificar Firestore:', e);
        setStatus('Erro ao verificar Firestore');
        setError(e.message);
      }
    };
    
    verificar();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Verificação do Firestore</h1>
      <div>
        <h2>Status: {status}</h2>
        {error && <p style={{ color: 'red' }}>Erro: {error}</p>}
      </div>
      
      <div>
        <h2>Usuários no Firestore ({usuarios.length}):</h2>
        {usuarios.length > 0 ? (
          <ul>
            {usuarios.map((user, index) => (
              <li key={index}>
                <strong>{user.username}</strong> ({user.isAdmin ? 'Admin' : 'Usuário'}) - 
                Criado em: {new Date(user.createdAt).toLocaleString()}
              </li>
            ))}
          </ul>
        ) : (
          <p>Nenhum usuário encontrado no Firestore</p>
        )}
      </div>
    </div>
  );
};

export default VerificarFirestore; 