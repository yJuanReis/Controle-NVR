
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNVR } from '@/context/NVRContext';
import { Card, CardContent } from '@/components/ui/card';
import BarChart from '@/components/charts/BarChart';
import PieChart from '@/components/charts/PieChart';

const Reports = () => {
  const navigate = useNavigate();
  const { nvrs, getTotalStats, getSlotStats, getHDSizeDistribution } = useNVR();
  const [selectedNVR, setSelectedNVR] = useState<string | null>(null);

  const stats = getTotalStats();
  const slotStats = getSlotStats();
  
  const camerasByNVR = nvrs.map(nvr => ({
    name: nvr.name,
    value: nvr.cameras
  }));
  
  // Calcula o armazenamento total por NVR
  const storageByNVR = nvrs.map(nvr => {
    const totalStorage = nvr.slots.reduce((sum, slot) => {
      return sum + (slot.hdSize && slot.status === 'active' ? slot.hdSize : 0);
    }, 0);
    
    return {
      name: nvr.name,
      value: totalStorage
    };
  });
  
  // Distribuição de status dos HDs
  const hdStatusData = [
    { name: 'Ativo', value: slotStats.activeSlots, color: '#4CAF50' },
    { name: 'Inativo', value: slotStats.inactiveSlots, color: '#FFB74D' },
    { name: 'Vazio', value: slotStats.emptySlots, color: '#E0E0E0' },
  ].filter(item => item.value > 0);

  const handleNVRClick = (nvrName: string) => {
    const nvr = nvrs.find(n => n.name === nvrName);
    if (nvr) {
      navigate('/');
      setSelectedNVR(nvr.id);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Relatórios e Análises</h1>
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
            <p className="text-sm text-gray-500 mb-1">Total de Câmeras</p>
            <h3 className="text-3xl font-bold">{stats.totalCameras}</h3>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500 mb-1">Armazenamento Total</p>
            <h3 className="text-3xl font-bold">{stats.totalStorage} TB</h3>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500 mb-1">Total de HDs</p>
            <h3 className="text-3xl font-bold">{stats.totalHDs}</h3>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500 mb-1">Média de TB por NVR</p>
            <h3 className="text-3xl font-bold">{stats.averageTBPerNVR.toFixed(1)} TB</h3>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <BarChart 
              data={camerasByNVR} 
              title="Câmeras por NVR" 
              onClick={handleNVRClick} 
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <BarChart 
              data={storageByNVR} 
              title="Armazenamento por NVR (TB)" 
              onClick={handleNVRClick} 
              color="#7E57C2"
            />
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <PieChart 
              data={hdStatusData} 
              title="Status dos HDs" 
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
