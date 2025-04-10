
import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DataItem {
  name: string;
  value: number;
}

interface BarChartProps {
  data: DataItem[];
  title: string;
  color?: string;
  onClick?: (name: string) => void;
}

const BarChart: React.FC<BarChartProps> = ({ data, title, color = "#1E88E5", onClick }) => {
  const handleBarClick = (data: any) => {
    if (onClick) {
      onClick(data.name);
    }
  };

  return (
    <div className="h-80 w-full">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height="90%">
        <RechartsBarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
          barGap={2}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar 
            dataKey="value" 
            name="Valor" 
            fill={color} 
            radius={[4, 4, 0, 0]} 
            onClick={handleBarClick} 
            cursor={onClick ? "pointer" : undefined}
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChart;
