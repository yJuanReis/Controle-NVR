import { ReportData } from "../types/report";

/**
 * Formata os dados do relatório para exibição em formato texto
 * @param data Dados estruturados do relatório
 * @returns Texto formatado do relatório
 */
export function formatReportData(data: ReportData): string {
  let result = '';
  
  // Adicionar título
  if (data.title) {
    result += `${data.title}\n`;
    result += '='.repeat(data.title.length) + '\n\n';
  }
  
  // Adicionar metadados
  if (data.metadata) {
    if (data.metadata.date) {
      result += `Data: ${data.metadata.date}\n`;
    }
    if (data.metadata.period) {
      result += `Período: ${data.metadata.period}\n`;
    }
    result += '\n';
  }
  
  // Adicionar seções
  if (data.sections && data.sections.length > 0) {
    for (const section of data.sections) {
      result += `${section.name}:\n`;
      result += '-'.repeat(section.name.length + 1) + '\n';
      
      for (const [key, value] of Object.entries(section.content)) {
        result += `${key}: ${value}\n`;
      }
      
      result += '\n';
    }
  }
  
  // Adicionar tabelas
  if (data.tables && data.tables.length > 0) {
    for (const table of data.tables) {
      // Determinar largura de cada coluna
      const columnWidths = table.headers.map((header, index) => {
        const maxCellWidth = table.rows.reduce((max, row) => {
          return Math.max(max, row[index]?.toString().length || 0);
        }, 0);
        return Math.max(header.length, maxCellWidth);
      });
      
      // Montar linha de cabeçalho
      let headerRow = '';
      table.headers.forEach((header, index) => {
        headerRow += header.padEnd(columnWidths[index] + 2);
      });
      result += headerRow + '\n';
      
      // Linha de separação
      let separatorRow = '';
      columnWidths.forEach((width) => {
        separatorRow += '-'.repeat(width) + '  ';
      });
      result += separatorRow + '\n';
      
      // Linhas de dados
      for (const row of table.rows) {
        let dataRow = '';
        table.headers.forEach((_, index) => {
          const value = row[index]?.toString() || '';
          dataRow += value.padEnd(columnWidths[index] + 2);
        });
        result += dataRow + '\n';
      }
      
      result += '\n';
    }
  }
  
  return result;
} 