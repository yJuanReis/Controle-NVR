
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NVR } from '@/types';
import { useNVR } from '@/context/NVRContext';

interface NVRFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingNVR?: NVR;
}

const NVRForm: React.FC<NVRFormProps> = ({ isOpen, onClose, editingNVR }) => {
  const { addNVR, updateNVR } = useNVR();
  const [formData, setFormData] = useState({
    name: editingNVR?.name || '',
    model: editingNVR?.model || '',
    owner: editingNVR?.owner || '',
    cameras: editingNVR?.cameras || 0,
    slots: editingNVR?.slots.length || 4,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'cameras' || name === 'slots' ? parseInt(value) || 0 : value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingNVR) {
      // Atualizando NVR existente
      updateNVR(editingNVR.id, {
        name: formData.name,
        model: formData.model,
        owner: formData.owner,
        cameras: formData.cameras,
      });
    } else {
      // Criando novo NVR
      const slots = Array.from({ length: formData.slots }, (_, index) => ({
        id: `new-${Date.now()}-${index}`,
        nvrId: 'temp',
        status: 'empty' as const,
      }));
      
      addNVR({
        name: formData.name,
        model: formData.model,
        owner: formData.owner,
        cameras: formData.cameras,
        slots,
      });
    }
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingNVR ? 'Editar NVR' : 'Adicionar Novo NVR'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="model" className="text-right">
                Modelo
              </Label>
              <Input
                id="model"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="owner" className="text-right">
                Proprietário
              </Label>
              <Input
                id="owner"
                name="owner"
                value={formData.owner}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cameras" className="text-right">
                Câmeras
              </Label>
              <Input
                id="cameras"
                name="cameras"
                type="number"
                min="0"
                value={formData.cameras}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            {!editingNVR && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="slots" className="text-right">
                  Slots
                </Label>
                <Input
                  id="slots"
                  name="slots"
                  type="number"
                  min="1"
                  max="16"
                  value={formData.slots}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">{editingNVR ? 'Atualizar' : 'Adicionar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NVRForm;
