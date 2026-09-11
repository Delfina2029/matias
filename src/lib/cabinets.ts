import type { Cabinet } from './types';
import { Archive, Container, Microwave, Pentagon, Square } from 'lucide-react';
import { 
    Base1DoorIcon,
    Base2DoorsIcon,
    Base2DrawersIcon,
    Base3DrawersIcon,
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

const bajoMesadaCabinets: Cabinet[] = [
  {
    id: 'base-spice',
    name: 'Bajo Mesada Especiero',
    type: 'base',
    description: 'Bajo mesada especiero extraíble',
    icon: Base1DoorIcon,
    width: 200,
    height: 810,
    depth: 580,
    pieces: [],
    defaultComponents: [
      { type: 'opening', height: 810 }
    ],
    imageUrl: '/base-1p.png'
  },
  {
    id: 'base-1p',
    name: 'Bajo Mesada 1 Puerta',
    type: 'base',
    icon: Base1DoorIcon,
    width: 400,
    height: 810,
    depth: 580,
    pieces: [],
    defaultComponents: [
      { type: 'door', height: 810 }
    ],
    imageUrl: '/base-1p.png'
  },
  {
    id: 'base-2p',
    name: 'Bajo Mesada 2 Puertas',
    type: 'base',
    description: 'Bajo mesada con dos puertas',
    icon: Base2DoorsIcon,
    width: 800,
    height: 810,
    depth: 580,
    pieces: [],
    defaultComponents: [
      { type: 'door', height: 810, numDoors: 2 }
    ],
    imageUrl: '/base-2p.png'
  },
  {
    id: 'base-2c',
    name: 'Bajo Mesada 2 Cajones (Ollero)',
    type: 'base',
    description: 'Bajo mesada 2 cajones (Ollero)',
    icon: Base2DrawersIcon,
    width: 600,
    height: 810,
    depth: 580,
    pieces: [],
    defaultComponents: [
      { type: 'drawer', height: 405, drawerBoxHeight: 200 },
      { type: 'drawer', height: 405, drawerBoxHeight: 200 }
    ],
    imageUrl: '/base-2c.png'
  },
  {
    id: 'base-3c',
    name: 'Bajo Mesada 3 Cajones',
    type: 'base',
    icon: Base3DrawersIcon,
    width: 600,
    height: 810,
    depth: 580,
    pieces: [],
    defaultComponents: [
      { type: 'drawer', height: 305, drawerBoxHeight: 150 }, // Bottom
      { type: 'drawer', height: 305, drawerBoxHeight: 150 }, // Middle
      { type: 'drawer', height: 200, drawerBoxHeight: 100 }  // Top
    ],
    imageUrl: '/base-3c.png'
  },
  {
    id: 'base-corner',
    name: 'Bajo Mesada en L',
    type: 'base',
    icon: Pentagon,
    width: 900,
    width2: 900,
    height: 810,
    depth: 600,
    depth2: 600,
    pieces: [],
    defaultComponents: [
      { type: 'door', height: 810, numDoors: 2 }
    ],
    imageUrl: '/base-corner.png'
  },
  {
    id: 'base-blind-corner',
    name: 'Bajo Mesada Esquinero Recto (Ciego)',
    type: 'base',
    icon: Base1DoorIcon,
    width: 990,
    height: 810,
    depth: 580,
    pieces: [],
    defaultComponents: [
      { type: 'door', height: 810 }
    ],
    notes: 'Mueble rectangular con una sección ciega para rincón.',
    imageUrl: '/base-blind-corner.png'
  },
  {
    id: 'base-nicho',
    name: 'Nicho Abierto',
    type: 'base',
    icon: Square,
    width: 600,
    height: 810,
    depth: 580,
    pieces: [],
    defaultComponents: [],
    imageUrl: '/base-1p.png'
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
    imageUrl: '/wall.png'
  },
  {
    id: 'wall-cube',
    name: 'Cubo Abierto',
    type: 'wall',
    icon: Square,
    width: 400,
    height: 400,
    depth: 320,
    pieces: [],
    defaultComponents: [],
    imageUrl: '/wall.png'
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
    ],
    imageUrl: '/wall-microwave.png'
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
    ],
    imageUrl: '/tall.png'
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
        { type: 'opening', height: 230 },
        { type: 'drawer', height: 230 },
      ],
      imageUrl: '/vanity-hanging-1d1o.png'
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
        { type: 'drawer', height: 230 },
        { type: 'drawer', height: 230 },
      ],
      imageUrl: '/vanity-hanging-2d.png'
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
      imageUrl: '/vanity-hanging-2p.png'
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
      imageUrl: '/vanity-hanging-2p.png'
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
      ],
      imageUrl: '/vanity-patas-1d1o.png'
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
      ],
      imageUrl: '/vanity-patas-3d.png'
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
      ],
      imageUrl: '/vanity-patas-1d2p.png'
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
      ],
      imageUrl: '/vanity-patas-2p.png'
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
      ],
      imageUrl: '/vanity-patas-2p.png'
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
        ],
        imageUrl: '/tall.png'
    },
];

export const cabinetCategories = [
    { name: "Bajo Mesada", cabinets: bajoMesadaCabinets },
    { name: "Alacenas", cabinets: alacenaCabinets },
    { name: "Columnas", cabinets: columnaCabinets },
    { name: "Vanitory", cabinets: vanitoryCabinets },
    { name: "Interior de Placar", cabinets: placarCabinets },
];

export const cabinetData: Cabinet[] = cabinetCategories.flatMap(category => category.cabinets);
