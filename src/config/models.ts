export interface ModelConfig {
  id: string;
  path: string;
  position: [number, number, number];
  scale: number;
  rotation?: [number, number, number];
  scrollBehavior: 'rotate' | 'parallax' | 'none';
}

export const models: ModelConfig[] = [
  {
    id: 'spider-man',
    path: '/models/spider-man_symbiote.glb',
    position: [0, -1, 0],
    scale: 2,
    scrollBehavior: 'rotate',
  },
  {
    id: 'manhattan',
    path: '/models/manhattan.glb',
    position: [0, -20, -80],
    scale: 5,
    scrollBehavior: 'parallax',
  },
];
