'use client';

import React, { useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';

interface TableReportViewProps {
  data: Record<string, any>;
}

interface ReportRow {
  section: string;
  property: string;
  value: string;
}

export default function TableReportView({ data }: TableReportViewProps) {
  const [filter, setFilter] = useState('');

  const columns = useMemo<ColumnDef<ReportRow>[]>(
    () => [
      {
        accessorKey: 'section',
        header: 'Seção',
      },
      {
        accessorKey: 'property',
        header: 'Propriedade',
      },
      {
        accessorKey: 'value',
        header: 'Valor',
      },
    ],
    []
  );

  const tableData = useMemo(() => {
    const rows: ReportRow[] = [];

    // Adicionar propriedades globais
    Object.entries(data)
      .filter(([key]) => key !== 'sections')
      .forEach(([key, value]) => {
        rows.push({
          section: 'Geral',
          property: key,
          value: String(value),
        });
      });

    // Adicionar seções
    if (data.sections && Array.isArray(data.sections)) {
      data.sections.forEach((section: any) => {
        if (section.data) {
          Object.entries(section.data).forEach(([key, value]) => {
            rows.push({
              section: section.title || 'Sem título',
              property: key,
              value: String(value),
            });
          });
        }
      });
    }

    return rows;
  }, [data]);

  return (
    <div className="container mx-auto py-4">
      {!tableData.length ? (
        <div className="text-center text-gray-500">Nenhum dado para exibir</div>
      ) : (
        <DataTable
          columns={columns}
          data={tableData}
          filterValue={filter}
          onFilterChange={setFilter}
          pageSize={15}
        />
      )}
    </div>
  );
} 