/**
 * Parser avançado para processar diferentes tipos de relatórios
 */

export interface ParsedReport {
  title: string;
  date: string;
  sections: ReportSection[];
  summary: Record<string, any>;
  metadata: Record<string, any>;
  tables: ReportTable[];
}

export interface ReportSection {
  title: string;
  content: string;
  data: Record<string, any>;
}

export interface ReportTable {
  name: string;
  headers: string[];
  rows: any[][];
}

/**
 * Identifica o tipo de relatório com base no conteúdo
 * @param text O texto do relatório
 * @returns O tipo de relatório identificado
 */
export function identifyReportType(text: string): 'nvr' | 'hd-evolution' | 'unknown' {
  if (text.includes('RELATÓRIO DE STATUS DO SISTEMA NVR')) {
    return 'nvr';
  } else if (text.includes('RELATÓRIO DE EVOLUÇÃO DE HDs')) {
    return 'hd-evolution';
  }
  return 'unknown';
}

/**
 * Formata um valor extraído do relatório de acordo com seu tipo provável
 * @param value Valor como texto
 * @returns Valor formatado (número, booleano ou texto)
 */
function formatValue(value: string): number | boolean | string {
  // Verificar se é um número
  if (/^-?\d+(\.\d+)?$/.test(value.replace(/,/g, '.'))) {
    return parseFloat(value.replace(/,/g, '.'));
  }

  // Verificar se é um valor monetário (R$)
  if (/^R\$ [\d.,]+$/.test(value)) {
    return parseFloat(value.replace('R$ ', '').replace(/\./g, '').replace(',', '.'));
  }

  // Verificar se é um valor porcentual
  if (/^\d+%$/.test(value)) {
    return parseFloat(value.replace('%', '')) / 100;
  }

  // Verificar se é um valor booleano
  if (['sim', 'não', 'true', 'false'].includes(value.toLowerCase())) {
    return ['sim', 'true'].includes(value.toLowerCase());
  }

  // Caso contrário, manter como string
  return value.trim();
}

/**
 * Extrai seções do relatório baseado em títulos em letras maiúsculas seguidos por linhas de igual
 * @param text Texto do relatório
 * @returns Array de seções
 */
function extractSections(text: string): ReportSection[] {
  const lines = text.split('\n');
  const sections: ReportSection[] = [];
  
  let currentSection: ReportSection | null = null;
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Detectar título de seção (linha em maiúsculas seguida por linha de iguais)
    if (
      line === line.toUpperCase() && 
      line.length > 0 && 
      i + 1 < lines.length && 
      lines[i + 1].trim().match(/^={2,}$/)
    ) {
      // Finalizar seção anterior se existir
      if (currentSection) {
        sections.push(currentSection);
      }
      
      // Iniciar nova seção
      currentSection = {
        title: line,
        content: line + '\n' + lines[i + 1] + '\n',
        data: {}
      };
      
      i += 2; // Pular o título e a linha de iguais
    } 
    // Se estamos em uma seção e a linha não está vazia, adicionar à seção atual
    else if (currentSection && line.length > 0) {
      currentSection.content += line + '\n';
      
      // Tentar extrair pares chave-valor
      const keyValueMatch = line.match(/^([^:]+):\s*(.+)$/);
      if (keyValueMatch) {
        const key = keyValueMatch[1].trim();
        const value = keyValueMatch[2].trim();
        currentSection.data[key] = formatValue(value);
      }
      
      i++;
    } 
    // Linha vazia ou fora de seções
    else {
      i++;
    }
  }
  
  // Adicionar a última seção se existir
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return sections;
}

/**
 * Extrai tabelas do relatório
 * @param text Texto do relatório
 * @returns Array de tabelas
 */
function extractTables(text: string): ReportTable[] {
  const lines = text.split('\n');
  const tables: ReportTable[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    // Procurar por linhas que têm muitas vírgulas ou tabs (possíveis cabeçalhos)
    const line = lines[i].trim();
    
    if (line.includes(',') && (line.split(',').length > 2 || line.includes('Numeração') || line.includes('Marina'))) {
      // Possível cabeçalho de tabela CSV
      const headers = line.split(',').map(h => h.trim());
      
      const rows: any[][] = [];
      let j = i + 1;
      
      // Coletar linhas da tabela
      while (j < lines.length) {
        const rowLine = lines[j].trim();
        
        // Se for uma linha vazia ou não tiver vírgulas, provavelmente não faz parte da tabela
        if (rowLine.length === 0 || !rowLine.includes(',')) {
          break;
        }
        
        const cells = rowLine.split(',').map(cell => formatValue(cell.trim()));
        rows.push(cells);
        j++;
      }
      
      // Se encontrou linhas, criar a tabela
      if (rows.length > 0) {
        tables.push({
          name: `Tabela ${tables.length + 1}`,
          headers,
          rows
        });
      }
      
      // Pular para depois da tabela
      i = j;
    }
    else if (line.includes('\t') && line.split('\t').length > 2) {
      // Possível cabeçalho de tabela com tabs
      const headers = line.split('\t').map(h => h.trim()).filter(h => h.length > 0);
      
      const rows: any[][] = [];
      let j = i + 1;
      
      // Coletar linhas da tabela
      while (j < lines.length) {
        const rowLine = lines[j].trim();
        
        // Se for uma linha vazia ou não tiver tabs, provavelmente não faz parte da tabela
        if (rowLine.length === 0 || !rowLine.includes('\t')) {
          break;
        }
        
        const cells = rowLine.split('\t').map(cell => formatValue(cell.trim())).filter(c => c !== '');
        rows.push(cells);
        j++;
      }
      
      // Se encontrou linhas, criar a tabela
      if (rows.length > 0) {
        tables.push({
          name: `Tabela ${tables.length + 1}`,
          headers,
          rows
        });
      }
      
      // Pular para depois da tabela
      i = j;
    }
  }
  
  return tables;
}

