import { ReportData } from "../types/report";

/**
 * Faz o download de um objeto como arquivo JSON
 * @param data Dados para download
 * @param filename Nome do arquivo
 */
export function downloadJSON(data: any, filename: string): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Converte dados do relatório para formato CSV e faz o download
 * @param data Dados do relatório
 * @param filename Nome do arquivo
 */
export function downloadCSV(data: ReportData, filename: string): void {
  let csvContent = '';
  
  // Adicionar metadados
  csvContent += `Título,${data.title}\n`;
  if (data.metadata?.date) csvContent += `Data,${data.metadata.date}\n`;
  if (data.metadata?.period) csvContent += `Período,${data.metadata.period}\n`;
  csvContent += '\n';
  
  // Adicionar seções
  if (data.sections && data.sections.length > 0) {
    for (const section of data.sections) {
      csvContent += `${section.name}\n`;
      csvContent += 'Propriedade,Valor\n';
      
      for (const [key, value] of Object.entries(section.content)) {
        csvContent += `${key},${escapeCSV(String(value))}\n`;
      }
      
      csvContent += '\n';
    }
  }
  
  // Adicionar tabelas
  if (data.tables && data.tables.length > 0) {
    for (const table of data.tables) {
      // Cabeçalhos
      csvContent += table.headers.map(escapeCSV).join(',') + '\n';
      
      // Linhas de dados
      for (const row of table.rows) {
        csvContent += row.map(cell => escapeCSV(String(cell))).join(',') + '\n';
      }
      
      csvContent += '\n';
    }
  }
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Escapa valores para CSV para evitar problemas com vírgulas e aspas
 * @param value O valor para escapar
 * @returns O valor escapado para CSV
 */
function escapeCSV(value: string): string {
  // Se o valor contém vírgula, aspas ou quebra de linha, coloque entre aspas
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    // Escape aspas dentro do valor dobrando-as
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
} 