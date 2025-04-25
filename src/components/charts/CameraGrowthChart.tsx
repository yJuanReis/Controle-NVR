import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useNVR } from '@/context/NVRContext';

// Registrar os componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const CameraGrowthChart = () => {
  const { getCamerasTrend } = useNVR();
  const { months, data } = getCamerasTrend();

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Evolução de Câmeras e Capacidade',
        font: {
          size: 16,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const datasetLabel = context.dataset.label || '';
            const value = context.raw;
            if (datasetLabel.includes('Câmeras')) {
              return `${datasetLabel}: ${value}`;
            } else {
              return `${datasetLabel}: ${value} TB`;
            }
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        type: 'linear' as const,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Câmeras',
        }
      },
      y1: {
        beginAtZero: true,
        type: 'linear' as const,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Capacidade (TB)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const chartData = {
    labels: months,
    datasets: [
      {
        label: 'Câmeras Instaladas',
        data: data.map(item => item.cameras),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        yAxisID: 'y',
      },
      {
        label: 'Capacidade de Armazenamento',
        data: data.map(item => item.capacity),
        borderColor: 'rgba(53, 162, 235, 1)',
        backgroundColor: 'rgba(53, 162, 235, 0.2)',
        yAxisID: 'y1',
      },
    ],
  };

  return (
    <div className="p-6 bg-card border rounded-lg shadow-sm">
      <Line options={options} data={chartData} height={300} />
    </div>
  );
};

export default CameraGrowthChart; 