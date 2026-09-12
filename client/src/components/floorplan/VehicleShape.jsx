import React from 'react';
import { Group, Rect, Circle, Line, Text } from 'react-konva';

/**
 * TopDownCar - Realistic top-down vector sedan / SUV
 */
export function TopDownCar({ asset, isSelected, noRotation = false }) {
  const color = asset.color || (isSelected ? '#2563eb' : '#3b82f6');
  const plate = asset.licensePlate || '';
  const rot = noRotation ? 0 : (asset.rotation || 0);

  return (
    <Group rotation={rot}>
      {/* 4 Tires */}
      <Rect x={-17} y={-13} width={9} height={4} cornerRadius={1.5} fill="#0f172a" />
      <Rect x={8} y={-13} width={9} height={4} cornerRadius={1.5} fill="#0f172a" />
      <Rect x={-17} y={9} width={9} height={4} cornerRadius={1.5} fill="#0f172a" />
      <Rect x={8} y={9} width={9} height={4} cornerRadius={1.5} fill="#0f172a" />

      {/* Main Car Body Chassis */}
      <Rect
        x={-22}
        y={-11}
        width={44}
        height={22}
        cornerRadius={5}
        fill={color}
        stroke={isSelected ? '#1e40af' : '#1e293b'}
        strokeWidth={isSelected ? 2.5 : 1.5}
        shadowColor="rgba(0,0,0,0.3)"
        shadowBlur={isSelected ? 8 : 4}
        shadowOffset={{ x: 1, y: 2 }}
      />

      {/* Hood crease line */}
      <Line points={[14, -7, 18, 0, 14, 7]} stroke="rgba(255,255,255,0.4)" strokeWidth={1} />

      {/* Front Windshield */}
      <Line
        points={[4, -8, 8, -6, 8, 6, 4, 8]}
        closed
        fill="#bae6fd"
        stroke="#0284c7"
        strokeWidth={0.8}
      />

      {/* Roof Cabin */}
      <Rect
        x={-13}
        y={-8}
        width={17}
        height={16}
        cornerRadius={2.5}
        fill="#0f172a"
        opacity={0.88}
      />

      {/* Sunroof / highlight */}
      <Rect
        x={-8}
        y={-4}
        width={8}
        height={8}
        cornerRadius={1}
        fill="#1e293b"
        stroke="#334155"
        strokeWidth={0.5}
      />

      {/* Rear Window */}
      <Line
        points={[-13, -7, -16, -6, -16, 6, -13, 7]}
        closed
        fill="#93c5fd"
        stroke="#0284c7"
        strokeWidth={0.8}
      />

      {/* Headlights */}
      <Circle x={21.5} y={-7.5} radius={2} fill="#fef08a" shadowColor="#fef08a" shadowBlur={4} />
      <Circle x={21.5} y={7.5} radius={2} fill="#fef08a" shadowColor="#fef08a" shadowBlur={4} />

      {/* Taillights */}
      <Rect x={-22} y={-9} width={1.8} height={4} cornerRadius={0.5} fill="#ef4444" />
      <Rect x={-22} y={5} width={1.8} height={4} cornerRadius={0.5} fill="#ef4444" />

      {/* Side mirrors */}
      <Rect x={7} y={-13} width={2.5} height={2} cornerRadius={0.5} fill={color} />
      <Rect x={7} y={11} width={2.5} height={2} cornerRadius={0.5} fill={color} />

      {/* License Plate Badge (visible on top/back) */}
      {plate && (
        <Group x={-14} y={-4.5}>
          <Rect
            width={28}
            height={9}
            cornerRadius={1.5}
            fill="#ffffff"
            stroke="#1e293b"
            strokeWidth={0.8}
            shadowColor="rgba(0,0,0,0.2)"
            shadowBlur={2}
          />
          <Text
            x={1}
            y={1}
            width={26}
            height={8}
            text={plate}
            fontSize={6.5}
            fontStyle="bold"
            fill="#0f172a"
            align="center"
            verticalAlign="middle"
          />
        </Group>
      )}
    </Group>
  );
}

/**
 * TopDownTruck - Logistics 10-wheel container truck
 */
