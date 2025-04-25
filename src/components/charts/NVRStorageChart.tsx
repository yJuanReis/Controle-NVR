import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useNVR } from '@/context/NVRContext';

// Registrar os componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const NVRStorageChart = () => {
  const { nvrs } = useNVR();

  // Calcular capacidade total de cada NVR
  const nvrData = nvrs.map(nvr => {
    const totalStorage = nvr.slots.reduce((acc, slot) => {
      if (slot.status === 'active' && slot.hdSize) {
        return acc + slot.hdSize;
      }
      return acc;
    }, 0);
    
    return {
      name: nvr.name,
      totalStorage,
    };
  });

  // Ordenar NVRs por capacidade de armazenamento (do maior para o menor)
  nvrData.sort((a, b) => b.totalStorage - a.totalStorage);

  // Limitar a 15 NVRs para o gráfico não ficar muito lotado
  const limitedData = nvrData.slice(0, 15);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Capacidade de Armazenamento por NVR (TB)',
        font: {
          size: 16,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.raw} TB`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Capacidade Total (TB)',
        }
      }
    }
  };

  const data = {
    labels: limitedData.map(item => item.name),
    datasets: [
      {
        label: 'Capacidade de Armazenamento',
        data: limitedData.map(item => item.totalStorage),
        backgroundColor: 'rgba(53, 162, 235, 0.6)',
        borderColor: 'rgba(53, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="p-6 bg-card border rounded-lg shadow-sm">
      <Bar options={options} data={data} height={300} />
    </div>
  );
};

export default NVRStorageChart; 