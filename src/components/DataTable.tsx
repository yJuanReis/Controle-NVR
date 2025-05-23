import { ReportData } from "@/types/report";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";

interface DataTableProps {
  data: ReportData;
}

export default function DataTable({ data }: DataTableProps) {
  return (
    <div className="space-y-6">
      {/* Metadados */}
      <Card className="card-responsive">
        <CardHeader>
          <CardTitle className="heading-responsive">Informações Gerais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Título</p>
              <p className="text-responsive">{data.title}</p>
            </div>
            {data.metadata?.date && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data</p>
                <p className="text-responsive">{data.metadata.date}</p>
              </div>
            )}
            {data.metadata?.period && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Período</p>
                <p className="text-responsive">{data.metadata.period}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Seções */}
      {data.sections && data.sections.length > 0 && (
        <Card className="card-responsive">
          <CardHeader>
            <CardTitle className="heading-responsive">Seções do Relatório</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {data.sections.map((section, index) => (
                <div key={index} className="border rounded-lg p-4 mobile-friendly">
                  <h3 className="font-medium text-lg mb-2 text-responsive">{section.name}</h3>
                  <div className="table-wrapper">
                    <div className="table-responsive">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[200px] md:w-[250px]">Propriedade</TableHead>
                            <TableHead>Valor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(section.content).map(([key, value], idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium text-responsive">{key}</TableCell>
                              <TableCell className="text-responsive">{String(value)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabelas */}
      {data.tables && data.tables.length > 0 && (
        <Card className="card-responsive">
          <CardHeader>
            <CardTitle className="heading-responsive">Tabelas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {data.tables.map((table, index) => (
                <div key={index} className="border rounded-lg p-4 mobile-friendly">
                  <h3 className="font-medium text-lg mb-2 text-responsive">Tabela {index + 1}</h3>
                  <div className="table-wrapper">
                    <div className="table-responsive">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {table.headers.map((header, idx) => (
                              <TableHead key={idx} className="text-responsive">{header}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {table.rows.map((row, rowIdx) => (
                            <TableRow key={rowIdx}>
                              {row.map((cell, cellIdx) => (
                                <TableCell key={cellIdx} className="text-responsive">{String(cell)}</TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 