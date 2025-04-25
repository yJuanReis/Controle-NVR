import React from 'react';
import NVRStorageChart from '@/components/charts/NVRStorageChart';
import HDSizeDistributionChart from '@/components/charts/HDSizeDistributionChart';
import CameraGrowthChart from '@/components/charts/CameraGrowthChart';
import { useNVR } from '@/context/NVRContext';

const Relatorios = () => {
  const { nvrs, getTotalStats } = useNVR();
  const stats = getTotalStats();
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Relatórios</h1>
        <p className="text-muted-foreground">
          Visualização de dados dos NVRs e armazenamento
        </p>
      </div>
      
      {/* Estatísticas gerais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card p-6 rounded-lg border shadow-sm">
          <h3 className="text-xl font-medium mb-2">Total de NVRs</h3>
          <p className="text-4xl font-bold">{nvrs.length}</p>
        </div>
        
        <div className="bg-card p-6 rounded-lg border shadow-sm">
          <h3 className="text-xl font-medium mb-2">Capacidade Total</h3>
          <p className="text-4xl font-bold">{stats.totalStorage} TB</p>
        </div>
        
        <div className="bg-card p-6 rounded-lg border shadow-sm">
          <h3 className="text-xl font-medium mb-2">HDs Ativos</h3>
          <p className="text-4xl font-bold">{stats.totalHDs}</p>
        </div>
      </div>
      
      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div>
          <NVRStorageChart />
        </div>
        
        <div>
          <HDSizeDistributionChart />
        </div>
      </div>
      
      {/* Gráfico de evolução */}
      <div className="mb-8">
        <CameraGrowthChart />
      </div>
      
      {/* Informações adicionais */}
      <div className="bg-card p-6 rounded-lg border shadow-sm">
        <h3 className="text-xl font-medium mb-4">Informações do Sistema</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-muted-foreground">Modelos de NVR</h4>
            <div className="mt-2">
              {Array.from(new Set(nvrs.map(nvr => nvr.model))).map(model => (
                <div key={model} className="flex justify-between py-1 border-b">
                  <span>{model}</span>
                  <span className="font-medium">
                    {nvrs.filter(nvr => nvr.model === model).length} unidades
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-muted-foreground">Status dos NVRs</h4>
            <div className="mt-2">
              <div className="flex justify-between py-1 border-b">
                <span>Operacionais</span>
                <span className="font-medium">
                  {nvrs.filter(nvr => nvr.slots.some(slot => slot.status === 'active')).length}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span>Com HDs pequenos (&lt;12TB)</span>
                <span className="font-medium">
                  {nvrs.filter(nvr => 
                    nvr.slots.some(slot => 
                      slot.status === 'active' && 
                      slot.hdSize !== undefined && 
                      slot.hdSize < 12
                    )
                  ).length}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span>Sem HDs ativos</span>
                <span className="font-medium">
                  {nvrs.filter(nvr => !nvr.slots.some(slot => slot.status === 'active')).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Relatorios; 