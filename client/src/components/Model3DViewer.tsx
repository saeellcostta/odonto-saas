import { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useLoader, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, Center, Html, useProgress } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Sun, 
  Moon,
  Palette,
  Grid3X3,
  Box,
  Maximize2,
  Minimize2,
  Loader2
} from 'lucide-react';

// Loader de progresso
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2">
        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-muted-foreground">
          Carregando... {progress.toFixed(0)}%
        </span>
      </div>
    </Html>
  );
}

// Componente para modelo STL com melhor tratamento de erros
function STLModel({ url, color, wireframe }: { url: string; color: string; wireframe: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    
    setLoading(true);
    setError(null);
    
    const loader = new STLLoader();
    
    console.log('STLModel: Loading STL from:', url);
    
    loader.load(
      url,
      (loadedGeometry) => {
        console.log('STLModel: STL loaded successfully');
        loadedGeometry.computeVertexNormals();
        loadedGeometry.center();
        
        // Calcular escala para caber na cena
        loadedGeometry.computeBoundingBox();
        const box = loadedGeometry.boundingBox;
        if (box) {
          const size = new THREE.Vector3();
          box.getSize(size);
          const maxDim = Math.max(size.x, size.y, size.z);
          // Normalizar para tamanho 3
          const scale = 3 / maxDim;
          loadedGeometry.scale(scale, scale, scale);
        }
        
        setGeometry(loadedGeometry);
        setLoading(false);
      },
      (progress) => {
        console.log('STLModel: Loading progress:', (progress.loaded / progress.total * 100).toFixed(0) + '%');
      },
      (err) => {
        console.error('STLModel: Error loading STL:', err);
        setError('Erro ao carregar modelo');
        setLoading(false);
      }
    );

    return () => {
      if (geometry) {
        geometry.dispose();
      }
    };
  }, [url]);

  if (loading) {
    return (
      <Html center>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Carregando modelo...</span>
        </div>
      </Html>
    );
  }

  if (error || !geometry) {
    return (
      <Html center>
        <div className="text-red-500 text-sm">{error || 'Modelo não encontrado'}</div>
      </Html>
    );
  }

  return (
    <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial 
        color={color} 
        wireframe={wireframe}
        roughness={0.3}
        metalness={0.1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Componente para modelo OBJ
function OBJModel({ url, color, wireframe }: { url: string; color: string; wireframe: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!url) return;
    
    setLoading(true);
    const loader = new OBJLoader();
    
    loader.load(
      url,
      (obj) => {
        // Aplicar material a todos os meshes
        obj.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            child.material = new THREE.MeshStandardMaterial({
              color: color,
              wireframe: wireframe,
              roughness: 0.3,
              metalness: 0.1,
            });
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Centralizar e escalar
        const box = new THREE.Box3().setFromObject(obj);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        obj.position.sub(center);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3 / maxDim;
        obj.scale.setScalar(scale);
        
        setModel(obj);
        setLoading(false);
      },
      undefined,
      (err) => {
        console.error('Error loading OBJ:', err);
        setLoading(false);
      }
    );
  }, [url, color, wireframe]);

  if (loading || !model) {
    return (
      <Html center>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Carregando modelo...</span>
        </div>
      </Html>
    );
  }

  return <primitive ref={groupRef} object={model} />;
}

// Componente para modelo GLTF
function GLTFModel({ url }: { url: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!url) return;
    
    setLoading(true);
    const loader = new GLTFLoader();
    
    loader.load(
      url,
      (gltf) => {
        const scene = gltf.scene.clone();
        
        // Centralizar e escalar
        const box = new THREE.Box3().setFromObject(scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        scene.position.sub(center);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3 / maxDim;
        scene.scale.setScalar(scale);
        
        setModel(scene);
        setLoading(false);
      },
      undefined,
      (err) => {
        console.error('Error loading GLTF:', err);
        setLoading(false);
      }
    );
  }, [url]);

  if (loading || !model) {
    return (
      <Html center>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Carregando modelo...</span>
        </div>
      </Html>
    );
  }

  return <primitive ref={groupRef} object={model} />;
}

