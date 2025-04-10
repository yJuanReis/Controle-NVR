
import React from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

interface DataItem {
  name: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: DataItem[];
  title: string;
  onClick?: (name: string) => void;
}

const COLORS = ['#4CAF50', '#FFB74D', '#E53935', '#1E88E5', '#7E57C2'];

const PieChart: React.FC<PieChartProps> = ({ data, title, onClick }) => {
  const handlePieClick = (entry: any) => {
    if (onClick) {
      onClick(entry.name);
    }
  };

  return (
    <div className="h-80 w-full">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height="90%">
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={true}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            onClick={handlePieClick}
            cursor={onClick ? "pointer" : undefined}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color || COLORS[index % COLORS.length]} 
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PieChart;
