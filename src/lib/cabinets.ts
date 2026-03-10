import React from 'react';
import type { Cabinet } from './types';
import type { LucideIcon } from 'lucide-react';
import { Box, Archive, Container, Pentagon, Microwave } from 'lucide-react';

const PlacarIcon: LucideIcon = (props) => {
    return React.createElement('svg', {
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.5",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      ...props
    },
      React.createElement('rect', { x: "3", y: "3", width: "18", height: "18", rx: "1" }),
      React.createElement('path', { d: "M3 9h18" }),
      React.createElement('path', { d: "M3 15h18" }),
      React.createElement('path', { d: "M9 3v18" })
    );
};

const VanitoryPatasIcon: LucideIcon = (props) => {
    return React.createElement('svg', {
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.5",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      ...props
    },
      React.createElement('path', { d: "M4 21V9a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v12" }),
      React.createElement('path', { d: "M4 21v-2" }),
      React.createElement('path', { d: "M20 21v-2" }),
      React.createElement('path', { d: "M4 13h16" }),
      React.createElement('path', { d: "M12.5 13v-5" }),
      React.createElement('rect', { x: "5", y: "4", width: "14", height: "4", rx: "1" })
    );
};
  
const Vanitory3DrawersIcon: LucideIcon = (props) => {
    return React.createElement('svg', {
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "1.5",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        ...props
    },
        React.createElement('path', { d: "M4 21V9a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v12" }),
        React.createElement('path', { d: "M4 21v-2" }),
        React.createElement('path', { d: "M20 21v-2" }),
        React.createElement('path', { d: "M4 14h16" }),
        React.createElement('path', { d: "M4 8h16" }),
        React.createElement('path', { d: "M12.5 8V4" }),
        React.createElement('path', { d: "M12.5 14v-6" }),
        React.createElement('path', { d: "M12.5 21v-7" })
    );
};
  
const VanitoryHangingIcon: LucideIcon = (props) => {
    return React.createElement('svg', {
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "1.5",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        ...props
    },
        React.createElement('rect', { x: "3", y: "3", width: "18", height: "12", rx: "1" }),
        React.createElement('path', { d: "M4 10h16" }),
        React.createElement('path', { d: "M9 10v-6" }),
        React.createElement('path', { d: "M15 10v-6" }),
        React.createElement('rect', { x: "4", y: "4", width: "16", height: "6", rx: "0.5" })
    );
};


const MELAMINE_THICKNESS = 18;
const MELAMINE_MATERIAL = 'Melamina 18mm';
const BACK_PANEL_MATERIAL = 'MDF 3mm';

// Define cabinets for each category
const bajoMesadaCabinets: Cabinet[] = [
  {
    id: 'base-600',
    name: 'Base 600mm',
    type: 'base',
    icon: Box,
    width: 600,
    height: 720,
    depth: 580,
    pieces: [
      { name: 'Puerta', width: 596, height: 716, quantity: 1, material: MELAMINE_MATERIAL },
    ],
  },
  {
    id: 'base-450',
    name: 'Base 450mm',
    type: 'base',
    icon: Box,
    width: 450,
    height: 720,
    depth: 580,
    pieces: [
      { name: 'Puerta', width: 446, height: 716, quantity: 1, material: MELAMINE_MATERIAL },
    ],
  },
  {
    id: 'base-corner-900',
    name: 'Esquinero Asimétrico',
    type: 'base',
    icon: Pentagon,
    width: 770,
    height: 800,
    depth: 600,
    depth2: 300,
    pieces: [],
  },
];

const alacenaCabinets: Cabinet[] = [
  {
    id: 'wall-600',
    name: 'Alacena 600mm',
    type: 'wall',
    icon: Archive,
    width: 600,
    height: 600,
    depth: 320,
    pieces: [
      { name: 'Puerta', width: 596, height: 596, quantity: 1, material: MELAMINE_MATERIAL },
    ],
  },
  {
    id: 'wall-microwave-600',
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
    id: 'tall-600',
    name: 'Columna 600mm',
    type: 'tall',
    icon: Container,
    width: 600,
    height: 2000,
    depth: 580,
    pieces: [
      { name: 'Puerta Superior', width: 596, height: 1246, quantity: 1, material: MELAMINE_MATERIAL },
      { name: 'Puerta Inferior', width: 596, height: 716, quantity: 1, material: MELAMINE_MATERIAL },
    ],
  },
];

