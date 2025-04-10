
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNVR } from '@/context/NVRContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SlotFormProps {
  isOpen: boolean;
  onClose: () => void;
  nvrId: string;
  slotId: string;
  currentHDSize?: number;
  currentStatus: "active" | "inactive" | "empty";
}

const SlotForm: React.FC<SlotFormProps> = ({ 
  isOpen, 
  onClose, 
  nvrId, 
  slotId, 
  currentHDSize, 
  currentStatus 
}) => {
  const { updateSlot } = useNVR();
  const [formData, setFormData] = useState({
    hdSize: currentHDSize || 0,
    status: currentStatus || "empty",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const hdSize = formData.status === "empty" ? undefined : formData.hdSize;
    updateSlot(nvrId, slotId, hdSize, formData.status);
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configurar Slot</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({
                  ...formData,
                  status: value as "active" | "inactive" | "empty"
                })}
              >
                <SelectTrigger id="status" className="col-span-3">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="empty">Vazio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {formData.status !== "empty" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="hdSize" className="text-right">
                  Tamanho (TB)
                </Label>
                <Input
                  id="hdSize"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.hdSize}
                  onChange={(e) => setFormData({
                    ...formData,
                    hdSize: parseInt(e.target.value) || 0
                  })}
                  className="col-span-3"
                  required={formData.status !== "empty"}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SlotForm;