// Componente de controles da câmera
function CameraControls({ 
  autoRotate
}: { 
  autoRotate: boolean; 
}) {
  const controlsRef = useRef<any>(null);
  
  return (
    <OrbitControls 
      ref={controlsRef}
      makeDefault
      autoRotate={autoRotate}
      autoRotateSpeed={2}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={1}
      maxDistance={20}
    />
  );
}

// Componente para atualizar cor de fundo dinamicamente
function BackgroundUpdater({ darkMode }: { darkMode: boolean }) {
  const { gl } = useThree();
  
  useEffect(() => {
    gl.setClearColor(darkMode ? 0x111111 : 0xf5f5f5, 1);
  }, [darkMode, gl]);
  
  return null;
}

// Componente de cena 3D
function Scene({ 
  modelUrl, 
  modelType, 
  color, 
  wireframe, 
  showGrid, 
  darkMode,
  autoRotate 
}: { 
  modelUrl: string | null;
  modelType: string;
  color: string;
  wireframe: boolean;
  showGrid: boolean;
  darkMode: boolean;
  autoRotate: boolean;
}) {
  return (
    <>
      {/* Atualização dinâmica do fundo */}
      <BackgroundUpdater darkMode={darkMode} />
      
      {/* Iluminação */}
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1} 
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-10, -10, -5]} intensity={0.4} />
      <directionalLight position={[0, -10, 0]} intensity={0.2} />

      {/* Ambiente */}
      <Environment preset={darkMode ? 'night' : 'studio'} />

      {/* Grid */}
      {showGrid && (
        <Grid 
          infiniteGrid 
          cellSize={0.5} 
          cellThickness={0.5} 
          sectionSize={2} 
          sectionThickness={1}
          fadeDistance={20}
          cellColor={darkMode ? '#444' : '#aaa'}
          sectionColor={darkMode ? '#666' : '#888'}
        />
      )}

      {/* Modelo 3D */}
      <Suspense fallback={<Loader />}>
        {modelUrl && modelType === 'stl' && (
          <STLModel url={modelUrl} color={color} wireframe={wireframe} />
        )}
        {modelUrl && modelType === 'obj' && (
          <OBJModel url={modelUrl} color={color} wireframe={wireframe} />
        )}
        {modelUrl && (modelType === 'gltf' || modelType === 'glb') && (
          <GLTFModel url={modelUrl} />
        )}
      </Suspense>

      {/* Controles de câmera */}
      <CameraControls autoRotate={autoRotate} />
    </>
  );
}

// Componente principal do visualizador
interface Model3DViewerProps {
  modelUrl?: string;
  modelType?: 'stl' | 'obj' | 'gltf' | 'glb';
  className?: string;
  onUpload?: (file: File) => void;
}

