import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNVR } from '@/context/NVRContext';

interface CameraFormProps {
  isOpen: boolean;
  onClose: () => void;
  nvrId: string;
  currentCameras: number;
}

const CameraForm: React.FC<CameraFormProps> = ({ isOpen, onClose, nvrId, currentCameras }) => {
  const { updateCameras } = useNVR();
  const [cameras, setCameras] = useState(currentCameras || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCameras(nvrId, typeof cameras === 'string' ? 0 : cameras);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Atualizar Câmeras</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cameras" className="text-right">
                Câmeras
              </Label>
              <Input
                id="cameras"
                type="number"
                min="0"
                value={cameras}
                onChange={(e) => setCameras(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="col-span-3"
                required
              />
            </div>
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

export default CameraForm;
