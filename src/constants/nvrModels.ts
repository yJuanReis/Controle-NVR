interface NVRModelConfig {
  slots: number;
  maxCameras: number;
}

export const NVR_MODELS: Record<string, NVRModelConfig> = {
  "INVD 1016": {
    slots: 1,
    maxCameras: 16
  },
  "INVD 5232": {
    slots: 8,
    maxCameras: 32
  },
  "NVD 3332": {
    slots: 4,
    maxCameras: 32
  },
  "INVD 5132": {
    slots: 4,
    maxCameras: 32
  },
  "NVD 1432": {
    slots: 2,
    maxCameras: 32
  },
  "NVD 1232": {
    slots: 2,
    maxCameras: 32
  },
  "MHDX 3116": {
    slots: 1,
    maxCameras: 16
  }
}; 