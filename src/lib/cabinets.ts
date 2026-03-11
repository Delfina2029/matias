import type { Cabinet } from './types';
import { Archive, Container, Microwave, Pentagon } from 'lucide-react';
import { 
    BaseCabinetIcon,
    PlacarModuleIcon,
    Vanitory2PuertasIcon,
    VanitoryHanging1D1OIcon,
    VanitoryHanging2DIcon,
    VanitoryPatas1D2PIcon,
    VanitoryPatas2PIcon,
    VanitoryPatas3DIcon 
} from './icons';


const MELAMINE_THICKNESS = 18;
const MELAMINE_MATERIAL = 'Melamina 18mm';
const BACK_PANEL_MATERIAL = 'MDF 3mm';

// Define cabinets for each category
const bajoMesadaCabinets: Cabinet[] = [
  {
    id: 'base',
    name: 'Mueble Base',
    type: 'base',
    icon: BaseCabinetIcon,
    width: 600,
    height: 720,
    depth: 580,
    pieces: [], // Pieces are generated dynamically
  },
  {
    id: 'base-corner',
    name: 'Esquinero Asimétrico',
    type: 'base',
    icon: Pentagon,
    width: 900,
    height: 720,
    depth: 600,
    depth2: 600,
    pieces: [],
  },
];

const alacenaCabinets: Cabinet[] = [
  {
    id: 'wall',
    name: 'Alacena',
    type: 'wall',
    icon: Archive,
    width: 600,
    height: 600,
    depth: 320,
    pieces: [],
  },
  {
    id: 'wall-microwave',
    name: 'Porta Microondas',
    type: 'wall',
    icon: Microwave,
    width: 600,
    height: 800,
    depth: 400,
    pieces: [],
    defaultComponents: [
      { type: 'opening', height: 400 },
      { type: 'door', height: 400, hinge: 'top' },
    ]
  },
];

const columnaCabinets: Cabinet[] = [
  {
    id: 'tall',
    name: 'Columna',
    type: 'tall',
    icon: Container,
    width: 600,
    height: 2000,
    depth: 580,
    pieces: [],
    defaultComponents: [
        { type: 'door', height: 1250 },
        { type: 'door', height: 750 },
    ]
  },
];

const vanitoryCabinets: Cabinet[] = [
    // Colgantes
    {
      id: 'vanity-hanging-1d1o',
      name: 'Vanitory Colgante (1 Cajón, 1 Hueco)',
      type: 'base',
      icon: VanitoryHanging1D1OIcon,
      width: 600,
      height: 460,
      depth: 460,
      pieces: [],
      defaultComponents: [
        { type: 'opening', height: 260 },
        { type: 'drawer', height: 170 },
      ]
    },
    {
      id: 'vanity-hanging-2d',
      name: 'Vanitory Colgante (2 Cajones)',
      type: 'base',
      icon: VanitoryHanging2DIcon,
      width: 600,
      height: 460,
      depth: 460,
      pieces: [],
      defaultComponents: [
        { type: 'drawer', height: 170 },
        { type: 'drawer', height: 170 },
        { type: 'opening', height: 120 },
      ],
    },
    {
      id: 'vanity-hanging-2p',
      name: 'Vanitory Colgante (2 Puertas)',
      type: 'base',
      icon: Vanitory2PuertasIcon,
      width: 600,
      height: 460,
      depth: 460,
      pieces: [],
      defaultComponents: [
        { type: 'door', height: 404 },
        { type: 'opening', height: 56 },
      ],
    },
    {
      id: 'vanity-hanging-800-2p',
      name: 'Vanitory Colgante 800mm (2 Puertas)',
      type: 'base',
      icon: Vanitory2PuertasIcon,
      width: 800,
      height: 460,
      depth: 460,
      pieces: [],
      defaultComponents: [
        { type: 'door', height: 404 },
        { type: 'opening', height: 56 },
      ],
    },
    // De Pie
    {
      id: 'vanity-patas-1d1o',
      name: 'Vanitory Patas (1 Cajón, 1 Hueco)',
      type: 'base',
      icon: VanitoryHanging1D1OIcon,
      width: 600,
      height: 840,
      depth: 460,
      pieces: [],
      defaultComponents: [
        { type: 'opening', height: 400 },
        { type: 'drawer', height: 340 },
      ]
    },
    {
      id: 'vanity-patas-3d',
      name: 'Vanitory Patas (3 Cajones)',
      type: 'base',
      icon: VanitoryPatas3DIcon,
      width: 600,
      height: 840,
      depth: 460,
      pieces: [],
      defaultComponents: [
        { type: 'drawer', height: 246 },
        { type: 'drawer', height: 246 },
        { type: 'drawer', height: 246 },
      ]
    },
    {
      id: 'vanity-patas-1d2p',
      name: 'Vanitory Patas (1 Cajón, 2 Puertas)',
      type: 'base',
      icon: VanitoryPatas1D2PIcon,
      width: 600,
      height: 840,
      depth: 460,
      pieces: [],
      defaultComponents: [
        { type: 'door', height: 540 },
        { type: 'drawer', height: 200 },
      ]
    },
    {
      id: 'vanity-patas-2p',
      name: 'Vanitory Patas (2 Puertas)',
      type: 'base',
      icon: VanitoryPatas2PIcon,
      width: 600,
      height: 840,
      depth: 460,
      pieces: [],
      defaultComponents: [
        { type: 'door', height: 684 },
        { type: 'opening', height: 56 },
      ]
    },
    {
      id: 'vanity-patas-800-2p',
      name: 'Vanitory 800mm Patas (2 Puertas)',
      type: 'base',
      icon: VanitoryPatas2PIcon,
      width: 800,
      height: 840,
      depth: 460,
      pieces: [],
      defaultComponents: [
        { type: 'door', height: 684 },
        { type: 'opening', height: 56 },
      ]
    },
];

const placarCabinets: Cabinet[] = [
    {
        id: 'placar-module',
        name: 'Módulo Placar',
        type: 'placar',
        icon: PlacarModuleIcon,
        width: 800,
        height: 1800,
        depth: 500,
        pieces: [], // Will be generated by logic
        defaultComponents: [
            { type: 'opening', height: 1800 - MELAMINE_THICKNESS * 2 },
        ]
    },
];

export const cabinetCategories = [
    { name: "Bajo Mesada", cabinets: bajoMesadaCabinets },
    { name: "Alacenas", cabinets: alacenaCabinets },
    { name: "Columnas", cabinets: columnaCabinets },
    { name: "Vanitory", cabinets: vanitoryCabinets },
    { name: "Interior de Placar", cabinets: placarCabinets },
];

// Flattened list for compatibility with other parts of the app
export const cabinetData: Cabinet[] = cabinetCategories.flatMap(category => category.cabinets);
