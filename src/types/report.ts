export interface ReportData {
  title: string;
  metadata: {
    date: string;
    period: string;
  };
  sections: {
    name: string;
    content: Record<string, any>;
  }[];
  tables: {
    headers: string[];
    rows: any[][];
  }[];
}

export interface ReportSection {
  name: string;
  content: Record<string, any>;
}

export interface ReportTable {
  headers: string[];
  rows: any[][];
} 