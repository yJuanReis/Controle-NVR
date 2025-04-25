import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { useNVR } from '@/context/NVRContext';

// Registrar os componentes do Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

const HDSizeDistributionChart = () => {
  const { nvrs } = useNVR();

  // Extrair todos os HDs ativos
  const activeHDs = nvrs.flatMap(nvr => 
    nvr.slots
      .filter(slot => slot.status === 'active' && slot.hdSize !== undefined)
      .map(slot => slot.hdSize as number)
  );

  // Agrupar por tamanho de HD
  const hdSizeCounts: Record<number, number> = {};
  activeHDs.forEach(size => {
    if (hdSizeCounts[size]) {
      hdSizeCounts[size]++;
    } else {
      hdSizeCounts[size] = 1;
    }
  });

  // Preparar os dados para o gráfico
  const sizes = Object.keys(hdSizeCounts).map(Number).sort((a, b) => a - b);
  const counts = sizes.map(size => hdSizeCounts[size]);

  // Cores para diferentes tamanhos de HD
  const backgroundColors = [
    'rgba(255, 99, 132, 0.7)',
    'rgba(54, 162, 235, 0.7)',
    'rgba(255, 206, 86, 0.7)',
    'rgba(75, 192, 192, 0.7)',
    'rgba(153, 102, 255, 0.7)',
    'rgba(255, 159, 64, 0.7)',
    'rgba(199, 199, 199, 0.7)',
    'rgba(83, 102, 255, 0.7)',
  ];

  const data = {
    labels: sizes.map(size => `${size} TB`),
    datasets: [
      {
        label: 'Quantidade',
        data: counts,
        backgroundColor: backgroundColors.slice(0, sizes.length),
        borderColor: backgroundColors.slice(0, sizes.length).map(color => 
          color.replace('0.7', '1')
        ),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: 'Distribuição de Tamanhos de HD',
        font: {
          size: 16,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} unidades (${percentage}%)`;
          }
        }
      }
    },
  };

  return (
    <div className="p-6 bg-card border rounded-lg shadow-sm">
      <Pie data={data} options={options} />
    </div>
  );
};

export default HDSizeDistributionChart; 