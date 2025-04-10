
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNVR } from '@/context/NVRContext';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, CheckCircle } from 'lucide-react';

const HDEvolution = () => {
  const navigate = useNavigate();
  const { nvrs, getUpgradeStatus, getSlotStats } = useNVR();
  
  const upgradeStatus = getUpgradeStatus();
  const slotStats = getSlotStats();
  
  // Calcular estatísticas de progresso geral
  const totalSlots = slotStats.totalSlots;
  const totalEmptySlots = slotStats.emptySlots;
  const upgradeNeeded = nvrs.reduce((count, nvr) => {
    const filledSlots = nvr.slots.filter(slot => slot.status !== "empty" && (!slot.hdSize || slot.hdSize < 12)).length;
    return count + filledSlots;
  }, 0);
  
  const totalProgress = Math.round((upgradeNeeded + slotStats.emptySlots) > 0 
    ? (upgradeNeeded / (upgradeNeeded + slotStats.emptySlots)) * 100 
    : 100);
  
  // Calcular custo total estimado
  const totalCost = upgradeStatus.reduce((sum, status) => sum + status.estimatedCost, 0);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Planejamento de Evolução dos HDs</h1>
        <button
          onClick={() => navigate('/')}
          className="text-blue-500 hover:text-blue-700 flex items-center"
        >
          Ver todos os NVRs ↗
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500 mb-1">Progresso Geral</p>
            <h3 className="text-3xl font-bold">{totalProgress}%</h3>
            <div className="mt-2 progress-bar">
              <div 
                className="progress-bar-fill bg-blue-500" 
                style={{ width: `${totalProgress}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500 mb-1">HDs para Upgrade</p>
            <h3 className="text-3xl font-bold text-amber-600">{upgradeNeeded}</h3>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500 mb-1">Slots Vazios</p>
            <h3 className="text-3xl font-bold text-red-600">{totalEmptySlots}</h3>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500 mb-1">Custo Estimado</p>
            <h3 className="text-3xl font-bold text-green-600">R$ {totalCost.toLocaleString('pt-BR')}</h3>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabela de status por NVR */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Status por NVR</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 text-left">NVR</th>
                  <th className="py-3 px-4 text-left">Progresso</th>
                  <th className="py-3 px-4 text-left">Status Atual</th>
                  <th className="py-3 px-4 text-left">Meta</th>
                  <th className="py-3 px-4 text-left">Custo Estimado</th>
                </tr>
              </thead>
              <tbody>
                {upgradeStatus.map((status) => {
                  const nvr = nvrs.find(n => n.id === status.nvrId);
                  return (
                    <tr key={status.nvrId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">{nvr?.name}</td>
                      <td className="py-4 px-4">
                        <div className="w-48">
                          <div>{status.progress}%</div>
                          <div className="progress-bar">
                            <div 
                              className="progress-bar-fill bg-blue-500" 
                              style={{ width: `${status.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {status.progress > 0 ? (
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                            {nvr?.slots.find(s => s.hdSize)?.hdSize}TB
                          </span>
                        ) : (
                          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium">
                            {status.emptySlots} slots vazios
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <ArrowRight className="h-4 w-4 text-gray-400 mx-2" />
                          <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                            {nvr?.slots.length}x 12TB
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-green-600">R$ {status.estimatedCost.toLocaleString('pt-BR')}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Informações e recomendações */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Informações Importantes</h2>
          
          <div className="mb-6">
            <h3 className="text-md font-medium mb-2">Meta de Capacidade</h3>
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-2" />
              <p>Todos os slots devem ter HDs com capacidade mínima de 12TB</p>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-md font-medium mb-2">Custos Estimados</h3>
            <ul className="space-y-2 list-disc pl-5">
              <li>Preço médio por HD de 12TB: R$ 1.500</li>
              <li>Os custos são aproximados e podem variar conforme o mercado</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="text-md font-medium mb-2">Recomendações</h3>
            <ul className="space-y-2 text-blue-700">
              <li className="flex items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 mr-2"></div>
                <span>Priorize a substituição dos HDs com menor capacidade</span>
              </li>
              <li className="flex items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 mr-2"></div>
                <span>Preencha slots vazios com HDs de 12TB ou superior</span>
              </li>
              <li className="flex items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 mr-2"></div>
                <span>Realize as atualizações em fases para distribuir os custos</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HDEvolution;
