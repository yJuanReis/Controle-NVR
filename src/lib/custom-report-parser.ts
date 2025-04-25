/**
 * Parser personalizado para extrair informações estruturadas de arquivos de texto
 */

export interface ParsedReportData {
  title: string;
  date: string;
  sections: {
    name: string;
    metrics: {
      key: string;
      value: number | string;
    }[];
  }[];
  statistics: {
    name: string;
    value: number;
  }[];
}

/**
 * Converte um arquivo de texto para um formato estruturado
 * @param text Texto do arquivo
 * @returns Dados formatados
 */
export function parseCustomReport(text: string): ParsedReportData {
  // Inicializa o objeto de resultado
  const result: ParsedReportData = {
    title: '',
    date: '',
    sections: [],
    statistics: []
  };

  // Divide o texto em linhas e remove linhas vazias
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  // Extrai título e data
  if (lines.length > 0) {
    result.title = lines[0].trim();
  }
  
  // Busca pela data no formato DD/MM/YYYY
  const dateRegex = /(\d{2}\/\d{2}\/\d{4})/;
  for (const line of lines) {
    const match = line.match(dateRegex);
    if (match) {
      result.date = match[1];
      break;
    }
  }

  // Variáveis para controlar o processamento
  let currentSection: {name: string; metrics: {key: string; value: number | string}[]} | null = null;
  let processingStatistics = false;

  // Percorre as linhas para identificar seções e seus conteúdos
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Verifica se é um cabeçalho de seção (termina com ':' e não contém outros caracteres ':')
    if (line.endsWith(':') && (line.indexOf(':') === line.length - 1)) {
      // Salva a seção anterior, se existir
      if (currentSection) {
        result.sections.push(currentSection);
      }
      
      // Cria nova seção
      currentSection = {
        name: line.substring(0, line.length - 1).trim(),
        metrics: []
      };
      
      // Reseta a flag de estatísticas
      processingStatistics = currentSection.name.toLowerCase().includes('estatística');
      continue;
    }
    
    // Verifica se é um par chave-valor (contém ':' no meio da linha)
    if (line.includes(':') && line.indexOf(':') < line.length - 1) {
      const [key, valueStr] = line.split(':', 2).map(part => part.trim());
      
      // Converte para número se for um valor numérico
      const value = !isNaN(Number(valueStr)) ? Number(valueStr) : valueStr;
      
      if (currentSection) {
        currentSection.metrics.push({ key, value });
      }
      
      // Se estiver processando estatísticas e for um valor numérico, adiciona aos statistics
      if (processingStatistics && typeof value === 'number') {
        result.statistics.push({
          name: key,
          value
        });
      }
    }
  }
  
  // Adiciona a última seção, se existir
  if (currentSection) {
    result.sections.push(currentSection);
  }
  
  return result;
}

/**
 * Extrai dados para visualização em gráficos de barras
 * @param data Dados parseados
 * @returns Dados formatados para gráficos
 */
export function extractChartData(data: ParsedReportData) {
  // Extrai dados numéricos para gráficos
  return data.statistics.map(stat => ({
    name: stat.name,
    value: stat.value
  }));
} 