const vanitoryCabinets: Cabinet[] = [
    {
      id: 'vanity-600-hanging-1d1o',
      name: 'Vanitory Colgante (1 Cajón, 1 Hueco)',
      type: 'base', // 'base' so it gets a countertop in 3D view
      icon: VanitoryHangingIcon,
      width: 600,
      height: 460,
      depth: 460,
      pieces: [], // Will be generated by logic
      defaultComponents: [
        { type: 'opening', height: 260 },
        { type: 'drawer', height: 200 },
      ]
    },
    {
      id: 'vanity-600-patas-1d1o',
      name: 'Vanitory Patas (1 Cajón, 1 Hueco)',
      type: 'base',
      icon: VanitoryPatasIcon,
      width: 600,
      height: 840,
      depth: 460,
      pieces: [],
      defaultComponents: [
        { type: 'opening', height: 540 },
        { type: 'drawer', height: 200 },
      ]
    },
    {
      id: 'vanity-600-hanging-2d',
      name: 'Vanitory Colgante (2 Cajones)',
      type: 'base',
      icon: VanitoryHangingIcon,
      width: 600,
      height: 460,
      depth: 460,
      pieces: [],
      defaultComponents: [
        { type: 'drawer', height: 200 },
        { type: 'drawer', height: 200 },
        { type: 'opening', height: 60 },
      ],
    },
    {
      id: 'vanity-600-patas-2d',
      name: 'Vanitory Patas (2 Cajones)',
      type: 'base',
      icon: VanitoryPatasIcon,
      width: 600,
      height: 840,
      depth: 460,
      pieces: [],
      defaultComponents: [
        { type: 'drawer', height: 350 },
        { type: 'drawer', height: 350 },
        { type: 'opening', height: 40 },
      ]
    },
    {
      id: 'vanity-600-hanging-2p',
      name: 'Vanitory Colgante (2 Puertas)',
      type: 'base',
      icon: VanitoryHangingIcon,
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
      id: 'vanity-600-patas-2p',
      name: 'Vanitory Patas (2 Puertas)',
      type: 'base',
      icon: VanitoryPatasIcon,
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
      id: 'vanity-800-hanging-2p',
      name: 'Vanitory Colgante 800mm (2 Puertas)',
      type: 'base',
      icon: VanitoryHangingIcon,
      width: 800,
      height: 460,
      depth: 460,
      pieces: [],
      defaultComponents: [
        { type: 'door', height: 404 },
        { type: 'opening', height: 56 },
      ],
    },
    {
      id: 'vanity-800-patas-2p',
      name: 'Vanitory 800mm Patas (2 Puertas)',
      type: 'base',
      icon: VanitoryPatasIcon,
      width: 800,
      height: 840,
      depth: 460,
      pieces: [],
      defaultComponents: [
        { type: 'door', height: 684 },
        { type: 'opening', height: 56 },
      ]
    },
    {
      id: 'vanity-600-patas',
      name: 'Vanitory 600mm Patas',
      type: 'base',
      icon: VanitoryPatasIcon,
      width: 600,
      height: 840,
      depth: 460,
      pieces: [], // Will be generated by logic
      defaultComponents: [
        { type: 'door', height: 540 },
        { type: 'drawer', height: 200 },
      ]
    },
     {
      id: 'vanity-800-patas',
      name: 'Vanitory 800mm Patas',
      type: 'base',
      icon: VanitoryPatasIcon,
      width: 800,
      height: 840,
      depth: 460,
      pieces: [], // Will be generated by logic
      defaultComponents: [
        { type: 'door', height: 540 },
        { type: 'drawer', height: 200 },
      ]
    },
    {
      id: 'vanity-600-3-drawers',
      name: 'Vanitory 600mm 3 Cajones',
      type: 'base',
      icon: Vanitory3DrawersIcon,
      width: 600,
      height: 840,
      depth: 460,
      pieces: [], // Will be generated by logic
      defaultComponents: [
        { type: 'drawer', height: 246 },
        { type: 'drawer', height: 246 },
        { type: 'drawer', height: 246 },
      ]
    },
];

const placarCabinets: Cabinet[] = [
    {
        id: 'placar-module-800',
        name: 'Módulo Placar 800mm',
        type: 'placar',
        icon: PlacarIcon,
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
