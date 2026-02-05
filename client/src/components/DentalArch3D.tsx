import { useRef, useMemo } from 'react';
import * as THREE from 'three';

// Componente de um dente individual
function Tooth({ 
  position, 
  rotation = [0, 0, 0], 
  scale = [1, 1, 1],
  color = '#f5f0e6',
  type = 'molar' // molar, premolar, canine, incisor
}: { 
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  color?: string;
  type?: 'molar' | 'premolar' | 'canine' | 'incisor';
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Geometria baseada no tipo de dente
  const geometry = useMemo(() => {
    switch (type) {
      case 'molar':
        // Molar - mais largo e com múltiplas cúspides
        return new THREE.BoxGeometry(0.9, 1.2, 0.9);
      case 'premolar':
        // Pré-molar - tamanho médio
        return new THREE.BoxGeometry(0.7, 1.1, 0.7);
      case 'canine':
        // Canino - pontiagudo
        return new THREE.ConeGeometry(0.35, 1.3, 8);
      case 'incisor':
        // Incisivo - fino e largo
        return new THREE.BoxGeometry(0.8, 1.0, 0.4);
      default:
        return new THREE.BoxGeometry(0.7, 1.0, 0.7);
    }
  }, [type]);

  return (
    <group position={position} rotation={rotation as unknown as THREE.Euler}>
      {/* Coroa do dente */}
      <mesh 
        ref={meshRef} 
        scale={scale as unknown as THREE.Vector3}
        castShadow 
        receiveShadow
        position={[0, 0.5, 0]}
      >
        <primitive object={geometry} attach="geometry" />
        <meshStandardMaterial 
          color={color}
          roughness={0.3}
          metalness={0.05}
        />
      </mesh>
      
      {/* Raiz do dente */}
      <mesh 
        position={[0, -0.3, 0]}
        scale={[scale[0] * 0.6, scale[1] * 0.8, scale[2] * 0.6] as unknown as THREE.Vector3}
        castShadow
      >
        <coneGeometry args={[0.3, 0.8, 8]} />
        <meshStandardMaterial 
          color="#d4c4a8"
          roughness={0.5}
          metalness={0}
        />
      </mesh>
    </group>
  );
}

// Componente da gengiva
function Gum({ 
  isUpper = true,
  color = '#e8a0a0'
}: { 
  isUpper?: boolean;
  color?: string;
}) {
  const curve = useMemo(() => {
    const points = [];
    // Criar curva em forma de U para a arcada
    for (let i = 0; i <= 20; i++) {
      const t = (i / 20) * Math.PI;
      const x = Math.cos(t) * 3;
      const z = Math.sin(t) * 2;
      points.push(new THREE.Vector3(x, 0, z));
    }
    return new THREE.CatmullRomCurve3(points);
  }, []);

  return (
    <mesh 
      position={[0, isUpper ? 0.3 : -0.3, 0]} 
      rotation={[isUpper ? 0 : Math.PI, 0, 0]}
      castShadow
      receiveShadow
    >
      <tubeGeometry args={[curve, 64, 0.4, 16, false]} />
      <meshStandardMaterial 
        color={color}
        roughness={0.7}
        metalness={0}
      />
    </mesh>
  );
}

// Arcada superior
export function UpperArch({ 
  toothColor = '#f5f0e6',
  gumColor = '#e8a0a0',
  showGum = true
}: {
  toothColor?: string;
  gumColor?: string;
  showGum?: boolean;
}) {
  // Posições dos dentes na arcada superior (16 dentes)
  const teeth = useMemo(() => {
    const teethData: Array<{
      position: [number, number, number];
      rotation: [number, number, number];
      type: 'molar' | 'premolar' | 'canine' | 'incisor';
      scale: [number, number, number];
    }> = [];

    // Lado direito (dentes 1-8)
    // Molares (3)
    teethData.push({ position: [-2.8, 0, 0.3], rotation: [0, 0.3, 0], type: 'molar', scale: [1, 1, 1] });
    teethData.push({ position: [-2.5, 0, 0.8], rotation: [0, 0.2, 0], type: 'molar', scale: [0.95, 1, 0.95] });
    teethData.push({ position: [-2.1, 0, 1.2], rotation: [0, 0.15, 0], type: 'molar', scale: [0.9, 0.95, 0.9] });
    // Pré-molares (2)
    teethData.push({ position: [-1.6, 0, 1.5], rotation: [0, 0.1, 0], type: 'premolar', scale: [1, 1, 1] });
    teethData.push({ position: [-1.1, 0, 1.7], rotation: [0, 0.05, 0], type: 'premolar', scale: [0.95, 1, 0.95] });
    // Canino (1)
    teethData.push({ position: [-0.6, 0, 1.85], rotation: [0, 0, 0], type: 'canine', scale: [1, 1.1, 1] });
    // Incisivos laterais e centrais (2)
    teethData.push({ position: [-0.25, 0, 1.95], rotation: [0, 0, 0], type: 'incisor', scale: [0.85, 0.95, 1] });
    teethData.push({ position: [0.25, 0, 1.95], rotation: [0, 0, 0], type: 'incisor', scale: [0.9, 1, 1] });

    // Lado esquerdo (dentes 9-16) - espelhado
    teethData.push({ position: [0.6, 0, 1.85], rotation: [0, 0, 0], type: 'canine', scale: [1, 1.1, 1] });
    teethData.push({ position: [1.1, 0, 1.7], rotation: [0, -0.05, 0], type: 'premolar', scale: [0.95, 1, 0.95] });
    teethData.push({ position: [1.6, 0, 1.5], rotation: [0, -0.1, 0], type: 'premolar', scale: [1, 1, 1] });
    teethData.push({ position: [2.1, 0, 1.2], rotation: [0, -0.15, 0], type: 'molar', scale: [0.9, 0.95, 0.9] });
    teethData.push({ position: [2.5, 0, 0.8], rotation: [0, -0.2, 0], type: 'molar', scale: [0.95, 1, 0.95] });
    teethData.push({ position: [2.8, 0, 0.3], rotation: [0, -0.3, 0], type: 'molar', scale: [1, 1, 1] });

    return teethData;
  }, []);

  return (
    <group position={[0, 1, 0]}>
      {showGum && <Gum isUpper={true} color={gumColor} />}
      {teeth.map((tooth, index) => (
        <Tooth
          key={`upper-${index}`}
          position={tooth.position}
          rotation={tooth.rotation}
          type={tooth.type}
          scale={tooth.scale}
          color={toothColor}
        />
      ))}
    </group>
  );
}

// Arcada inferior
export function LowerArch({ 
  toothColor = '#f5f0e6',
  gumColor = '#e8a0a0',
  showGum = true
}: {
  toothColor?: string;
  gumColor?: string;
  showGum?: boolean;
}) {
  // Posições dos dentes na arcada inferior (16 dentes)
  const teeth = useMemo(() => {
    const teethData: Array<{
      position: [number, number, number];
      rotation: [number, number, number];
      type: 'molar' | 'premolar' | 'canine' | 'incisor';
      scale: [number, number, number];
    }> = [];

    // Lado direito
    teethData.push({ position: [-2.6, 0, 0.2], rotation: [Math.PI, 0.3, 0], type: 'molar', scale: [0.95, 0.95, 0.95] });
    teethData.push({ position: [-2.3, 0, 0.7], rotation: [Math.PI, 0.2, 0], type: 'molar', scale: [0.9, 0.95, 0.9] });
    teethData.push({ position: [-1.9, 0, 1.1], rotation: [Math.PI, 0.15, 0], type: 'molar', scale: [0.85, 0.9, 0.85] });
    teethData.push({ position: [-1.5, 0, 1.4], rotation: [Math.PI, 0.1, 0], type: 'premolar', scale: [0.95, 0.95, 0.95] });
    teethData.push({ position: [-1.0, 0, 1.6], rotation: [Math.PI, 0.05, 0], type: 'premolar', scale: [0.9, 0.95, 0.9] });
    teethData.push({ position: [-0.55, 0, 1.75], rotation: [Math.PI, 0, 0], type: 'canine', scale: [0.95, 1.05, 0.95] });
    teethData.push({ position: [-0.2, 0, 1.85], rotation: [Math.PI, 0, 0], type: 'incisor', scale: [0.75, 0.9, 0.9] });
    teethData.push({ position: [0.2, 0, 1.85], rotation: [Math.PI, 0, 0], type: 'incisor', scale: [0.75, 0.9, 0.9] });

    // Lado esquerdo - espelhado
    teethData.push({ position: [0.55, 0, 1.75], rotation: [Math.PI, 0, 0], type: 'canine', scale: [0.95, 1.05, 0.95] });
    teethData.push({ position: [1.0, 0, 1.6], rotation: [Math.PI, -0.05, 0], type: 'premolar', scale: [0.9, 0.95, 0.9] });
    teethData.push({ position: [1.5, 0, 1.4], rotation: [Math.PI, -0.1, 0], type: 'premolar', scale: [0.95, 0.95, 0.95] });
    teethData.push({ position: [1.9, 0, 1.1], rotation: [Math.PI, -0.15, 0], type: 'molar', scale: [0.85, 0.9, 0.85] });
    teethData.push({ position: [2.3, 0, 0.7], rotation: [Math.PI, -0.2, 0], type: 'molar', scale: [0.9, 0.95, 0.9] });
    teethData.push({ position: [2.6, 0, 0.2], rotation: [Math.PI, -0.3, 0], type: 'molar', scale: [0.95, 0.95, 0.95] });

    return teethData;
  }, []);

  return (
    <group position={[0, -1, 0]}>
      {showGum && <Gum isUpper={false} color={gumColor} />}
      {teeth.map((tooth, index) => (
        <Tooth
          key={`lower-${index}`}
          position={tooth.position}
          rotation={tooth.rotation}
          type={tooth.type}
          scale={tooth.scale}
          color={toothColor}
        />
      ))}
    </group>
  );
}

// Arcada completa (superior + inferior)
export function FullDentalArch({
  toothColor = '#f5f0e6',
  gumColor = '#e8a0a0',
  showGum = true,
  showUpper = true,
  showLower = true,
  gap = 0.5
}: {
  toothColor?: string;
  gumColor?: string;
  showGum?: boolean;
  showUpper?: boolean;
  showLower?: boolean;
  gap?: number;
}) {
  return (
    <group>
      {showUpper && (
        <group position={[0, gap / 2, 0]}>
          <UpperArch toothColor={toothColor} gumColor={gumColor} showGum={showGum} />
        </group>
      )}
      {showLower && (
        <group position={[0, -gap / 2, 0]}>
          <LowerArch toothColor={toothColor} gumColor={gumColor} showGum={showGum} />
        </group>
      )}
    </group>
  );
}

export default FullDentalArch;
