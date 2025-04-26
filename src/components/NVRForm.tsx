import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NVR } from '@/types';
import { useNVR } from '@/context/NVRContext';
import { NVR_MODELS } from '@/constants/nvrModels';
import { toast } from '@/components/ui/use-toast';
import { getOwnerColor } from '@/lib/utils';

interface NVRFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingNVR?: NVR;
}

// Definir as opções de proprietário
const OWNER_OPTIONS = ["BR Marinas", "Tele Litorânea"];

// Definir as opções de marina
const MARINA_OPTIONS = [
  "Boa Vista", 
  "Buzios", 
  "Gloria", 
  "JL Bracuhy", 
  "Refugio Paraty", 
  "Piratas", 
  "Ribeira", 
  "Verolme", 
  "Itacuruça", 
  "Piccola"
];

const NVRForm: React.FC<NVRFormProps> = ({ isOpen, onClose, editingNVR }) => {
  const { addNVR, updateNVR } = useNVR();
  const [formData, setFormData] = useState({
    name: editingNVR?.name || '',
    model: editingNVR?.model || '',
    // Inicializar owner com a primeira opção ou a existente
    owner: editingNVR?.owner || OWNER_OPTIONS[0],
    marina: editingNVR?.marina || MARINA_OPTIONS[0],
    cameras: editingNVR?.cameras || '',
    notes: editingNVR?.notes || '',
  });

  // Atualiza o número máximo de câmeras com base no modelo selecionado
  const selectedModelConfig = formData.model ? NVR_MODELS[formData.model] : undefined;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      // Não precisamos mais tratar owner aqui, pois terá seu próprio handler
      [name]: name === 'cameras' ? (value === '' ? '' : parseInt(value) || 0) : value, 
    });
  };

  const handleModelChange = (value: string) => {
    setFormData({
      ...formData,
      model: value,
      // Opcional: Resetar câmeras se o modelo muda? 
      // cameras: '', 
    });
  };

  // Nova função para lidar com a mudança do Select de Proprietário
  const handleOwnerChange = (value: string) => {
    setFormData({
      ...formData,
      owner: value,
    });
  };

  // Nova função para lidar com a mudança do Select de Marina
  const handleMarinaChange = (value: string) => {
    setFormData({
      ...formData,
      marina: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação extra: garantir que um proprietário foi selecionado
    if (!formData.owner) {
      toast({
        title: "Erro de Validação",
        description: "Por favor, selecione um proprietário.",
        variant: "destructive",
      });
      return; 
    }

    // Validação do número de câmeras com base no modelo
    if (formData.model && formData.cameras) {
      const modelConfig = NVR_MODELS[formData.model];
      const cameraCount = typeof formData.cameras === 'string' ? parseInt(formData.cameras) : formData.cameras;
      
      if (modelConfig && cameraCount > modelConfig.maxCameras) {
        toast({
          title: "Erro de Validação",
          description: `O modelo ${formData.model} suporta no máximo ${modelConfig.maxCameras} câmeras.`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const nvrData = {
        name: formData.name,
        model: formData.model,
        owner: formData.owner, // Usar o valor do estado
        marina: formData.marina, // Adicionar marina aos dados
        cameras: typeof formData.cameras === 'string' ? parseInt(formData.cameras) || 0 : formData.cameras,
        notes: formData.notes,
      };

      if (editingNVR) {
        updateNVR(editingNVR.id, nvrData);
      } else {
        const modelConfig = NVR_MODELS[formData.model];
        if (!modelConfig) { // Validação: Modelo selecionado existe?
           toast({ title: "Erro", description: "Modelo de NVR inválido.", variant: "destructive" });
           return;
        }
        const slots = Array.from({ length: modelConfig.slots }, (_, index) => ({
          id: `new-${Date.now()}-${index}`,
          nvrId: 'temp',
          status: 'empty' as const,
        }));
        addNVR({ ...nvrData, slots });
      }
      
      onClose();
    } catch (error) {
      console.error("Erro ao salvar NVR:", error);
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar as informações do NVR. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] text-base w-[95%] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl md:text-2xl">{editingNVR ? 'Editar NVR' : 'Novo NVR'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
              <Label htmlFor="marina" className="md:text-right text-sm md:text-base">
                Marina <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.marina}
                onValueChange={handleMarinaChange}
                required
              >
                <SelectTrigger 
                  id="marina" 
                  className="col-span-1 md:col-span-3"
                >
                  <SelectValue placeholder="Selecione a marina" />
                </SelectTrigger>
                <SelectContent>
                  {MARINA_OPTIONS.map((marina) => (
                    <SelectItem 
                      key={marina} 
                      value={marina}
                      className="text-sm md:text-base"
                    >
                      {marina}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
              <Label htmlFor="name" className="md:text-right text-sm md:text-base">
                Numeração <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-1 md:col-span-3 text-sm md:text-base"
                placeholder="Ex: 01, 02, etc."
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
              <Label htmlFor="model" className="md:text-right text-sm md:text-base">
                Modelo <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.model}
                onValueChange={handleModelChange}
                required
              >
                <SelectTrigger id="model" className="col-span-1 md:col-span-3">
                  <SelectValue placeholder="Selecione o modelo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(NVR_MODELS).map((modelKey) => {
                     const model = NVR_MODELS[modelKey];
                     if (!model) return null;
                     return (
                       <SelectItem key={modelKey} value={modelKey} className="text-sm md:text-base">
                         <div className="flex items-center">
                           <span>{modelKey}</span>
                           <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-xs">
                             {model.slots} slots
                           </span>
                         </div>
                       </SelectItem>
                     );
                   })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
              <Label htmlFor="owner" className="md:text-right text-sm md:text-base">
                Proprietário <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.owner}
                onValueChange={handleOwnerChange}
                required
              >
                <SelectTrigger 
                  id="owner" 
                  className="col-span-1 md:col-span-3"
                  style={{ 
                    color: getOwnerColor(formData.owner),
                    fontWeight: 'bold',
                    borderColor: getOwnerColor(formData.owner),
                    borderWidth: '2px'
                  }}
                >
                  <SelectValue placeholder="Selecione o proprietário" /> 
                </SelectTrigger>
                <SelectContent>
                  {OWNER_OPTIONS.map((owner) => (
                    <SelectItem 
                      key={owner} 
                      value={owner}
                      className="text-sm md:text-base"
                      style={{ color: getOwnerColor(owner), fontWeight: 'bold' }}
                    >
                      {owner}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
              <Label htmlFor="cameras" className="md:text-right text-sm md:text-base">
                Câmeras
              </Label>
              <Input
                id="cameras"
                name="cameras"
                type="number"
                value={formData.cameras}
                onChange={handleInputChange}
                className="col-span-1 md:col-span-3 text-sm md:text-base"
                placeholder="Número de câmeras"
                min="0"
                max={selectedModelConfig?.maxCameras}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
              <Label htmlFor="notes" className="md:text-right text-sm md:text-base">
                Observações
              </Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="col-span-1 md:col-span-3 min-h-[100px] text-sm md:text-base"
                placeholder="Observações adicionais..."
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto text-sm md:text-base"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto text-sm md:text-base"
            >
              {editingNVR ? 'Salvar Alterações' : 'Adicionar NVR'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NVRForm;
