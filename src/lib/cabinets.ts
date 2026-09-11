import type { Cabinet } from './types';
import { Archive, Container, Microwave, Pentagon } from 'lucide-react';
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
    id: 'base-1p',
    name: 'Bajo Mesada 1 Puerta',
    type: 'base',
    icon: Base1DoorIcon,
    width: 400,
    height: 810,
    depth: 580,
    pieces: [],
    defaultComponents: [
      // bajo001 - L-shape top reinforcement and 50mm top gap for door
      { type: 'door', height: 810 }
    ]
  },
  {
    id: 'base-2p',
    name: 'bajo002',
    type: 'base',
    description: 'Bajo mesada con dos puertas',
    icon: Base2DoorsIcon,
    width: 800,
    height: 810,
    depth: 580,
    pieces: [],
    defaultComponents: [
      { type: 'door', height: 810, numDoors: 2 }
    ]
  },
  {
    id: 'base-2c',
    name: 'bajo003',
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
    ]
  },
  {
    id: 'base-3c',
    name: 'bajo004',
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
    ]
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
    ]
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
    notes: 'Mueble rectangular con una sección ciega para rincón.'
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
        { type: 'opening', height: 230 },
        { type: 'drawer', height: 230 },
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
        { type: 'drawer', height: 230 },
        { type: 'drawer', height: 230 },
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
        { type: 'door', height: 460, numDoors: 2 }
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
        // vany004 - PERFECTO NO MODIFICAR
        { type: 'opening', height: 493.34 }, // Bottom opening
        { type: 'drawer', height: 246.66 },  // Top drawer matching hanging vanity size exactly
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
        { type: 'drawer', height: 246.66 },
        { type: 'drawer', height: 246.67 },
        { type: 'drawer', height: 246.67 },
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
        // vany006 - PERFECTO NO MODIFICAR
        { type: 'door', height: 493.34, numDoors: 2 },
        { type: 'drawer', height: 246.66 },
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
        { type: 'door', height: 740, numDoors: 2 }
      ]
    }
];

const placarCabinets: Cabinet[] = [
    {
        id: 'PLR001',
        name: 'Interior de Placard (PLR001)',
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

export const cabinetData: Cabinet[] = cabinetCategories.flatMap(category => category.cabinets);