export function TopDownTruck({ asset, isSelected, noRotation = false }) {
  const cabColor = asset.color || (isSelected ? '#0284c7' : '#0369a1');
  const plate = asset.licensePlate || '';
  const rot = noRotation ? 0 : (asset.rotation || 0);

  return (
    <Group rotation={rot}>
      {/* 8 Heavy Wheels */}
      {/* Front cab wheels */}
      <Rect x={26} y={-17} width={10} height={4.5} cornerRadius={1.5} fill="#0f172a" />
      <Rect x={26} y={12.5} width={10} height={4.5} cornerRadius={1.5} fill="#0f172a" />
      {/* Trailer rear double axles */}
      <Rect x={-36} y={-17} width={9} height={4.5} cornerRadius={1.5} fill="#0f172a" />
      <Rect x={-36} y={12.5} width={9} height={4.5} cornerRadius={1.5} fill="#0f172a" />
      <Rect x={-24} y={-17} width={9} height={4.5} cornerRadius={1.5} fill="#0f172a" />
      <Rect x={-24} y={12.5} width={9} height={4.5} cornerRadius={1.5} fill="#0f172a" />

      {/* Container Trailer Body */}
      <Rect
        x={-42}
        y={-15}
        width={58}
        height={30}
        cornerRadius={2}
        fill="#f1f5f9"
        stroke={isSelected ? '#2563eb' : '#475569'}
        strokeWidth={isSelected ? 2.5 : 1.5}
        shadowColor="rgba(0,0,0,0.25)"
        shadowBlur={isSelected ? 8 : 4}
      />

      {/* Container Ribbed Panel Details */}
      {[-32, -22, -12, -2, 8].map((rx) => (
        <Line key={rx} points={[rx, -14, rx, 14]} stroke="#cbd5e1" strokeWidth={1.5} />
      ))}

      {/* Container Label / Logo */}
      <Text
        x={-38}
        y={-4}
        width={50}
        text={asset.name || 'FTI LOGISTICS'}
        fontSize={6.5}
        fontStyle="bold"
        fill="#334155"
        align="center"
      />

      {/* Truck Cab */}
      <Rect
        x={18}
        y={-14}
        width={24}
        height={28}
        cornerRadius={4}
        fill={cabColor}
        stroke="#0f172a"
        strokeWidth={1.5}
      />

      {/* Windshield */}
      <Rect
        x={33}
        y={-11}
        width={6}
        height={22}
        cornerRadius={2}
        fill="#bae6fd"
        stroke="#0284c7"
        strokeWidth={1}
      />

      {/* Side mirrors */}
      <Rect x={30} y={-17} width={3} height={3} cornerRadius={0.5} fill="#1e293b" />
      <Rect x={30} y={14} width={3} height={3} cornerRadius={0.5} fill="#1e293b" />

      {/* Headlights */}
      <Circle x={41} y={-9} radius={2.5} fill="#fef08a" shadowColor="#fef08a" shadowBlur={4} />
      <Circle x={41} y={9} radius={2.5} fill="#fef08a" shadowColor="#fef08a" shadowBlur={4} />

      {/* Rear Brake Lights */}
      <Rect x={-42.5} y={-12} width={2} height={5} fill="#ef4444" />
      <Rect x={-42.5} y={7} width={2} height={5} fill="#ef4444" />

      {/* License plate if present */}
      {plate && (
        <Group x={-10} y={-4.5}>
          <Rect
            width={32}
            height={9}
            cornerRadius={1.5}
            fill="#ffffff"
            stroke="#1e293b"
            strokeWidth={0.8}
          />
          <Text
            x={1}
            y={1}
            width={30}
            height={8}
            text={plate}
            fontSize={6.5}
            fontStyle="bold"
            fill="#0f172a"
            align="center"
            verticalAlign="middle"
          />
        </Group>
      )}
    </Group>
  );
}

/**
 * TopDownMotorcycle - Motorcycle / Delivery scooter
 */
