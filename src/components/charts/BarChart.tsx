import React, { useMemo, useCallback } from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, TooltipProps, LabelList, ReferenceLine } from 'recharts';
import { useTheme } from 'next-themes'; // Assuming you use next-themes for dark mode

interface DataItem {
  name: string;
  value: number;
  color?: string;
  marina?: string;
  owner?: string;
  model?: string;
  slots?: any[];
  totalSlots?: number;
}

interface BarChartProps {
  data: DataItem[];
  title: string;
  color?: string;
  onClick?: (name: string) => void;
  className?: string;
  useCustomColors?: boolean;
  barSize?: number;
  responsive?: boolean;
  chartTitle?: string;
  labelColor?: string;
  darkMode?: boolean;
}

// Interface para o CustomTooltip
interface CustomTooltipProps extends TooltipProps<number, string> {
  isDark: boolean;
}

// Tooltip personalizado
const CustomTooltip = ({ active, payload, isDark }: CustomTooltipProps) => {
  const bgColor = isDark ? 'rgba(30, 30, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)';
  const textColor = isDark ? '#eee' : '#1e293b';
  const labelColor = isDark ? '#ddd' : '#64748b';
  const borderColor = isDark ? '#3a3a4a' : '#e2e8f0';

  if (active && payload && payload.length) {
    const nvr = payload[0]?.payload as DataItem;
    if (!nvr) return null;

    const hasSlotsInfo = nvr.slots && Array.isArray(nvr.slots);
    const totalSlots = nvr.totalSlots ?? nvr.slots?.length ?? 0;

    return (
      <div
        className="custom-tooltip p-3 rounded shadow-lg"
        style={{ 
          backgroundColor: bgColor, 
          border: `1px solid ${borderColor}`,
          boxShadow: isDark ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
      >
        {nvr.marina && <p className="label text-sm font-semibold mb-1" style={{ color: labelColor }}>{nvr.marina}</p>}
        <p className="intro font-bold text-base mb-2" style={{ color: textColor }}>{nvr.name || 'N/A'}</p>
        <p className="value" style={{ color: textColor }}>
          {`Câmeras: ${payload[0].value ?? 'N/A'}`}
        </p>
        {nvr.owner && <p className="owner text-xs mt-1" style={{ color: labelColor }}>{`Responsável: ${nvr.owner}`}</p>}
        {nvr.model && <p className="model text-xs mt-1" style={{ color: labelColor }}>{`Modelo: ${nvr.model}`}</p>}
      </div>
    );
  }
  return null;
};

const BarChart: React.FC<BarChartProps> = ({ 
  data, 
  title, 
  color = "#3B82F6", 
  onClick, 
  className = 'h-[400px]',
  useCustomColors = false,
  barSize,
  responsive = true,
  chartTitle,
  labelColor,
  darkMode
}) => {
  const { theme } = useTheme();
  const isDark = darkMode !== undefined ? darkMode : theme === 'dark';
  
  // Cores consistentes para ambos os temas
  const backgroundColor = isDark ? '#1e1e2d' : '#5d686b';
  const gridColor = isDark ? '#3a3a4a' : '#e2e8f0';
  const lightGridColor = isDark ? 'rgba(58, 58, 74, 0.5)' : 'rgba(226, 232, 240, 0.7)';
  const axisTickColor = isDark ? '#ffffff' : '#1e293b';
  const chartBorderColor = isDark ? '#2d2d3a' : '#d1d5db';
  
  console.log("Dados (Y-Axis Scale Check):", data); 

  if (!data || data.length === 0) {
      console.warn("BarChart: Sem dados.");
      return <div className={`flex items-center justify-center text-gray-500 ${className}`}>Sem dados para exibir o gráfico.</div>;
  }
  const hasValidData = data.every(item => typeof item.name !== 'undefined' && typeof item.value === 'number');
  if (!hasValidData) {
      console.error("BarChart: Dados inválidos.", data);
      return <div className={`flex items-center justify-center text-red-500 ${className}`}>Erro: Dados inválidos.</div>;
  }

  const handleBarClick = useCallback((payload: any) => {
    if (onClick && payload && payload.name) {
      onClick(payload.name);
    }
  }, [onClick]);

  const dynamicMargin = useMemo(() => {
    const baseBottomMargin = 120; // Aumentado para dar mais espaço no fundo
    const extraMarginPerItem = 6; // Aumentado para dar mais espaço por item
    
    // Ajustes para poucos itens
    if (data.length <= 3) {
      return { 
        top: 50, 
        right: 50, 
        left: 50, 
        bottom: 100 
      };
    } else if (data.length <= 10) {
      return { 
        top: 40, 
        right: 40, 
        left: 30, 
        bottom: 150 
      };
    }
    
    // Para muitos itens
    const bottom = Math.min(300, baseBottomMargin + data.length * extraMarginPerItem); 
    return { 
      top: 30, 
      right: 30, 
      left: 20, 
      bottom 
    };
  }, [data.length]);

  const tickFontSize = useMemo(() => {
    if (data.length > 50) return 11;
    if (data.length > 30) return 13;
    if (data.length > 15) return 15;
    return 16;
  }, [data.length]);

  const calculatedBarSize = useMemo(() => {
      if (data.length === 1) return 100;
      if (data.length <= 3) return 80;
      if (data.length <= 5) return 60;
      if (data.length <= 10) return 50;
      if (data.length <= 20) return 35;
      if (data.length <= 40) return 25;
      if (data.length <= 60) return 15;
      return 10;
  }, [data.length]);

  // Format X-axis label to potentially shorten if needed (optional)
  const formatXAxisLabel = (label: string): string => {
    return label;
  };

  // Função personalizada para renderizar os ticks do eixo X
  const CustomXAxisTick = useCallback((props: any) => {
    const { x, y, payload, index } = props;
    const item = data[index];
    const tickColor = useCustomColors && item.color ? item.color : color;
    
    // Calcular o comprimento do texto para ajustar o posicionamento
    const textLength = payload.value.length;
    
    // Ajuste da rotação baseado na quantidade de itens e tamanho do texto
    let rotation = -35;
    let dyValue = 15;
    let textAnchor = "end";
    
    if (data.length <= 5) {
      // Para poucos itens, menos rotação ou nenhuma
      rotation = textLength > 12 ? -25 : 0;
      dyValue = rotation === 0 ? 20 : 15;
      textAnchor = rotation === 0 ? "middle" : "end";
    } else if (data.length <= 10) {
      rotation = -30;
      dyValue = 15;
    } else {
      rotation = textLength > 15 ? -45 : -35;
      dyValue = textLength > 15 ? 10 : 15;
    }

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={dyValue}
          textAnchor={textAnchor}
          fill={tickColor}
          fontSize={tickFontSize}
          fontWeight="bold"
          transform={`rotate(${rotation})`}
        >
          {payload.value}
        </text>
      </g>
    );
  }, [data, useCustomColors, color, tickFontSize]);

  // Determine Y-axis max value dynamically for better scale
  const yAxisMax = useMemo(() => {
    const maxValueInData = Math.max(...data.map(item => item.value), 0);
    
    // Para poucos dados, garantimos escala adequada
    if (data.length <= 3) {
      if (maxValueInData <= 10) return Math.max(15, Math.ceil(maxValueInData * 1.5));
      if (maxValueInData <= 20) return Math.max(25, Math.ceil(maxValueInData * 1.3));
      return Math.ceil(maxValueInData * 1.2);
    }
    
    // Para dados normais
    if (maxValueInData <= 10) return 10; 
    if (maxValueInData <= 20) return 20;
    const paddedMax = maxValueInData * 1.1;
    return Math.ceil(paddedMax / 5) * 5; 
  }, [data]);

  console.log(`Max value in data: ${Math.max(...data.map(item => item.value))}, Y-Axis Max set to: ${yAxisMax}`);

  // Função personalizada para renderizar as etiquetas de valor no topo
  const CustomizedLabel = useCallback((props: any) => {
    const { x, y, width, height, value, index } = props;
    const item = data[index];
    const labelColor = useCustomColors && item.color ? item.color : color;

    if (!value || value <= 0) return null;
    
    // Ajuste do tamanho da fonte e posicionamento vertical
    let fontSizeResponsive;
    
    if (data.length <= 3) {
      // Para poucos itens, fonte maior
      fontSizeResponsive = Math.max(
        18,
        Math.min(
          Math.floor(width * 0.7),
          28 
        )
      );
    } else {
      // Para quantidade normal de itens
      fontSizeResponsive = Math.max(
        12,
        Math.min(
          Math.floor(width * 0.65),
          24
        )
      );
    }
    
    // Posicionamento vertical - mais distante para poucas barras
    const yPosition = data.length <= 3 ? y - 25 : y - 15;
    
    return (
      <text 
        x={x + width / 2} 
        y={yPosition} 
        fill={labelColor} 
        textAnchor="middle" 
        fontSize={fontSizeResponsive}
        fontWeight="bold"
      >
        {value}
      </text>
    );
  }, [data, useCustomColors, color]);

  // Gera valores para as linhas de referência vertical
  const referenceLines = useMemo(() => {
    // Se tiver poucos dados, mostrar uma linha para cada item
    if (data.length <= 10) {
      return data.map((item, index) => ({
        x: item.name,
        color: lightGridColor
      }));
    }
    
    // Para muitos dados, mostrar linhas em intervalos
    const interval = Math.ceil(data.length / 10);
    return data
      .filter((_, index) => index % interval === 0)
      .map(item => ({
        x: item.name,
        color: lightGridColor
      }));
  }, [data, lightGridColor]);

  return (
    <div className={`w-full ${className} rounded-lg overflow-hidden p-3`} 
         style={{ 
           backgroundColor: backgroundColor, 
           boxShadow: isDark ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.1)',
           border: `1px solid ${chartBorderColor}`
         }}> 
      {chartTitle && (
        <h3 className="text-lg font-semibold mb-3 text-center" style={{ color: axisTickColor }}>{chartTitle}</h3>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          margin={dynamicMargin}
          barCategoryGap={data.length <= 3 ? "35%" : "25%"}
          barGap={data.length <= 3 ? 20 : 5}
          className="focus:outline-none"
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            horizontal={true}
            vertical={false} 
            stroke={gridColor} 
          />
          
          {/* Linhas de referência verticais */}
          {referenceLines.map((line, index) => (
            <ReferenceLine
              key={`ref-line-${index}`}
              x={line.x}
              stroke={line.color}
              strokeDasharray="3 3"
              ifOverflow="hidden"
            />
          ))}
          
          <XAxis 
            dataKey="name" 
            interval={0}
            tickLine={{ stroke: gridColor }}
            axisLine={{ stroke: gridColor }}
            tick={CustomXAxisTick}
          />
          
          <YAxis 
            tick={{ fontSize: data.length > 20 ? 24 : 30, fill: axisTickColor }}
            domain={[0, yAxisMax]} 
            allowDecimals={false}
            width={60} 
            tickLine={{ stroke: gridColor }}
            axisLine={{ stroke: gridColor }}
            tickCount={Math.min(10, Math.ceil(yAxisMax / 5) + 1)} 
            tickFormatter={value => value.toString()}
          />
          
          <Tooltip 
            content={<CustomTooltip isDark={isDark} />} 
            wrapperStyle={{ zIndex: 10 }} 
            cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }}
          />
          
          <Bar 
            dataKey="value" 
            radius={[4, 4, 0, 0]}
            onClick={handleBarClick}
            barSize={calculatedBarSize}
            minPointSize={3}
            isAnimationActive={false} 
            label={CustomizedLabel}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={useCustomColors ? (entry.color || color) : color} 
                style={{ 
                  filter: isDark 
                    ? 'drop-shadow(0px 2px 3px rgba(0,0,0,0.5))' 
                    : 'drop-shadow(0px 2px 3px rgba(0,0,0,0.15))' 
                }}
              />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChart;