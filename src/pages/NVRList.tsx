import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNVR } from '@/context/NVRContext';
import { Database, Edit, Camera, FileText, Trash, ArrowUp, ArrowDown, Search, Server, Cpu, HardDrive, Monitor, PlusCircle, BarChart2, TrendingUp } from 'lucide-react';
import NVRForm from '@/components/NVRForm';
import SlotForm from '@/components/SlotForm';
import CameraForm from '@/components/CameraForm';
import ConfirmDialog from '@/components/ConfirmDialog';
import { NVR } from '@/types';
import { getOwnerColor } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

// Tipo para a ordenação
type SortField = 'name' | 'model' | 'owner' | 'slots' | 'cameras' | null;
type SortDirection = 'asc' | 'desc';

const NVRList = () => {
  const { nvrs, deleteNVR } = useNVR();
  const [isAddingNVR, setIsAddingNVR] = useState(false);
  const [editingNVR, setEditingNVR] = useState<NVR | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<{
    nvrId: string;
    slotId: string;
    hdSize?: number;
    status: "active" | "inactive" | "empty";
  } | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<{
    nvrId: string;
    cameras: number;
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string } | null>(null);
  
  // Estado para NVR destacado
  const [highlightedNVRId, setHighlightedNVRId] = useState<string | null>(null);
  
  // Estados de ordenação
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Estado para a pesquisa
  const [searchTerm, setSearchTerm] = useState('');

  // Referência para o campo de pesquisa
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Referências para os elementos da lista de NVR
  const nvrRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [marinas, setMarinas] = useState<string[]>(['Marina A', 'Marina B', 'Marina C']);
  const [marinaSelecionada, setMarinaSelecionada] = useState<string>(marinas[0]);
  const [filtro, setFiltro] = useState<string>('');

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setMarinaSelecionada(event.target.value);
  };

  const handleFiltroChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFiltro(event.target.value);
  };

  const marinasFiltradas = marinas.filter(marina => 
    marina.toLowerCase().includes(filtro.toLowerCase())
  );

  // Efeito para verificar e destacar o NVR ao carregar a página
  useEffect(() => {
    const highlightNVRId = localStorage.getItem('highlightNVRId');
    if (highlightNVRId) {
      setHighlightedNVRId(highlightNVRId);
      
      // Limpar o localStorage após ler o ID
      localStorage.removeItem('highlightNVRId');
      
      // Rolar até o NVR destacado após um breve delay para garantir que o DOM esteja pronto
      setTimeout(() => {
        const nvrElement = document.getElementById(`nvr-${highlightNVRId}`);
        if (nvrElement) {
          nvrElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
      
      // Remover o destaque após 3 segundos
      setTimeout(() => {
        setHighlightedNVRId(null);
      }, 1500);
    }
  }, []);

  const getSlotStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-300';
    }
  };
  
  // Função para atribuir cores diferentes a cada tamanho de HD
  const getHDSizeColor = (hdSize?: number, status?: string) => {
    // Se o status for vazio ou não definido, retornamos a cor de slot vazio
    if (status === 'empty' || !hdSize) {
      return 'bg-gray-300';
    }
    
    // Se o status for inativo, retornamos uma versão mais clara da cor
    const isInactive = status === 'inactive';
    
    // Cores por tamanho de HD
    switch(hdSize) {
      case 1:
        return isInactive ? 'bg-red-300' : 'bg-red-500';
      case 2:
        return isInactive ? 'bg-orange-300' : 'bg-orange-500';
      case 3:
        return isInactive ? 'bg-amber-300' : 'bg-amber-500';
      case 4:
        return isInactive ? 'bg-yellow-300' : 'bg-yellow-500';
      case 6:
        return isInactive ? 'bg-lime-300' : 'bg-lime-500';
      case 8:
        return isInactive ? 'bg-green-300' : 'bg-green-500';
      case 10:
        return isInactive ? 'bg-emerald-300' : 'bg-emerald-500';
      case 12:
        return isInactive ? 'bg-teal-300' : 'bg-teal-500';
      case 14:
        return isInactive ? 'bg-cyan-300' : 'bg-cyan-500';
      case 16:
        return isInactive ? 'bg-blue-300' : 'bg-blue-500';
      case 18:
        return isInactive ? 'bg-indigo-300' : 'bg-indigo-500';
      case 20:
        return isInactive ? 'bg-violet-300' : 'bg-violet-500';
      default:
        return isInactive ? 'bg-purple-300' : 'bg-purple-500'; // Para tamanhos não mapeados
    }
  };
  
  // Função para alternar o campo e direção de ordenação
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      // Se já estamos ordenando por esse campo, apenas invertemos a direção
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Caso contrário, definimos o novo campo e resetamos para ascendente
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Componente para o cabeçalho de coluna ordenável
  const SortableHeader = ({ field, label, className = "" }: { field: SortField, label: string, className?: string }) => (
    <div 
      className={`flex items-center cursor-pointer hover:bg-gray-200 px-2 py-1 rounded transition-colors ${sortField === field ? 'bg-blue-100 text-blue-800 font-semibold' : ''} ${className}`}
      onClick={() => toggleSort(field)}
      title={`Clique para ordenar por ${label}`}
    >
      <span>{label}</span>
      <span className="ml-1 w-3 h-3">
        {sortField === field ? (
          sortDirection === 'asc' ? 
            <ArrowUp className="w-3 h-3 text-blue-600" /> : 
            <ArrowDown className="w-3 h-3 text-blue-600" />
        ) : (
          <span className="text-gray-300">⋮</span>
        )}
      </span>
    </div>
  );
  
  // Função para ordenar os NVRs
  const getSortedNVRs = () => {
    // Primeiro filtramos pelo termo de pesquisa
    let filteredNVRs = nvrs;
    
    if (searchTerm.trim() !== '') {
      const searchTermLower = searchTerm.toLowerCase().trim();
      filteredNVRs = nvrs.filter(nvr => 
        nvr.name.toLowerCase().includes(searchTermLower) || 
        nvr.model.toLowerCase().includes(searchTermLower) || 
        nvr.owner.toLowerCase().includes(searchTermLower)
      );
    }
    
    // Depois ordenamos se necessário
    if (!sortField) return filteredNVRs;
    
    return [...filteredNVRs].sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      
      switch (sortField) {
        case 'name':
          return a.name.localeCompare(b.name) * direction;
        case 'model':
          return a.model.localeCompare(b.model) * direction;
        case 'owner':
          return a.owner.localeCompare(b.owner) * direction;
        case 'slots':
          return (a.slots.filter(s => s.status === 'active').length - b.slots.filter(s => s.status === 'active').length) * direction;
        case 'cameras':
          return (a.cameras - b.cameras) * direction;
        default:
          return 0;
      }
    });
  };
  
  // Obter NVRs ordenados
  const sortedNVRs = getSortedNVRs();

  const navigate = useNavigate();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciamento de NVRs</h1>
        <Button onClick={() => setIsAddingNVR(true)} className="flex items-center">
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar NVR
        </Button>
      </div>

      {/* Cartões de links para relatórios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/relatorios')}>
          <CardContent className="p-4 flex items-center">
            <div className="bg-blue-500 text-white p-3 rounded-full mr-4">
              <BarChart2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-800">Relatórios</h3>
              <p className="text-sm text-blue-600">Visão geral do sistema</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/projecoes')}>
          <CardContent className="p-4 flex items-center">
            <div className="bg-green-500 text-white p-3 rounded-full mr-4">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-green-800">Projeções</h3>
              <p className="text-sm text-green-600">Análise de tendências futuras</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/evolucao-hds')}>
          <CardContent className="p-4 flex items-center">
            <div className="bg-amber-500 text-white p-3 rounded-full mr-4">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-800">Evolução de HDs</h3>
              <p className="text-sm text-amber-600">Planejamento de armazenamento</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtro e pesquisa */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative w-full max-w-sm">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-gray-500" />
          </div>
          <form onSubmit={(e) => {
            e.preventDefault(); // Evita o recarregamento da página
          }}>
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Pesquisar"
              className="pl-10 pr-16"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearchTerm('');
                }
              }}
            />
          </form>
          {searchTerm && (
            <button
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
              onClick={() => {
                setSearchTerm('');
                // Focar no campo de pesquisa
                setTimeout(() => {
                  searchInputRef.current?.focus();
                }, 0);
              }}
              title="Limpar pesquisa"
            >
              <span className="text-xs">Limpar</span>
            </button>
          )}
        </div>
        <Button 
          variant="outline"
          className="ml-2"
          onClick={() => {
            // Esta função é principalmente para estética, já que a pesquisa é em tempo real
            // Mas pode ser útil para usuários que esperam um botão de pesquisa
          }}
          disabled={searchTerm.trim() === ''}
        >
          Enter
        </Button>
        {sortField && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setSortField(null);
              setSortDirection('asc');
              // Focar no campo de pesquisa após limpar a ordenação
              setTimeout(() => {
                searchInputRef.current?.focus();
              }, 0);
            }}
            className="ml-2"
          >
            Limpar ordenação
          </Button>
        )}
      </div>

      {searchTerm && (
        <div className="mb-4 text-sm bg-blue-50 p-2 rounded border border-blue-200 text-blue-800">
          Mostrando resultados para "<strong>{searchTerm}</strong>" 
          ({sortedNVRs.length} de {nvrs.length} NVRs)
        </div>
      )}

      {sortField && (
        <div className="mb-4 text-sm bg-blue-50 p-2 rounded border border-blue-200 text-blue-800">
          Ordenando por <strong>{
            sortField === 'name' ? 'Nome' : 
            sortField === 'model' ? 'Modelo' : 
            sortField === 'owner' ? 'Proprietário' : 
            sortField === 'slots' ? 'Slots' : 
            'Câmeras'
          }</strong> em ordem {sortDirection === 'asc' ? 'crescente' : 'decrescente'}.
          Clique no mesmo cabeçalho para inverter a ordem ou em outro para mudar o critério.
        </div>
      )}

      {/* Tabela de NVRs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="grid grid-cols-7 gap-4 p-5 bg-gray-100 font-medium text-gray-600 border-b-2 border-gray-300">
          <div className="flex justify-center">
            <SortableHeader field="owner" label="Proprietário" className="inline-flex justify-center" />
          </div>
          <div className="flex items-center pl-8">
            <SortableHeader field="name" label="Nome" className="inline-flex" />
          </div>
          <div className="flex justify-center">
            <SortableHeader field="model" label="Modelo" className="inline-flex justify-center" />
          </div>
          <div className="flex justify-center col-span-2">
            <SortableHeader field="slots" label="Slots" className="inline-flex justify-center" />
          </div>
          <div className="flex justify-center">
            <SortableHeader field="cameras" label="Câmeras" className="inline-flex justify-center" />
          </div>
          <div className="flex justify-center">
            <span>Ações</span>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {sortedNVRs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm ? (
                <div>
                  <p className="text-lg font-medium">Sem resultados!</p>
                  <p className="text-sm">Não foram encontrados valores correspondentes à pesquisa "{searchTerm}"</p>
                  <p className="text-sm mt-2">Tente pesquisar por um nome, modelo ou proprietário diferente.</p>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={() => {
                      setSearchTerm('');
                      // Focar no campo de pesquisa
                      setTimeout(() => {
                        searchInputRef.current?.focus();
                      }, 0);
                    }}
                    className="mt-9"
                  >
                    Limpar pesquisa
                  </Button>
                </div>
              ) : (
                <p className="text-lg font-medium">Nenhum NVR cadastrado</p>
              )}
            </div>
          ) : (
            sortedNVRs.map((nvr, index) => {
              // Verificar se este NVR deve ser destacado
              const isHighlighted = nvr.id === highlightedNVRId;
              
              return (
                <div 
                  key={nvr.id} 
                  id={`nvr-${nvr.id}`}
                  className={`grid grid-cols-7 gap-6 py-7 px-4 items-center text-sm 
                    ${isHighlighted 
                      ? 'bg-yellow-100 border-2 border-yellow-500 shadow-lg -mx-1 my-1 animate-pulse' 
                      : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} 
                    ${isHighlighted ? '' : 'hover:bg-blue-50'} 
                    transition-colors duration-150 relative`}
                >
                  {isHighlighted && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-3 py-1 rounded-t-md shadow-md text-xs font-bold">
                      NVR em destaque
                    </div>
                  )}
                  <div className="flex justify-center">
                    <div className="px-3 py-2 rounded-md" style={{ 
                      backgroundColor: `${getOwnerColor(nvr.owner)}30`,
                      color: getOwnerColor(nvr.owner),
                      border: `1px solid ${getOwnerColor(nvr.owner)}` 
                    }}>
                      {nvr.owner}
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2 justify-center">
                    <div className="font-medium">{nvr.name}</div>
                    <div className="flex items-center text-gray-500 text-sm">
                      <Server className="w-3 h-3 mr-1" />
                      {nvr.model}
                    </div>
                  </div>
                  <div className="flex justify-center col-span-2">
                    <div>
                      <div className="flex flex-wrap gap-3 justify-center items-center py-2 max-w-[200px]">
                        {nvr.slots.map((slot) => (
                          <div
                            key={slot.id}
                            onClick={() => setSelectedSlot({
                              nvrId: nvr.id,
                              slotId: slot.id,
                              hdSize: slot.hdSize,
                              status: slot.status
                            })}
                            className={`w-9 h-9 rounded-full cursor-pointer ${getHDSizeColor(slot.hdSize, slot.status)} flex items-center justify-center shadow-sm hover:shadow-md hover:scale-110 transition-all ${
                              isHighlighted ? 'ring-2 ring-yellow-500' : ''
                            }`}
                            title={`${slot.status === 'empty' ? 'Slot vazio' : `HD de ${slot.hdSize}TB - ${slot.status === 'active' ? 'Ativo' : 'Inativo'}`}`}
                          >
                            {slot.status !== 'empty' && slot.hdSize && (
                              <span className="text-white text-sm font-bold">
                                {slot.hdSize}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <button
                      onClick={() => setSelectedCamera({ nvrId: nvr.id, cameras: nvr.cameras })}
                      className="flex items-center justify-center gap-5 hover:bg-gray-100 p-3 rounded-md"
                      title="Clique para editar câmeras"
                    >
                      <Camera className="w-8 h-8 text-blue-500" />
                      <span className="font-medium text-base">{nvr.cameras}</span>
                    </button>
                  </div>
                  <div className="flex justify-center">
                    <div className="flex gap-5">
                      <Button
                        variant="ghost"
                        size="lg"
                        onClick={() => setEditingNVR(nvr)}
                        title="Editar NVR"
                        className="p-3 hover:bg-blue-50"
                      >
                        <Edit className="h-7 w-7 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="lg"
                        onClick={() => setDeleteConfirm({ id: nvr.id, name: nvr.name })}
                        title="Excluir NVR"
                        className="p-3 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash className="h-7 w-7" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Formulário de adição de NVR */}
      {isAddingNVR && (
        <NVRForm
          isOpen={isAddingNVR}
          onClose={() => setIsAddingNVR(false)}
        />
      )}
      
      {/* Formulário de edição de NVR */}
      {editingNVR && (
        <NVRForm
          isOpen={!!editingNVR}
          onClose={() => setEditingNVR(undefined)}
          editingNVR={editingNVR}
        />
      )}
      
      {/* Formulário de configuração de slot */}
      {selectedSlot && (
        <SlotForm
          isOpen={!!selectedSlot}
          onClose={() => setSelectedSlot(null)}
          nvrId={selectedSlot.nvrId}
          slotId={selectedSlot.slotId}
          currentHDSize={selectedSlot.hdSize}
          currentStatus={selectedSlot.status}
          nvrModel={nvrs.find(nvr => nvr.id === selectedSlot.nvrId)?.model || ''}
        />
      )}
      
      {/* Formulário de atualização de câmeras */}
      {selectedCamera && (
        <CameraForm
          isOpen={!!selectedCamera}
          onClose={() => setSelectedCamera(null)}
          nvrId={selectedCamera.nvrId}
          currentCameras={selectedCamera.cameras}
        />
      )}
      
      {/* Diálogo de confirmação de exclusão */}
      {deleteConfirm && (
        <ConfirmDialog
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => {
            deleteNVR(deleteConfirm.id);
            setDeleteConfirm(null);
          }}
          title="Confirmar exclusão"
          description={`Tem certeza que deseja excluir o NVR "${deleteConfirm.name}"? Esta ação não pode ser desfeita.`}
          confirmText="Excluir"
          cancelText="Cancelar"
        />
      )}
    </div>
  );
};

export default NVRList;