export function TopDownMotorcycle({ asset, isSelected, noRotation = false }) {
  const bodyColor = asset.color || (isSelected ? '#ef4444' : '#dc2626');
  const plate = asset.licensePlate || '';
  const rot = noRotation ? 0 : (asset.rotation || 0);

  return (
    <Group rotation={rot}>
      {/* Front Tire */}
      <Rect x={7} y={-2} width={8} height={4} cornerRadius={1.5} fill="#0f172a" />

      {/* Rear Tire */}
      <Rect x={-15} y={-2} width={7} height={4} cornerRadius={1.5} fill="#0f172a" />

      {/* Handlebars */}
      <Line points={[8, -7, 8, 7]} stroke="#334155" strokeWidth={2.5} lineCap="round" />
      <Circle x={8} y={-7} radius={1.2} fill="#0f172a" />
      <Circle x={8} y={7} radius={1.2} fill="#0f172a" />

      {/* Headlight */}
      <Circle x={15} y={0} radius={2} fill="#fef08a" shadowColor="#fef08a" shadowBlur={3} />

      {/* Main Body / Fuel Tank */}
      <Rect
        x={-5}
        y={-4.5}
        width={12}
        height={9}
        cornerRadius={3.5}
        fill={bodyColor}
        stroke={isSelected ? '#2563eb' : '#7f1d1d'}
        strokeWidth={1.2}
      />

      {/* Seat */}
      <Rect
        x={-12}
        y={-3.5}
        width={8}
        height={7}
        cornerRadius={2}
        fill="#1e293b"
      />

      {/* Tail light */}
      <Rect x={-15.5} y={-1.5} width={1.5} height={3} fill="#ef4444" />

      {/* License plate */}
      {plate && (
        <Group x={-12} y={-14}>
          <Rect width={24} height={8} cornerRadius={1} fill="#ffffff" stroke="#1e293b" strokeWidth={0.7} />
          <Text x={1} y={1} width={22} text={plate} fontSize={6} fontStyle="bold" fill="#0f172a" align="center" />
        </Group>
      )}
    </Group>
  );
}

/**
 * TopDownForklift - Warehouse electric/diesel forklift
 */
export function TopDownForklift({ asset, isSelected, noRotation = false }) {
  const bodyColor = asset.color || (isSelected ? '#ea580c' : '#f59e0b');
  const rot = noRotation ? 0 : (asset.rotation || 0);

  return (
    <Group rotation={rot}>
      {/* 4 Wheels */}
      <Rect x={-14} y={-13} width={8} height={4} cornerRadius={1.5} fill="#0f172a" />
      <Rect x={3} y={-13} width={8} height={4} cornerRadius={1.5} fill="#0f172a" />
      <Rect x={-14} y={9} width={8} height={4} cornerRadius={1.5} fill="#0f172a" />
      <Rect x={3} y={9} width={8} height={4} cornerRadius={1.5} fill="#0f172a" />

      {/* Heavy Rear Counterweight & Body */}
      <Rect
        x={-18}
        y={-11}
        width={24}
        height={22}
        cornerRadius={4}
        fill={bodyColor}
        stroke={isSelected ? '#2563eb' : '#b45309'}
        strokeWidth={isSelected ? 2.5 : 1.5}
        shadowColor="rgba(0,0,0,0.25)"
        shadowBlur={4}
      />

      {/* Overhead Guard / Roll Cage */}
      <Rect
        x={-9}
        y={-8}
        width={13}
        height={16}
        cornerRadius={2}
        fill="#1e293b"
        stroke="#475569"
        strokeWidth={1}
      />

      {/* Driver Seat */}
      <Rect x={-7} y={-5} width={8} height={10} cornerRadius={1.5} fill="#0f172a" />

      {/* Front Mast Bar */}
      <Rect x={6} y={-10} width={4} height={20} cornerRadius={1} fill="#0f172a" />

      {/* Dual Extending Lifting Forks */}
      <Rect x={10} y={-7} width={18} height={3} cornerRadius={0.8} fill="#64748b" stroke="#334155" strokeWidth={0.5} />
      <Rect x={10} y={4} width={18} height={3} cornerRadius={0.8} fill="#64748b" stroke="#334155" strokeWidth={0.5} />

      {/* Hazard stripes on counterweight back */}
      <Line points={[-17, -8, -13, -11]} stroke="#1e293b" strokeWidth={2} />
      <Line points={[-17, -2, -9, -11]} stroke="#1e293b" strokeWidth={2} />
      <Line points={[-17, 4, -9, -4]} stroke="#1e293b" strokeWidth={2} />
      <Line points={[-17, 10, -9, 2]} stroke="#1e293b" strokeWidth={2} />
    </Group>
  );
}