/**
 * Extrai metadados básicos do relatório
 * @param text Texto do relatório
 * @returns Metadados
 */
function extractMetadata(text: string): Record<string, any> {
  const metadata: Record<string, any> = {};
  
  // Extrair título e data
  const titleMatch = text.match(/^(RELATÓRIO [^\n]+) - (\d{2}\/\d{2}\/\d{4})/);
  if (titleMatch) {
    metadata.reportType = titleMatch[1];
    metadata.date = titleMatch[2];
  }
  
  return metadata;
}

/**
 * Extrai o resumo geral do relatório
 * @param text Texto do relatório
 * @returns Dados do resumo
 */
function extractSummary(text: string): Record<string, any> {
  const summary: Record<string, any> = {};
  
  // Procurar pela seção RESUMO GERAL
  const resumoMatch = text.match(/RESUMO GERAL\s*\n=+\s*\n([\s\S]*?)(?:\n\s*\n|\n[A-Z]+\s*\n=+)/);
  
  if (resumoMatch) {
    const resumoLines = resumoMatch[1].split('\n');
    
    for (const line of resumoLines) {
      const keyValueMatch = line.match(/^([^:]+):\s*(.+)$/);
      if (keyValueMatch) {
        const key = keyValueMatch[1].trim();
        const value = keyValueMatch[2].trim();
        summary[key] = formatValue(value);
      }
    }
  }
  
  return summary;
}

/**
 * Processa especificamente relatórios do tipo NVR
 * @param text Texto do relatório
 * @returns Relatório processado
 */
function parseNVRReport(text: string): ParsedReport {
  const sections = extractSections(text);
  const tables = extractTables(text);
  const metadata = extractMetadata(text);
  const summary = extractSummary(text);
  
  // Extrair informações específicas do relatório NVR
  const nvrsSection = sections.find(s => s.title.includes('CRÍTICO'));
  if (nvrsSection) {
    // Analisar lista de NVRs em estado crítico
    const nvrLines = nvrsSection.content.split('\n').slice(2); // Pular título e linha de igual
    
    const criticalNVRs: any[] = [];
    
    for (const line of nvrLines) {
      if (line.includes(':')) {
        const [nvrInfo, problemInfo] = line.split(':');
        if (nvrInfo && problemInfo) {
          // Extrair marina e numeração
          const marinaNVRMatch = nvrInfo.match(/([^-]+)\s*-\s*NVR\s*(\d+)/i);
          
          if (marinaNVRMatch) {
            criticalNVRs.push({
              marina: marinaNVRMatch[1].trim(),
              numeracao: marinaNVRMatch[2].trim(),
              problema: problemInfo.trim()
            });
          }
        }
      }
    }
    
    summary.criticalNVRs = criticalNVRs;
  }
  
  return {
    title: metadata.reportType || 'Relatório NVR',
    date: metadata.date || '',
    sections,
    summary,
    metadata,
    tables
  };
}

/**
 * Processa especificamente relatórios do tipo Evolução de HDs
 * @param text Texto do relatório
 * @returns Relatório processado
 */
function parseHDEvolutionReport(text: string): ParsedReport {
  const sections = extractSections(text);
  const tables = extractTables(text);
  const metadata = extractMetadata(text);
  const summary = extractSummary(text);
  
  // Extrair informações específicas do relatório de Evolução de HDs
  const compraSection = sections.find(s => s.title === 'COMPRA DOS NVRS');
  if (compraSection && tables.length > 0) {
    // Processar tabela de compras
    const compraTable = tables[0];
    
    // Adicionar informações ao sumário
    summary.totalSlots = 0;
    summary.totalCost = 0;
    
    // Processar cada linha da tabela
    for (const row of compraTable.rows) {
      if (row.length >= 4) {
        const slots = typeof row[2] === 'number' ? row[2] : 0;
        const cost = typeof row[3] === 'number' ? row[3] : 0;
        
        summary.totalSlots += slots;
        summary.totalCost += cost;
      }
    }
  }
  
  return {
    title: metadata.reportType || 'Relatório de Evolução de HDs',
    date: metadata.date || '',
    sections,
    summary,
    metadata,
    tables
  };
}

/**
 * Analisa um relatório em texto e extrai suas informações estruturadas
 * @param text Texto do relatório
 * @returns Relatório processado com dados estruturados
 */
export function parseReport(text: string): ParsedReport {
  const reportType = identifyReportType(text);
  
  switch (reportType) {
    case 'nvr':
      return parseNVRReport(text);
    case 'hd-evolution':
      return parseHDEvolutionReport(text);
    default:
      // Fallback para um parser genérico
      return {
        title: 'Relatório',
        date: '',
        sections: extractSections(text),
        summary: extractSummary(text),
        metadata: extractMetadata(text),
        tables: extractTables(text)
      };
  }
} 