import React, { useEffect, useState } from 'react';
import { 
  database
} from './firebase';
import { ref, set, get } from 'firebase/database';

const VerificarDatabase: React.FC = () => {
  const [status, setStatus] = useState<string>('Verificando...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verificar = async () => {
      try {
        // Verificar acesso ao Realtime Database tentando criar um documento de teste
        try {
          // Tentar criar nó de teste para verificar conectividade
          await set(ref(database, "system/test"), {
            timestamp: Date.now(),
            message: "Teste de conectividade"
          });
          setStatus('Realtime Database está acessível');
          
        } catch (dbError) {
          console.error('Erro ao acessar Realtime Database:', dbError);
          setStatus('Realtime Database NÃO está acessível');
          setError(`Erro ao tentar acessar Realtime Database: ${String(dbError)}`);
        }
      } catch (e: any) {
        console.error('Erro ao verificar Realtime Database:', e);
        setStatus('Erro ao verificar Realtime Database');
        setError(e.message);
      }
    };
    
    verificar();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Verificação do Realtime Database</h1>
      <div>
        <h2>Status: {status}</h2>
        {error && <p style={{ color: 'red' }}>Erro: {error}</p>}
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <p>
          <a href="#/" style={{ 
            display: 'inline-block', 
            padding: '10px 20px', 
            background: '#4F46E5', 
            color: 'white', 
            borderRadius: '5px', 
            textDecoration: 'none' 
          }}>
            Ir para página inicial
          </a>
        </p>
      </div>
    </div>
  );
};

export default VerificarDatabase; 