/**
 * ParkingBay - Architectural parking stall lines with slot ID
 */
export function ParkingBay({ asset, isSelected, noRotation = false }) {
  const isEV = asset.type === 'ev_charger' || asset.parkingSlot?.toLowerCase().includes('ev');
  const slot = asset.parkingSlot || asset.code || 'P';
  const lineColor = isEV ? '#10b981' : '#facc15';
  const rot = noRotation ? 0 : (asset.rotation || 0);

  return (
    <Group rotation={rot}>
      {/* Ground stall outline (standard 60 x 30 stall) */}
      <Line
        points={[-28, -15, 28, -15, 28, 15, -28, 15]}
        stroke={isSelected ? '#3b82f6' : lineColor}
        strokeWidth={isSelected ? 2.5 : 2}
        dash={[8, 4]}
      />

      {/* Wheel Stop Bar at Back of Stall */}
      <Rect
        x={-24}
        y={-10}
        width={4}
        height={20}
        cornerRadius={1}
        fill={isEV ? '#059669' : '#eab308'}
        opacity={0.8}
      />

      {/* Center Slot Number / Stencil */}
      <Text
        x={-20}
        y={-7}
        width={40}
        height={14}
        text={isEV ? `⚡ ${slot}` : slot}
        fontSize={9}
        fontStyle="bold"
        fill={isEV ? '#059669' : '#ca8a04'}
        align="center"
        verticalAlign="middle"
        opacity={0.85}
      />
    </Group>
  );
}

/**
 * EVCharger - High-speed electric vehicle charging station pedestal
 */
export function EVCharger({ asset, isSelected, noRotation = false }) {
  const rot = noRotation ? 0 : (asset.rotation || 0);

  return (
    <Group rotation={rot}>
      {/* Ground mounting plate */}
      <Rect
        x={-14}
        y={-14}
        width={28}
        height={28}
        cornerRadius={4}
        fill="#f8fafc"
        stroke={isSelected ? '#2563eb' : '#059669'}
        strokeWidth={isSelected ? 2.5 : 1.5}
        shadowColor="#10b981"
        shadowBlur={isSelected ? 10 : 4}
      />

      {/* Pedestal Box */}
      <Rect
        x={-10}
        y={-10}
        width={20}
        height={20}
        cornerRadius={3}
        fill="#047857"
      />

      {/* Screen / Display */}
      <Rect
        x={-6}
        y={-7}
        width={12}
        height={6}
        cornerRadius={1}
        fill="#064e3b"
      />

      {/* Lightning bolt icon */}
      <Text
        x={-6}
        y={-6}
        width={12}
        height={18}
        text="⚡"
        fontSize={11}
        fill="#fef08a"
        align="center"
        verticalAlign="middle"
      />

      {/* Green pulsating status ring */}
      <Circle
        x={0}
        y={0}
        radius={16}
        stroke="#10b981"
        strokeWidth={1}
        dash={[4, 3]}
      />
    </Group>
  );
}

/**
 * Main dispatcher component for all vehicle / parking asset types
 */
export default function VehicleShape({ asset, isSelected, isTargeted, noRotation = false }) {
  switch (asset.type) {
    case 'vehicle_car':
      return <TopDownCar asset={asset} isSelected={isSelected} isTargeted={isTargeted} noRotation={noRotation} />;
    case 'vehicle_truck':
      return <TopDownTruck asset={asset} isSelected={isSelected} isTargeted={isTargeted} noRotation={noRotation} />;
    case 'vehicle_motorcycle':
      return <TopDownMotorcycle asset={asset} isSelected={isSelected} isTargeted={isTargeted} noRotation={noRotation} />;
    case 'vehicle_forklift':
      return <TopDownForklift asset={asset} isSelected={isSelected} isTargeted={isTargeted} noRotation={noRotation} />;
    case 'parking_bay':
      return <ParkingBay asset={asset} isSelected={isSelected} isTargeted={isTargeted} noRotation={noRotation} />;
    case 'ev_charger':
      return <EVCharger asset={asset} isSelected={isSelected} isTargeted={isTargeted} noRotation={noRotation} />;
    default:
      return null;
  }
}
