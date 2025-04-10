
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNVR } from '@/context/NVRContext';
import { Database, Edit, Trash2, HardDrive, Camera } from 'lucide-react';
import NVRForm from '@/components/NVRForm';
import SlotForm from '@/components/SlotForm';
import CameraForm from '@/components/CameraForm';
import ConfirmDialog from '@/components/ConfirmDialog';
import { NVR } from '@/types';

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

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lista de NVRs</h1>
        <Button onClick={() => setIsAddingNVR(true)}>
          <span className="mr-2">+</span>
          Novo NVR
        </Button>
      </div>

      {/* Tabela de NVRs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-7 gap-4 p-4 bg-gray-100 font-medium text-gray-600">
          <div>Nome do NVR</div>
          <div>Modelo</div>
          <div>Proprietário</div>
          <div className="text-center">Slots</div>
          <div className="text-center">Câmeras</div>
          <div className="text-center">HDs Instalados</div>
          <div className="text-center">Ações</div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {nvrs.map((nvr) => {
            const activeSlots = nvr.slots.filter(slot => slot.status === 'active').length;
            const totalSlots = nvr.slots.length;
            const hdInfo = nvr.slots
              .filter(slot => slot.hdSize && slot.status === 'active')
              .map(slot => `Slot ${nvr.slots.indexOf(slot) + 1}: ${slot.hdSize}TB`);
            
            return (
              <div key={nvr.id} className="grid grid-cols-7 gap-4 p-4 items-center text-sm">
                <div className="flex items-center">
                  <Database className="w-5 h-5 mr-2 text-blue-500" />
                  <span>{nvr.name}</span>
                </div>
                <div>{nvr.model}</div>
                <div>{nvr.owner}</div>
                <div className="text-center">
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => {
                        // Abrir um diálogo mostrando todos os slots
                        console.log("Ver todos os slots de", nvr.name);
                      }}
                      className="p-1 hover:bg-gray-100 rounded-md"
                      title="Clique para gerenciar slots"
                    >
                      <span className="text-sm font-medium">
                        {activeSlots} / {totalSlots}
                      </span>
                    </button>
                  </div>
                  <div className="flex gap-1 justify-center mt-2">
                    {nvr.slots.map((slot) => (
                      <div
                        key={slot.id}
                        onClick={() => setSelectedSlot({
                          nvrId: nvr.id,
                          slotId: slot.id,
                          hdSize: slot.hdSize,
                          status: slot.status
                        })}
                        className={`w-3 h-3 rounded-full cursor-pointer ${getSlotStatusColor(slot.status)}`}
                        title={`${slot.status === 'empty' ? 'Slot vazio' : `HD de ${slot.hdSize}TB - ${slot.status === 'active' ? 'Ativo' : 'Inativo'}`}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="text-center">
                  <button
                    onClick={() => setSelectedCamera({ nvrId: nvr.id, cameras: nvr.cameras })}
                    className="flex items-center justify-center gap-2 hover:bg-gray-100 p-1 rounded-md mx-auto"
                    title="Clique para editar câmeras"
                  >
                    <Camera className="w-4 h-4 text-blue-500" />
                    <span>{nvr.cameras}</span>
                  </button>
                </div>
                <div className="text-center">
                  {hdInfo.length > 0 ? (
                    <div className="tooltip-container">
                      <HardDrive className="w-4 h-4 text-green-500 mx-auto" />
                      <span className="ml-1 text-sm">{hdInfo.length}</span>
                      <div className="tooltip-text">
                        {hdInfo.join(', ')}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400">Nenhum</span>
                  )}
                </div>
                <div className="flex justify-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingNVR(nvr)}
                    title="Editar NVR"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteConfirm({ id: nvr.id, name: nvr.name })}
                    title="Excluir NVR"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
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