export function Model3DViewer({ 
  modelUrl, 
  modelType = 'stl',
  className = '',
  onUpload
}: Model3DViewerProps) {
  const [color, setColor] = useState('#f0f0f0');
  const [wireframe, setWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [localType, setLocalType] = useState<string>('stl');
  const [canvasKey, setCanvasKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Usar URL do modelo passado como prop ou local
  const currentUrl = modelUrl || localUrl;
  const currentType = modelUrl ? modelType : localType;
  
  // Forçar recriação do canvas quando o modelo muda
  useEffect(() => {
    if (modelUrl) {
      console.log('Model3DViewer: New model URL received:', modelUrl);
      console.log('Model3DViewer: Model type:', modelType);
      setCanvasKey(prev => prev + 1);
    }
  }, [modelUrl, modelType]);

  const colors = [
    '#f0f0f0', // Branco
    '#e8d5b7', // Cor de dente
    '#ffd700', // Dourado
    '#c0c0c0', // Prata
    '#87ceeb', // Azul claro
    '#98fb98', // Verde claro
    '#ffb6c1', // Rosa
    '#dda0dd', // Roxo claro
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (['stl', 'obj', 'gltf', 'glb'].includes(extension || '')) {
        const url = URL.createObjectURL(file);
        setLocalUrl(url);
        setLocalType(extension || 'stl');
        setCanvasKey(prev => prev + 1);
        if (onUpload) {
          onUpload(file);
        }
      } else {
        alert('Formato não suportado. Use STL, OBJ, GLTF ou GLB.');
      }
    }
  };

  // Detectar mudanças no estado de fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div ref={containerRef} className={`flex flex-col gap-4 ${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-4' : ''}`}>
      {/* Barra de ferramentas */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg">
        {/* Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".stl,.obj,.gltf,.glb"
          onChange={handleFileUpload}
          className="hidden"
        />
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <Box className="w-4 h-4 mr-2" />
          Carregar Modelo
        </Button>

        <div className="w-px h-6 bg-border" />

        {/* Cores */}
        <div className="flex items-center gap-1">
          <Palette className="w-4 h-4 text-muted-foreground" />
          {colors.map((c) => (
            <button
              key={c}
              className={`w-6 h-6 rounded-full border-2 transition-all ${
                color === c ? 'border-primary scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>

        <div className="w-px h-6 bg-border" />

        {/* Controles */}
        <Button
          variant={wireframe ? 'default' : 'outline'}
          size="sm"
          onClick={() => setWireframe(!wireframe)}
        >
          <Grid3X3 className="w-4 h-4" />
        </Button>

        <Button
          variant={showGrid ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowGrid(!showGrid)}
        >
          <Move className="w-4 h-4" />
        </Button>

        <Button
          variant={autoRotate ? 'default' : 'outline'}
          size="sm"
          onClick={() => setAutoRotate(!autoRotate)}
        >
          <RotateCcw className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        <div className="w-px h-6 bg-border" />

        {/* Tela Cheia */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (!document.fullscreenElement) {
              containerRef.current?.requestFullscreen();
              setIsFullscreen(true);
            } else {
              document.exitFullscreen();
              setIsFullscreen(false);
            }
          }}
          title={isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
      </div>

      {/* Canvas 3D */}
      <div 
        className={`relative w-full rounded-lg overflow-hidden border ${
          darkMode ? 'bg-gray-900' : 'bg-gradient-to-b from-gray-100 to-gray-200'
        } ${isFullscreen ? 'flex-1' : 'h-[500px]'}`}
      >
        {currentUrl ? (
          <Canvas
            key={canvasKey}
            shadows
            camera={{ position: [4, 4, 4], fov: 50 }}
            gl={{ 
              antialias: true, 
              alpha: true,
              powerPreference: 'high-performance',
              preserveDrawingBuffer: true
            }}
            onCreated={({ gl }) => {
              gl.setClearColor(darkMode ? 0x111111 : 0xf5f5f5, 1);
            }}
          >
            <Scene 
              modelUrl={currentUrl}
              modelType={currentType}
              color={color}
              wireframe={wireframe}
              showGrid={showGrid}
              darkMode={darkMode}
              autoRotate={autoRotate}
            />
          </Canvas>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <Box className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">Nenhum modelo carregado</p>
            <p className="text-sm">Clique em "Carregar Modelo" para visualizar um arquivo 3D</p>
            <p className="text-xs mt-2">Formatos suportados: STL, OBJ, GLTF, GLB</p>
          </div>
        )}

        {/* Instruções de controle */}
        <div className="absolute bottom-3 left-3 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
          <span className="font-medium">Controles:</span> Arrastar = Rotacionar | Scroll = Zoom | Shift+Arrastar = Mover
        </div>
      </div>
    </div>
  );
}

export default Model3DViewer;
