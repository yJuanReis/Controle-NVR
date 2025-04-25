import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Retorna a cor específica para cada proprietário
 * @param owner Nome do proprietário
 * @returns Código de cor hexadecimal
 */
export function getOwnerColor(owner: string) {
  switch(owner) {
    case 'BR Marinas':
      return '#3200fa'; // Cor azul para BR Marinas
    case 'Tele Litorânea':
      return '#fca103'; // Cor laranja para Tele Litorânea
    default:
      return 'inherit';
  }
}
