/**
 * Funções para converter relatórios em txt para formatos estruturados
 */

import { ReportData, ReportSection, ReportTable } from "../types/report";

/**
 * Converte um relatório em formato texto para um objeto JSON estruturado
 * @param text O texto do relatório
 * @returns Objeto estruturado com os dados do relatório
 */
export function parseReportToJson(text: string): Record<string, any> {
  // Divide o texto em linhas
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  // Objeto resultante
  const result: Record<string, any> = {
    sections: [],
  };
  
  let currentSection: Record<string, any> = {};
  
  // Processa cada linha
  lines.forEach((line, index) => {
    // Verifica se é um cabeçalho (supondo que cabeçalhos não contêm ":")
    if (!line.includes(':') && line.trim().length > 0) {
      if (Object.keys(currentSection).length > 0) {
        result.sections.push(currentSection);
      }
      currentSection = {
        title: line.trim(),
        data: {}
      };
    } 
    // Verifica se é um par chave-valor
    else if (line.includes(':')) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();
      
      if (Object.keys(currentSection).length > 0) {
        currentSection.data[key.trim()] = value;
      } else {
        // Propriedades globais no início do relatório
        result[key.trim()] = value;
      }
    }
    
    // Adiciona a última seção se estamos na última linha
    if (index === lines.length - 1 && Object.keys(currentSection).length > 0) {
      result.sections.push(currentSection);
    }
  });
  
  return result;
}

/**
 * Converte um relatório em formato texto para CSV
 * @param text O texto do relatório
 * @returns String em formato CSV
 */
export function parseReportToCsv(text: string): string {
  const jsonData = parseReportToJson(text);
  let csvOutput = '';
  
  // Adiciona propriedades globais
  Object.entries(jsonData)
    .filter(([key]) => key !== 'sections')
    .forEach(([key, value]) => {
      csvOutput += `${key},${value}\n`;
    });
  
  csvOutput += '\n';
  
  // Processa cada seção
  jsonData.sections.forEach((section: any) => {
    csvOutput += `${section.title}\n`;
    
    // Adiciona cabeçalhos para os dados da seção
    if (Object.keys(section.data).length > 0) {
      csvOutput += 'Propriedade,Valor\n';
      
      // Adiciona os pares chave-valor
      Object.entries(section.data).forEach(([key, value]) => {
        csvOutput += `${key},${String(value).replace(/,/g, ';')}\n`;
      });
      
      csvOutput += '\n';
    }
  });
  
  return csvOutput;
}

export function parseReport(reportText: string): ReportData {
  const lines = reportText.split('\n');

  // Extract title from the first non-empty line
  let title = '';
  for (const line of lines) {
    if (line.trim()) {
      title = line.trim();
      break;
    }
  }

  // Metadata object to store date and period
  const metadata = {
    date: '',
    period: '',
  };

  // Extract metadata (date and period)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.toLowerCase().includes('data:')) {
      metadata.date = line.split(':')[1]?.trim() || '';
    } else if (line.toLowerCase().includes('período:')) {
      metadata.period = line.split(':')[1]?.trim() || '';
    }
  }

  // Parse sections
  const sections: ReportSection[] = [];
  let currentSection: ReportSection | null = null;

  // Parse tables
  const tables: ReportTable[] = [];
  let currentTable: ReportTable | null = null;
  let tableStarted = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Check if line is a section header (ending with ':')
    if (line.endsWith(':') && !tableStarted) {
      // Save previous section if exists
      if (currentSection) {
        sections.push(currentSection);
      }
      
      // Start new section
      currentSection = {
        name: line.slice(0, -1).trim(),
        content: {},
      };
    } 
    // Check if line contains a key-value pair (contains ': ' but is not a section header)
    else if (line.includes(': ') && currentSection && !tableStarted) {
      const [key, value] = line.split(': ', 2);
      currentSection.content[key.trim()] = value.trim();
    }
    // Check if line is a table header (contains multiple values separated by tabs or spaces)
    else if (line.includes('\t') || (line.split('  ').filter(Boolean).length > 1)) {
      // Detect table headers by looking for lines with multiple separated values
      const headers = line.split(/\t|  +/).filter(Boolean).map(header => header.trim());
      
      // If we have at least 2 headers, consider it a table
      if (headers.length >= 2) {
        // Save previous section if exists
        if (currentSection) {
          sections.push(currentSection);
          currentSection = null;
        }
        
        // Start new table
        currentTable = {
          headers,
          rows: [],
        };
        
        tableStarted = true;
      }
    }
    // Process table rows if we're in a table
    else if (tableStarted && currentTable) {
      if (line.includes('\t') || (line.split('  ').filter(Boolean).length > 1)) {
        const cells = line.split(/\t|  +/).filter(Boolean).map(cell => cell.trim());
        if (cells.length > 0) {
          currentTable.rows.push(cells);
        }
      } else {
        // End of table
        tables.push(currentTable);
        currentTable = null;
        tableStarted = false;
        
        // This line might be a new section, check if it ends with ':'
        if (line.endsWith(':')) {
          currentSection = {
            name: line.slice(0, -1).trim(),
            content: {},
          };
        }
      }
    }
  }
  
  // Save last section or table if exists
  if (currentSection) {
    sections.push(currentSection);
  }
  if (currentTable && tableStarted) {
    tables.push(currentTable);
  }
  
  return {
    title,
    metadata,
    sections,
    tables,
  };
} 