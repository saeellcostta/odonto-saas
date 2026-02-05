import { useEffect, useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { 
  Clock, Users, Bell, MapPin, Volume2, Settings, 
  Palette, Snowflake, Heart, PartyPopper, Sun, Sparkles,
  Youtube, Play, Pause, X, ChevronDown, Music, Wand2, ExternalLink, Upload, Image,
  Ghost, Candy, Trophy, Flag, ImagePlus, Trash2, VolumeX, Volume1, Baby
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

// Definição dos temas sazonais
const SEASONAL_THEMES = {
  default: {
    name: "Padrão",
    icon: Sparkles,
    background: "from-slate-900 via-slate-800 to-slate-900",
    accent: "from-teal-500 to-emerald-500",
    accentMuted: "from-teal-600/80 to-teal-500/80",
    cardBg: "bg-slate-800/50",
    border: "border-slate-700/50",
    text: "text-white",
    decorations: null,
  },
  christmas: {
    name: "Natal",
    icon: Snowflake,
    background: "from-red-950 via-green-950 to-red-950",
    accent: "from-red-500 to-green-500",
    accentMuted: "from-red-600/80 to-green-600/80",
    cardBg: "bg-red-900/30",
    border: "border-red-700/50",
    text: "text-white",
    decorations: "christmas",
  },
  newYear: {
    name: "Ano Novo",
    icon: PartyPopper,
    background: "from-indigo-950 via-purple-950 to-indigo-950",
    accent: "from-yellow-400 to-amber-500",
    accentMuted: "from-yellow-500/80 to-amber-500/80",
    cardBg: "bg-indigo-900/30",
    border: "border-yellow-500/30",
    text: "text-white",
    decorations: "fireworks",
  },
  valentines: {
    name: "Dia dos Namorados",
    icon: Heart,
    background: "from-pink-950 via-rose-950 to-pink-950",
    accent: "from-pink-500 to-rose-500",
    accentMuted: "from-pink-600/80 to-rose-500/80",
    cardBg: "bg-pink-900/30",
    border: "border-pink-500/30",
    text: "text-white",
    decorations: "hearts",
  },
  carnival: {
    name: "Carnaval",
    icon: PartyPopper,
    background: "from-purple-950 via-yellow-950 to-green-950",
    accent: "from-yellow-400 via-green-400 to-purple-500",
    accentMuted: "from-yellow-500/80 via-green-500/80 to-purple-500/80",
    cardBg: "bg-purple-900/30",
    border: "border-yellow-500/30",
    text: "text-white",
    decorations: "confetti",
  },
  easter: {
    name: "Páscoa",
    icon: Sun,
    background: "from-purple-950 via-pink-950 to-yellow-950",
    accent: "from-purple-400 to-pink-400",
    accentMuted: "from-purple-500/80 to-pink-500/80",
    cardBg: "bg-purple-900/30",
    border: "border-purple-500/30",
    text: "text-white",
    decorations: "eggs",
  },
  winter: {
    name: "Inverno",
    icon: Snowflake,
    background: "from-blue-950 via-cyan-950 to-blue-950",
    accent: "from-cyan-400 to-blue-500",
    accentMuted: "from-cyan-500/80 to-blue-500/80",
    cardBg: "bg-blue-900/30",
    border: "border-cyan-500/30",
    text: "text-white",
    decorations: "snow",
  },
  summer: {
    name: "Verão",
    icon: Sun,
    background: "from-orange-950 via-yellow-950 to-orange-950",
    accent: "from-orange-400 to-yellow-400",
    accentMuted: "from-orange-500/80 to-yellow-500/80",
    cardBg: "bg-orange-900/30",
    border: "border-orange-500/30",
    text: "text-white",
    decorations: "sun",
  },
  fairy: {
    name: "Fada",
    icon: Wand2,
    background: "from-purple-950 via-pink-950 to-indigo-950",
    accent: "from-pink-400 via-purple-400 to-indigo-400",
    accentMuted: "from-pink-500/80 via-purple-500/80 to-indigo-500/80",
    cardBg: "bg-purple-900/30",
    border: "border-pink-500/30",
    text: "text-white",
    decorations: "fairy",
  },
  unicorn: {
    name: "Unicórnio",
    icon: Sparkles,
    background: "from-pink-950 via-purple-950 to-cyan-950",
    accent: "from-pink-400 via-purple-400 to-cyan-400",
    accentMuted: "from-pink-500/80 via-purple-500/80 to-cyan-500/80",
    cardBg: "bg-pink-900/30",
    border: "border-purple-500/30",
    text: "text-white",
    decorations: "unicorn",
  },
  butterfly: {
    name: "Borboletas",
    icon: Sparkles,
    background: "from-emerald-950 via-teal-950 to-cyan-950",
    accent: "from-emerald-400 via-teal-400 to-cyan-400",
    accentMuted: "from-emerald-500/80 via-teal-500/80 to-cyan-500/80",
    cardBg: "bg-emerald-900/30",
    border: "border-teal-500/30",
    text: "text-white",
    decorations: "butterfly",
  },
  halloween: {
    name: "Halloween",
    icon: Ghost,
    background: "from-orange-950 via-black to-purple-950",
    accent: "from-orange-500 to-purple-500",
    accentMuted: "from-orange-600/80 to-purple-600/80",
    cardBg: "bg-orange-900/30",
    border: "border-orange-500/30",
    text: "text-white",
    decorations: "halloween",
  },
  kidsDay: {
    name: "Dia das Crianças",
    icon: Baby,
    background: "from-sky-950 via-pink-950 to-yellow-950",
    accent: "from-sky-400 via-pink-400 to-yellow-400",
    accentMuted: "from-sky-500/80 via-pink-500/80 to-yellow-500/80",
    cardBg: "bg-sky-900/30",
    border: "border-pink-500/30",
    text: "text-white",
    decorations: "kidsDay",
  },
  worldCup: {
    name: "Copa do Mundo",
    icon: Trophy,
    background: "from-green-950 via-yellow-950 to-blue-950",
    accent: "from-green-500 via-yellow-400 to-blue-500",
    accentMuted: "from-green-600/80 via-yellow-500/80 to-blue-600/80",
    cardBg: "bg-green-900/30",
    border: "border-yellow-500/30",
    text: "text-white",
    decorations: "worldCup",
  },
};

// Cores personalizadas
const CUSTOM_COLORS = [
  { name: "Teal", value: "teal", gradient: "from-teal-500 to-emerald-500" },
  { name: "Azul", value: "blue", gradient: "from-blue-500 to-cyan-500" },
  { name: "Roxo", value: "purple", gradient: "from-purple-500 to-pink-500" },
  { name: "Rosa", value: "pink", gradient: "from-pink-500 to-rose-500" },
  { name: "Laranja", value: "orange", gradient: "from-orange-500 to-amber-500" },
  { name: "Verde", value: "green", gradient: "from-green-500 to-emerald-500" },
  { name: "Vermelho", value: "red", gradient: "from-red-500 to-rose-500" },
  { name: "Amarelo", value: "yellow", gradient: "from-yellow-400 to-amber-500" },
];

// Componente de decorações animadas
function Decorations({ type }: { type: string | null }) {
  if (!type) return null;

  const decorationElements = {
    christmas: (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-fall"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
            }}
          >
            <Snowflake className="h-6 w-6 text-white/30" />
          </div>
        ))}
      </div>
    ),
    snow: (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-fall"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
            }}
          >
            <div className="w-2 h-2 bg-white/40 rounded-full" />
          </div>
        ))}
      </div>
    ),
    hearts: (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          >
            <Heart className="h-8 w-8 text-pink-500/30 fill-pink-500/20" />
          </div>
        ))}
      </div>
    ),
    confetti: (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          >
            <div 
              className="w-3 h-3 rounded-sm"
              style={{
                backgroundColor: ['#FFD700', '#FF69B4', '#00FF00', '#FF4500', '#9400D3'][Math.floor(Math.random() * 5)],
                opacity: 0.6,
              }}
            />
          </div>
        ))}
      </div>
    ),
    fireworks: (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-sparkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 60}%`,
              animationDelay: `${Math.random() * 4}s`,
            }}
          >
            <Sparkles className="h-10 w-10 text-yellow-400/50" />
          </div>
        ))}
      </div>
    ),
    eggs: (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          >
            <div 
              className="w-6 h-8 rounded-full"
              style={{
                backgroundColor: ['#FFB6C1', '#98FB98', '#DDA0DD', '#87CEEB', '#FAFAD2'][Math.floor(Math.random() * 5)],
                opacity: 0.4,
              }}
            />
          </div>
        ))}
      </div>
    ),
    sun: (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-10 right-10 animate-pulse">
          <Sun className="h-32 w-32 text-yellow-400/30" />
        </div>
      </div>
    ),
    fairy: (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Estrelinhas mágicas de fundo */}
        {[...Array(30)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          >
            <Sparkles className="h-4 w-4 text-pink-300/40" />
          </div>
        ))}
        {/* Pó mágico flutuante */}
        {[...Array(20)].map((_, i) => (
          <div
            key={`dust-${i}`}
            className="absolute animate-fairy-dust"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 3}s`,
            }}
          >
            <div 
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: ['#FFB6C1', '#DDA0DD', '#E6E6FA', '#FFC0CB', '#F0E68C'][Math.floor(Math.random() * 5)],
                boxShadow: '0 0 6px 2px rgba(255, 182, 193, 0.6)',
              }}
            />
          </div>
        ))}
      </div>
    ),
    butterfly: (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Borboletas coloridas voando */}
        {[...Array(8)].map((_, i) => {
          const colors = [
            { wing: '#FF69B4', body: '#FF1493' }, // Rosa
            { wing: '#00CED1', body: '#008B8B' }, // Turquesa
            { wing: '#FFD700', body: '#FFA500' }, // Dourado
            { wing: '#9370DB', body: '#8A2BE2' }, // Roxo
            { wing: '#32CD32', body: '#228B22' }, // Verde
            { wing: '#FF6347', body: '#DC143C' }, // Coral
            { wing: '#87CEEB', body: '#4682B4' }, // Azul claro
            { wing: '#DDA0DD', body: '#BA55D3' }, // Lilás
          ];
          const color = colors[i % colors.length];
          const startX = Math.random() * 80 + 10;
          const startY = Math.random() * 60 + 20;
          return (
            <div
              key={`butterfly-${i}`}
              className="absolute"
              style={{
                left: `${startX}%`,
                top: `${startY}%`,
                animation: `butterfly-fly-${i % 4} ${8 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${i * 0.8}s`,
              }}
            >
              <svg width="50" height="40" viewBox="0 0 50 40" className="drop-shadow-lg">
                {/* Asa esquerda superior */}
                <ellipse cx="12" cy="12" rx="11" ry="10" fill={color.wing} opacity="0.8">
                  <animate attributeName="rx" values="11;9;11" dur="0.3s" repeatCount="indefinite" />
                </ellipse>
                {/* Asa esquerda inferior */}
                <ellipse cx="10" cy="26" rx="9" ry="8" fill={color.wing} opacity="0.7">
                  <animate attributeName="rx" values="9;7;9" dur="0.3s" repeatCount="indefinite" />
                </ellipse>
                {/* Asa direita superior */}
                <ellipse cx="38" cy="12" rx="11" ry="10" fill={color.wing} opacity="0.8">
                  <animate attributeName="rx" values="11;9;11" dur="0.3s" repeatCount="indefinite" />
                </ellipse>
                {/* Asa direita inferior */}
                <ellipse cx="40" cy="26" rx="9" ry="8" fill={color.wing} opacity="0.7">
                  <animate attributeName="rx" values="9;7;9" dur="0.3s" repeatCount="indefinite" />
                </ellipse>
                {/* Corpo */}
                <ellipse cx="25" cy="20" rx="3" ry="14" fill={color.body} />
                {/* Cabeça */}
                <circle cx="25" cy="5" r="4" fill={color.body} />
                {/* Antenas */}
                <line x1="23" y1="2" x2="20" y2="-3" stroke={color.body} strokeWidth="1" />
                <line x1="27" y1="2" x2="30" y2="-3" stroke={color.body} strokeWidth="1" />
                <circle cx="20" cy="-3" r="1.5" fill={color.body} />
                <circle cx="30" cy="-3" r="1.5" fill={color.body} />
                {/* Detalhes nas asas */}
                <circle cx="12" cy="12" r="4" fill="white" opacity="0.3" />
                <circle cx="38" cy="12" r="4" fill="white" opacity="0.3" />
              </svg>
            </div>
          );
        })}
        {/* Flores no fundo */}
        {[...Array(12)].map((_, i) => (
          <div
            key={`flower-${i}`}
            className="absolute animate-sway"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: `${Math.random() * 30}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          >
            <svg width="30" height="30" viewBox="0 0 30 30">
              {[0, 60, 120, 180, 240, 300].map((angle, j) => (
                <ellipse
                  key={j}
                  cx="15"
                  cy="8"
                  rx="5"
                  ry="8"
                  fill={['#FFB6C1', '#DDA0DD', '#87CEEB', '#98FB98', '#FAFAD2', '#FFD700'][j]}
                  opacity="0.5"
                  transform={`rotate(${angle} 15 15)`}
                />
              ))}
              <circle cx="15" cy="15" r="4" fill="#FFD700" opacity="0.6" />
            </svg>
          </div>
        ))}
        {/* Pólen flutuante */}
        {[...Array(20)].map((_, i) => (
          <div
            key={`pollen-${i}`}
            className="absolute animate-float-pollen"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 3}s`,
            }}
          >
            <div 
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: ['#FFD700', '#FFFACD', '#F0E68C'][Math.floor(Math.random() * 3)],
                opacity: 0.6,
                boxShadow: '0 0 4px 1px rgba(255, 215, 0, 0.4)',
              }}
            />
          </div>
        ))}
      </div>
    ),
    unicorn: (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Arco-íris no canto */}
        <div className="absolute top-0 right-0 w-96 h-96 opacity-30">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
              <linearGradient id="rainbow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF0000" />
                <stop offset="17%" stopColor="#FF7F00" />
                <stop offset="33%" stopColor="#FFFF00" />
                <stop offset="50%" stopColor="#00FF00" />
                <stop offset="67%" stopColor="#0000FF" />
                <stop offset="83%" stopColor="#4B0082" />
                <stop offset="100%" stopColor="#9400D3" />
              </linearGradient>
            </defs>
            <path d="M 200 0 Q 200 200 0 200" fill="none" stroke="url(#rainbow)" strokeWidth="20" />
          </svg>
        </div>
        {/* Estrelas coloridas */}
        {[...Array(25)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          >
            <Sparkles 
              className="h-5 w-5" 
              style={{ color: ['#FF69B4', '#00CED1', '#FFD700', '#9370DB', '#FF6347'][Math.floor(Math.random() * 5)] }}
            />
          </div>
        ))}
        {/* Nuvens fofas */}
        {[...Array(5)].map((_, i) => (
          <div
            key={`cloud-${i}`}
            className="absolute animate-float-slow"
            style={{
              left: `${10 + i * 20}%`,
              top: `${10 + Math.random() * 20}%`,
              animationDelay: `${i * 2}s`,
            }}
          >
            <div className="flex gap-1">
              <div className="w-12 h-8 bg-white/20 rounded-full" />
              <div className="w-16 h-10 bg-white/25 rounded-full -ml-4 -mt-2" />
              <div className="w-10 h-6 bg-white/20 rounded-full -ml-3 mt-1" />
            </div>
          </div>
        ))}
        {/* Corações flutuantes */}
        {[...Array(10)].map((_, i) => (
          <div
            key={`heart-${i}`}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
            }}
          >
            <Heart 
              className="h-6 w-6 fill-current" 
              style={{ color: ['#FFB6C1', '#DDA0DD', '#87CEEB', '#98FB98'][Math.floor(Math.random() * 4)] }}
            />
          </div>
        ))}
      </div>
    ),
    halloween: (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Abóboras flutuantes */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`pumpkin-${i}`}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          >
            <svg width="50" height="50" viewBox="0 0 50 50">
              <ellipse cx="25" cy="30" rx="20" ry="15" fill="#FF6B00" />
              <rect x="22" y="10" width="6" height="10" fill="#228B22" rx="2" />
              <ellipse cx="18" cy="28" rx="3" ry="4" fill="#FFD700" />
              <ellipse cx="32" cy="28" rx="3" ry="4" fill="#FFD700" />
              <path d="M 18 36 Q 25 42 32 36" stroke="#FFD700" strokeWidth="3" fill="none" />
            </svg>
          </div>
        ))}
        {/* Morcegos voando */}
        {[...Array(6)].map((_, i) => (
          <div
            key={`bat-${i}`}
            className="absolute"
            style={{
              left: `${Math.random() * 80 + 10}%`,
              top: `${Math.random() * 40 + 5}%`,
              animation: `bat-fly ${4 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          >
            <svg width="40" height="30" viewBox="0 0 40 30">
              <ellipse cx="20" cy="15" rx="5" ry="8" fill="#1a1a1a" />
              <path d="M 5 15 Q 10 5 15 15 Q 12 20 15 25" fill="#1a1a1a">
                <animate attributeName="d" values="M 5 15 Q 10 5 15 15 Q 12 20 15 25;M 8 15 Q 10 10 15 15 Q 12 18 15 22;M 5 15 Q 10 5 15 15 Q 12 20 15 25" dur="0.3s" repeatCount="indefinite" />
              </path>
              <path d="M 35 15 Q 30 5 25 15 Q 28 20 25 25" fill="#1a1a1a">
                <animate attributeName="d" values="M 35 15 Q 30 5 25 15 Q 28 20 25 25;M 32 15 Q 30 10 25 15 Q 28 18 25 22;M 35 15 Q 30 5 25 15 Q 28 20 25 25" dur="0.3s" repeatCount="indefinite" />
              </path>
              <circle cx="17" cy="12" r="2" fill="#FF0000" />
              <circle cx="23" cy="12" r="2" fill="#FF0000" />
            </svg>
          </div>
        ))}
        {/* Fantasmas */}
        {[...Array(4)].map((_, i) => (
          <div
            key={`ghost-${i}`}
            className="absolute animate-float-slow"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 60 + 20}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          >
            <Ghost className="h-12 w-12 text-white/40" />
          </div>
        ))}
        {/* Teias de aranha nos cantos */}
        <div className="absolute top-0 left-0 w-32 h-32 opacity-20">
          <svg viewBox="0 0 100 100">
            <path d="M 0 0 Q 50 20 100 0 M 0 0 Q 20 50 0 100 M 0 0 L 100 100" stroke="white" strokeWidth="1" fill="none" />
            <path d="M 0 30 Q 30 50 60 30 M 30 0 Q 50 30 30 60" stroke="white" strokeWidth="0.5" fill="none" />
          </svg>
        </div>
      </div>
    ),
    kidsDay: (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Balões coloridos */}
        {[...Array(15)].map((_, i) => {
          const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3'];
          const color = colors[i % colors.length];
          return (
            <div
              key={`balloon-${i}`}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                bottom: `-50px`,
                animation: `balloon-rise ${8 + Math.random() * 4}s ease-out infinite`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            >
              <svg width="40" height="60" viewBox="0 0 40 60">
                <ellipse cx="20" cy="20" rx="15" ry="20" fill={color} opacity="0.8" />
                <ellipse cx="20" cy="20" rx="10" ry="15" fill="white" opacity="0.2" />
                <polygon points="15,38 20,45 25,38" fill={color} />
                <line x1="20" y1="45" x2="20" y2="60" stroke={color} strokeWidth="1" />
              </svg>
            </div>
          );
        })}
        {/* Estrelas coloridas */}
        {[...Array(20)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          >
            <Sparkles 
              className="h-6 w-6" 
              style={{ color: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#AA96DA'][Math.floor(Math.random() * 4)] }}
            />
          </div>
        ))}
        {/* Confetes */}
        {[...Array(30)].map((_, i) => (
          <div
            key={`confetti-${i}`}
            className="absolute animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          >
            <div 
              className="w-3 h-3 rounded-sm"
              style={{
                backgroundColor: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA'][Math.floor(Math.random() * 6)],
                opacity: 0.7,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          </div>
        ))}
      </div>
    ),
    worldCup: (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Bandeiras do Brasil */}
        {[...Array(6)].map((_, i) => (
          <div
            key={`flag-${i}`}
            className="absolute animate-sway"
            style={{
              left: `${10 + i * 15}%`,
              top: `${5 + Math.random() * 10}%`,
              animationDelay: `${i * 0.3}s`,
            }}
          >
            <svg width="50" height="35" viewBox="0 0 50 35">
              <rect width="50" height="35" fill="#009C3B" />
              <polygon points="25,3 47,17.5 25,32 3,17.5" fill="#FFDF00" />
              <circle cx="25" cy="17.5" r="8" fill="#002776" />
              <path d="M 17 17.5 Q 25 13 33 17.5" stroke="white" strokeWidth="1.5" fill="none" />
            </svg>
          </div>
        ))}
        {/* Bolas de futebol */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`ball-${i}`}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `ball-bounce ${2 + Math.random()}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          >
            <svg width="30" height="30" viewBox="0 0 30 30">
              <circle cx="15" cy="15" r="14" fill="white" stroke="#333" strokeWidth="1" />
              <path d="M 15 1 L 15 8 M 15 22 L 15 29 M 1 15 L 8 15 M 22 15 L 29 15" stroke="#333" strokeWidth="1" />
              <circle cx="15" cy="15" r="5" fill="#333" />
            </svg>
          </div>
        ))}
        {/* Troféu dourado */}
        <div className="absolute top-5 right-10 animate-pulse">
          <Trophy className="h-20 w-20 text-yellow-400/40" />
        </div>
        {/* Confetes verde e amarelo */}
        {[...Array(25)].map((_, i) => (
          <div
            key={`confetti-${i}`}
            className="absolute animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          >
            <div 
              className="w-3 h-3 rounded-sm"
              style={{
                backgroundColor: ['#009C3B', '#FFDF00', '#002776', '#FFFFFF'][Math.floor(Math.random() * 4)],
                opacity: 0.6,
              }}
            />
          </div>
        ))}
      </div>
    ),
  };

  return decorationElements[type as keyof typeof decorationElements] || null;
}

// Componente de Fadas voando - ficam sempre visíveis no tema Fada
// Quando chama paciente, ficam mais empolgadas e voam até o nome
function FairyCallAnimation({ patientName, isCallingPatient, speed = 1 }: { patientName: string; isCallingPatient: boolean; speed?: number }) {
  const [phase, setPhase] = useState<'idle' | 'flying' | 'gathering' | 'celebrating'>('idle');
  const [time, setTime] = useState(0);
  
  // Apenas 2 fadas com posições iniciais diferentes
  const fairies = [
    { id: 0, startX: 15, startY: 30, wingColor: '#FFB6C1', dressColor: '#E6E6FA', hairColor: '#FFD700' },
    { id: 1, startX: 85, startY: 40, wingColor: '#87CEEB', dressColor: '#DDA0DD', hairColor: '#8B4513' },
  ];

  useEffect(() => {
    // Animação contínua para movimentos fluidos - velocidade ajustável
    const interval = setInterval(() => {
      setTime(t => t + 0.05 * speed);
    }, 50);
    
    return () => clearInterval(interval);
  }, []);

  // Quando começa a chamar paciente, muda as fases
  useEffect(() => {
    if (isCallingPatient) {
      setPhase('flying');
      // Fase 2: Após 1s, fadas começam a voar até o nome
      const gatherTimer = setTimeout(() => setPhase('gathering'), 1000);
      // Fase 3: Após 2.5s, fadas celebram ao redor do nome
      const celebrateTimer = setTimeout(() => setPhase('celebrating'), 2500);
      
      return () => {
        clearTimeout(gatherTimer);
        clearTimeout(celebrateTimer);
      };
    } else {
      setPhase('idle');
    }
  }, [isCallingPatient, patientName]);

  // Função para calcular movimento fluido de onda
  const getWaveOffset = (baseTime: number, offset: number) => ({
    x: Math.sin(baseTime + offset) * 20,
    y: Math.cos(baseTime * 0.7 + offset) * 15,
  });

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {/* Duas fadas com design mais realista */}
      {fairies.map((fairy, i) => {
        const wave = getWaveOffset(time, i * Math.PI);
        // No modo idle, fadas ficam voando livremente; quando chamando, vão até o nome
        const isIdleOrFlying = phase === 'idle' || phase === 'flying';
        const baseX = isIdleOrFlying ? fairy.startX : 50;
        const baseY = isIdleOrFlying ? fairy.startY : 35;
        const celebrateOffset = phase === 'celebrating' ? (i === 0 ? -120 : 120) : (i === 0 ? -80 : 80);
        
        return (
          <div
            key={fairy.id}
            className="absolute transition-all ease-out"
            style={{
              left: `calc(${baseX}% + ${isIdleOrFlying ? wave.x : 0}px)`,
              top: `calc(${baseY}% + ${isIdleOrFlying ? wave.y : 0}px)`,
              transform: !isIdleOrFlying 
                ? `translate(${celebrateOffset}px, -50%)` 
                : 'translate(-50%, -50%)',
              transitionDuration: isIdleOrFlying ? '0.1s' : '1.5s',
            }}
          >
            {/* Container da fada com animação de flutuação */}
            <div 
              className="relative"
              style={{
                animation: 'fairy-float 2s ease-in-out infinite',
                animationDelay: `${i * 0.5}s`,
              }}
            >
              {/* SVG da Fada Realista */}
              <svg 
                width="120" 
                height="140" 
                viewBox="0 0 120 140" 
                className="drop-shadow-2xl"
                style={{ filter: `drop-shadow(0 0 20px ${fairy.wingColor})` }}
              >
                {/* Asas traseiras (mais claras) */}
                <ellipse 
                  cx="30" cy="60" rx="28" ry="40" 
                  fill={fairy.wingColor} 
                  opacity="0.4"
                  style={{
                    transform: `rotate(${-15 + Math.sin(time * 8 + i) * 10}deg)`,
                    transformOrigin: '50px 60px',
                  }}
                />
                <ellipse 
                  cx="90" cy="60" rx="28" ry="40" 
                  fill={fairy.wingColor} 
                  opacity="0.4"
                  style={{
                    transform: `rotate(${15 - Math.sin(time * 8 + i) * 10}deg)`,
                    transformOrigin: '70px 60px',
                  }}
                />
                
                {/* Asas frontais (brilhantes) */}
                <ellipse 
                  cx="35" cy="55" rx="22" ry="32" 
                  fill={fairy.wingColor}
                  opacity="0.7"
                  style={{
                    transform: `rotate(${-10 + Math.sin(time * 8 + i) * 8}deg)`,
                    transformOrigin: '50px 60px',
                  }}
                >
                  <animate attributeName="opacity" values="0.7;0.9;0.7" dur="1s" repeatCount="indefinite" />
                </ellipse>
                <ellipse 
                  cx="85" cy="55" rx="22" ry="32" 
                  fill={fairy.wingColor}
                  opacity="0.7"
                  style={{
                    transform: `rotate(${10 - Math.sin(time * 8 + i) * 8}deg)`,
                    transformOrigin: '70px 60px',
                  }}
                >
                  <animate attributeName="opacity" values="0.7;0.9;0.7" dur="1s" repeatCount="indefinite" />
                </ellipse>
                
                {/* Detalhes das asas - veias */}
                <path 
                  d="M35 35 Q45 55 35 80" 
                  stroke="white" 
                  strokeWidth="1" 
                  fill="none" 
                  opacity="0.5"
                />
                <path 
                  d="M85 35 Q75 55 85 80" 
                  stroke="white" 
                  strokeWidth="1" 
                  fill="none" 
                  opacity="0.5"
                />
                
                {/* Corpo/Vestido */}
                <ellipse cx="60" cy="85" rx="12" ry="20" fill={fairy.dressColor} />
                <ellipse cx="60" cy="75" rx="10" ry="8" fill={fairy.dressColor} />
                
                {/* Detalhes do vestido */}
                <path 
                  d="M48 85 Q60 95 72 85" 
                  stroke="white" 
                  strokeWidth="1" 
                  fill="none" 
                  opacity="0.6"
                />
                <circle cx="60" cy="72" r="2" fill="white" opacity="0.8" />
                
                {/* Cabeça */}
                <circle cx="60" cy="50" r="14" fill="#FFE4C4" />
                
                {/* Cabelo */}
                <ellipse cx="60" cy="42" rx="16" ry="10" fill={fairy.hairColor} />
                <ellipse cx="48" cy="48" rx="4" ry="8" fill={fairy.hairColor} />
                <ellipse cx="72" cy="48" rx="4" ry="8" fill={fairy.hairColor} />
                
                {/* Rosto */}
                <circle cx="55" cy="48" r="2" fill="#4A4A4A" /> {/* Olho esquerdo */}
                <circle cx="65" cy="48" r="2" fill="#4A4A4A" /> {/* Olho direito */}
                <circle cx="56" cy="47" r="0.8" fill="white" /> {/* Brilho olho */}
                <circle cx="66" cy="47" r="0.8" fill="white" /> {/* Brilho olho */}
                <ellipse cx="60" cy="55" rx="3" ry="1.5" fill="#FF9999" /> {/* Boca sorrindo */}
                <circle cx="52" cy="52" r="2" fill="#FFB6C1" opacity="0.6" /> {/* Bochechas */}
                <circle cx="68" cy="52" r="2" fill="#FFB6C1" opacity="0.6" />
                
                {/* Varinha mágica */}
                <line x1="75" y1="70" x2="95" y2="50" stroke="#8B4513" strokeWidth="2" />
                <polygon points="95,45 92,52 98,52" fill="#FFD700" />
                
                {/* Brilho da varinha */}
                <circle cx="95" cy="48" r="4" fill="#FFD700" opacity="0.8">
                  <animate attributeName="r" values="4;6;4" dur="0.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;1;0.8" dur="0.5s" repeatCount="indefinite" />
                </circle>
                
                {/* Pernas */}
                <line x1="55" y1="100" x2="52" y2="120" stroke="#FFE4C4" strokeWidth="3" strokeLinecap="round" />
                <line x1="65" y1="100" x2="68" y2="120" stroke="#FFE4C4" strokeWidth="3" strokeLinecap="round" />
                
                {/* Sapatinhos */}
                <ellipse cx="50" cy="122" rx="5" ry="3" fill={fairy.dressColor} />
                <ellipse cx="70" cy="122" rx="5" ry="3" fill={fairy.dressColor} />
              </svg>
              
              {/* Emojis que a fada manda enquanto voa (idle ou flying) */}
              {(phase === 'idle' || phase === 'flying') && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span 
                    className="text-3xl block"
                    style={{ 
                      animation: 'float-up-fade 2s ease-out infinite',
                      animationDelay: `${i * 1}s`,
                    }}
                  >
                    {i === 0 ? '❤️' : '✨'}
                  </span>
                </div>
              )}
              
              {/* Fadas felizes celebrando */}
              {phase === 'celebrating' && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span 
                    className="text-4xl block"
                    style={{ animation: 'bounce 0.5s ease-in-out infinite' }}
                  >
                    {i === 0 ? '🎉' : '🎊'}
                  </span>
                </div>
              )}
              
              {/* Rastro de pó mágico mais suave */}
              <div className="absolute -z-10">
                {[...Array(6)].map((_, j) => (
                  <div
                    key={j}
                    className="absolute rounded-full"
                    style={{
                      left: `${-10 - j * 8}px`,
                      top: `${60 + Math.sin(time * 3 + j) * 10}px`,
                      width: `${8 - j}px`,
                      height: `${8 - j}px`,
                      backgroundColor: fairy.wingColor,
                      boxShadow: `0 0 ${10 - j}px ${fairy.wingColor}`,
                      opacity: 1 - j * 0.15,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {/* Efeitos mágicos quando celebrando */}
      {phase === 'celebrating' && (
        <>
          {/* Círculo de estrelas girando */}
          <div 
            className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ animation: 'spin 8s linear infinite' }}
          >
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  transform: `rotate(${i * 30}deg) translateY(-130px)`,
                }}
              >
                <Sparkles 
                  className="h-6 w-6 text-yellow-300" 
                  style={{ animation: 'pulse 1s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} 
                />
              </div>
            ))}
          </div>
          
          {/* Corações flutuando */}
          <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2">
            {[...Array(6)].map((_, i) => (
              <div
                key={`heart-${i}`}
                className="absolute"
                style={{
                  left: `${-80 + i * 35}px`,
                  animation: 'float-up-fade 2.5s ease-out infinite',
                  animationDelay: `${i * 0.4}s`,
                }}
              >
                <Heart className="h-8 w-8 text-pink-400 fill-pink-400" />
              </div>
            ))}
          </div>
          
          {/* Brilho central */}
          <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div 
              className="w-[400px] h-32 rounded-full"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(255,182,193,0.6) 0%, rgba(221,160,221,0.3) 50%, transparent 80%)',
                filter: 'blur(20px)',
                animation: 'pulse 2s ease-in-out infinite',
              }}
            />
          </div>
          
          {/* Pó mágico caindo */}
          {[...Array(25)].map((_, i) => (
            <div
              key={`dust-${i}`}
              className="absolute"
              style={{
                left: `${25 + Math.random() * 50}%`,
                top: '15%',
                animation: 'fairy-dust 3s ease-out infinite',
                animationDelay: `${Math.random() * 2}s`,
              }}
            >
              <div 
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: ['#FFD700', '#FFB6C1', '#87CEEB'][i % 3],
                  boxShadow: `0 0 8px ${['#FFD700', '#FFB6C1', '#87CEEB'][i % 3]}`,
                }}
              />
            </div>
          ))}
        </>
      )}
      
      {/* CSS para animações inline */}
      <style>{`
        @keyframes fairy-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float-up-fade {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-40px); opacity: 0; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fairy-dust {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(300px) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// Componente do Player de Mídia - Usa youtube-nocookie.com para melhor compatibilidade
function YouTubePlayer({ 
  videoUrl, 
  isPlaying, 
  onPlayPause,
  shouldPause,
  audioOnly = false
}: { 
  videoUrl: string;
  isPlaying: boolean;
  onPlayPause: () => void;
  shouldPause: boolean;
  audioOnly?: boolean;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Extrair ID do vídeo do YouTube - suporta vários formatos de URL
  const getVideoId = (url: string) => {
    // Formato youtu.be/ID
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return shortMatch[1];
    
    // Formato youtube.com/watch?v=ID
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) return watchMatch[1];
    
    // Formato youtube.com/embed/ID
    const embedMatch = url.match(/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch) return embedMatch[1];
    
    // Formato youtube.com/v/ID
    const vMatch = url.match(/\/v\/([a-zA-Z0-9_-]{11})/);
    if (vMatch) return vMatch[1];
    
    return null;
  };

  const videoId = getVideoId(videoUrl);
  
  // Usar youtube-nocookie.com para privacidade e melhor compatibilidade
  // Adicionar origin para permitir embed
  const embedUrl = videoId 
    ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&controls=1&modestbranding=1&rel=0&playsinline=1&mute=0`
    : null;

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [videoUrl]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (!videoId) {
    return (
      <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-800 flex items-center justify-center">
        <div className="text-center text-white">
          <Youtube className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <p className="text-xl">URL de vídeo inválida</p>
          <p className="text-sm text-slate-400 mt-2">Verifique a URL nas configurações</p>
        </div>
      </div>
    );
  }

  // Modo apenas áudio - esconde o vídeo mas mantém o áudio
  if (audioOnly) {
    return (
      <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-r from-slate-800 to-slate-900">
        {/* Iframe escondido para tocar áudio */}
        <iframe
          ref={iframeRef}
          src={embedUrl || ''}
          className="absolute w-1 h-1 opacity-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          title="YouTube Audio Player"
        />
        <div className="flex items-center gap-4 w-full p-4">
          <div className="p-3 rounded-full bg-red-500/20">
            <Music className="h-8 w-8 text-red-500" />
          </div>
          <div className="flex-1">
            <p className="text-white font-medium">Música de Fundo</p>
            <p className="text-slate-400 text-sm">
              {isLoading ? 'Carregando...' : 'Tocando em segundo plano'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isLoading && !hasError && (
              <div className="flex items-end gap-1 h-8">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-red-500 rounded-full animate-pulse"
                    style={{
                      height: `${12 + Math.random() * 20}px`,
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: '0.5s',
                    }}
                  />
                ))}
              </div>
            )}
            {isLoading && (
              <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Modo vídeo - exibe o player completo
  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black">
      {/* Iframe do YouTube */}
      <iframe
        ref={iframeRef}
        src={embedUrl || ''}
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        title="YouTube Video Player"
      />
      
      {/* Loading */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-lg">Carregando vídeo...</p>
          </div>
        </div>
      )}
      
      {/* Erro */}
      {hasError && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
          <div className="text-center text-white">
            <Youtube className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <p className="text-xl text-red-400">Erro ao carregar vídeo</p>
            <p className="text-sm text-slate-400 mt-2">Verifique a URL nas configurações</p>
          </div>
        </div>
      )}
      
      {/* Overlay quando paciente é chamado */}
      {shouldPause && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
          <div className="text-center text-white">
            <Bell className="h-20 w-20 mx-auto mb-4 animate-bounce text-yellow-400" />
            <p className="text-3xl font-bold">Paciente sendo chamado!</p>
          </div>
        </div>
      )}
    </div>
  );
}



export default function PainelTV() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastCallId, setLastCallId] = useState<number | null>(null);
  const [showCallAnimation, setShowCallAnimation] = useState(false);
  const [currentCall, setCurrentCall] = useState<any>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Configurações
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof SEASONAL_THEMES>("default");
  const [customColor, setCustomColor] = useState("teal");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeEnabled, setYoutubeEnabled] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [tempYoutubeUrl, setTempYoutubeUrl] = useState("");
  const [videoPausedByCall, setVideoPausedByCall] = useState(false);
  const [audioOnlyMode, setAudioOnlyMode] = useState(false);
  const [fairySpeed, setFairySpeed] = useState(1); // 0.5 = lento, 1 = normal, 2 = rápido
  const [clinicName, setClinicName] = useState("Dentrics");
  const [clinicLogo, setClinicLogo] = useState("");
  const [customMessages, setCustomMessages] = useState<string[]>([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [notificationSound, setNotificationSound] = useState<'bell' | 'chime' | 'ding' | 'magic' | 'none'>('bell');
  const [notificationVolume, setNotificationVolume] = useState(0.5);
  const [promoSlides, setPromoSlides] = useState<string[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slidesEnabled, setSlidesEnabled] = useState(false);
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Carregar configurações do localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("painelTV_theme");
    const savedColor = localStorage.getItem("painelTV_color");
    const savedYoutube = localStorage.getItem("painelTV_youtube");
    const savedAudioOnly = localStorage.getItem("painelTV_audioOnly");
    const savedClinicName = localStorage.getItem("painelTV_clinicName");
    const savedClinicLogo = localStorage.getItem("painelTV_clinicLogo");
    const savedMessages = localStorage.getItem("painelTV_messages");
    const savedSound = localStorage.getItem("painelTV_sound");
    const savedVolume = localStorage.getItem("painelTV_volume");
    const savedSlides = localStorage.getItem("painelTV_slides");
    const savedSlidesEnabled = localStorage.getItem("painelTV_slidesEnabled");
    
    if (savedTheme) setSelectedTheme(savedTheme as keyof typeof SEASONAL_THEMES);
    if (savedColor) setCustomColor(savedColor);
    if (savedAudioOnly === "true") setAudioOnlyMode(true);
    if (savedClinicName) setClinicName(savedClinicName);
    if (savedClinicLogo) setClinicLogo(savedClinicLogo);
    if (savedSound) setNotificationSound(savedSound as any);
    if (savedVolume) setNotificationVolume(parseFloat(savedVolume));
    if (savedSlidesEnabled === "true") setSlidesEnabled(true);
    if (savedMessages) {
      try {
        setCustomMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error("Erro ao carregar mensagens:", e);
      }
    }
    if (savedSlides) {
      try {
        setPromoSlides(JSON.parse(savedSlides));
      } catch (e) {
        console.error("Erro ao carregar slides:", e);
      }
    }
    if (savedYoutube) {
      setYoutubeUrl(savedYoutube);
      setYoutubeEnabled(true);
    }
  }, []);

  // Salvar configurações
  const saveSettings = () => {
    localStorage.setItem("painelTV_theme", selectedTheme);
    localStorage.setItem("painelTV_color", customColor);
    localStorage.setItem("painelTV_audioOnly", audioOnlyMode.toString());
    localStorage.setItem("painelTV_clinicName", clinicName);
    localStorage.setItem("painelTV_clinicLogo", clinicLogo);
    localStorage.setItem("painelTV_messages", JSON.stringify(customMessages));
    localStorage.setItem("painelTV_sound", notificationSound);
    localStorage.setItem("painelTV_volume", notificationVolume.toString());
    localStorage.setItem("painelTV_slides", JSON.stringify(promoSlides));
    localStorage.setItem("painelTV_slidesEnabled", slidesEnabled.toString());
    if (tempYoutubeUrl) {
      localStorage.setItem("painelTV_youtube", tempYoutubeUrl);
      setYoutubeUrl(tempYoutubeUrl);
      setYoutubeEnabled(true);
    }
    setSettingsOpen(false);
  };

  const removeYoutube = () => {
    localStorage.removeItem("painelTV_youtube");
    setYoutubeUrl("");
    setYoutubeEnabled(false);
    setTempYoutubeUrl("");
  };

  const theme = SEASONAL_THEMES[selectedTheme];
  const colorGradient = CUSTOM_COLORS.find(c => c.value === customColor)?.gradient || CUSTOM_COLORS[0].gradient;

  // Buscar chamadas ativas do painel TV
  const { data: activeCalls } = trpc.tvPanel.activeCalls.useQuery(undefined, {
    refetchInterval: 3000,
  });

  // Buscar fila de espera geral
  const { data: waitingQueue } = trpc.serviceQueue.list.useQuery(
    { queueType: undefined },
    { refetchInterval: 5000 }
  );

  // Filtrar apenas pacientes aguardando
  const waitingPatients = waitingQueue?.filter(p => p.status === "waiting") || [];
  const inServicePatients = waitingQueue?.filter(p => p.status === "in_service") || [];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Detectar nova chamada
  useEffect(() => {
    if (activeCalls && activeCalls.length > 0) {
      const latestCall = activeCalls[0];
      if (latestCall.id !== lastCallId) {
        setLastCallId(latestCall.id);
        setCurrentCall(latestCall);
        setShowCallAnimation(true);
        setVideoPausedByCall(true);
        
        // Cancelar timer anterior se existir
        if (resumeTimerRef.current) {
          clearTimeout(resumeTimerRef.current);
        }
        
        // Tocar som de chamada
        playNotificationSound();
        
        // Remover animação após 10 segundos
        setTimeout(() => setShowCallAnimation(false), 10000);
        
        // Retomar vídeo após 1 minuto sem novas chamadas
        resumeTimerRef.current = setTimeout(() => {
          setVideoPausedByCall(false);
          console.log("[Painel TV] Retomando vídeo após 1 minuto sem chamadas");
        }, 60000); // 60 segundos = 1 minuto
      }
    }
  }, [activeCalls, lastCallId]);

  // Limpar timer ao desmontar componente
  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
      }
    };
  }, []);

  // Rotação de mensagens personalizadas (a cada 10 segundos)
  useEffect(() => {
    if (customMessages.length > 1) {
      const messageTimer = setInterval(() => {
        setCurrentMessageIndex(prev => (prev + 1) % customMessages.length);
      }, 10000); // 10 segundos
      return () => clearInterval(messageTimer);
    }
  }, [customMessages.length]);

  // Rotação de slides promocionais (a cada 8 segundos)
  useEffect(() => {
    if (slidesEnabled && promoSlides.length > 1) {
      const slideTimer = setInterval(() => {
        setCurrentSlideIndex(prev => (prev + 1) % promoSlides.length);
      }, 8000); // 8 segundos
      return () => clearInterval(slideTimer);
    }
  }, [slidesEnabled, promoSlides.length]);

  const playNotificationSound = useCallback(() => {
    if (notificationSound === 'none') return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const volume = notificationVolume;
      
      // Diferentes tipos de som
      const playSoundSequence = (frequencies: number[], durations: number[], type: OscillatorType = 'sine') => {
        let time = audioContext.currentTime;
        frequencies.forEach((freq, i) => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.connect(gain);
          gain.connect(audioContext.destination);
          osc.type = type;
          osc.frequency.setValueAtTime(freq, time);
          gain.gain.setValueAtTime(volume * 0.5, time);
          gain.gain.exponentialRampToValueAtTime(0.01, time + durations[i]);
          osc.start(time);
          osc.stop(time + durations[i]);
          time += durations[i] * 0.8;
        });
      };
      
      switch (notificationSound) {
        case 'bell':
          // Som de sininho - 3 notas ascendentes
          playSoundSequence([523, 659, 784], [0.15, 0.15, 0.3], 'sine');
          break;
        case 'chime':
          // Som de carrilhão - melodia suave
          playSoundSequence([784, 988, 1175, 1319], [0.2, 0.2, 0.2, 0.4], 'triangle');
          break;
        case 'ding':
          // Som de ding simples
          playSoundSequence([880, 1100], [0.2, 0.3], 'sine');
          break;
        case 'magic':
          // Som mágico - para temas infantis
          playSoundSequence([523, 659, 784, 1047, 1319, 1568], [0.1, 0.1, 0.1, 0.1, 0.1, 0.4], 'sine');
          // Adiciona brilho
          setTimeout(() => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(2000, audioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(4000, audioContext.currentTime + 0.3);
            gain.gain.setValueAtTime(volume * 0.2, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            osc.start(audioContext.currentTime);
            osc.stop(audioContext.currentTime + 0.3);
          }, 400);
          break;
      }
    } catch (e) {
      console.log("Audio not supported");
    }
  }, [notificationSound, notificationVolume]);

  const getQueueTypeLabel = (type: string | null) => {
    const labels: Record<string, string> = {
      budget: "Orçamento",
      dentist: "Dentista",
      orthodontics: "Ortodontia",
      implant: "Implante",
      prosthetics: "Prótese",
      reception: "Recepção",
    };
    return labels[type || ""] || type || "Geral";
  };

  const getQueueTypeColor = (type: string | null) => {
    const colors: Record<string, string> = {
      budget: "bg-purple-500",
      dentist: "bg-blue-500",
      orthodontics: "bg-pink-500",
      implant: "bg-orange-500",
      prosthetics: "bg-teal-500",
      reception: "bg-green-500",
    };
    return colors[type || ""] || "bg-slate-500";
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.background} ${theme.text} overflow-hidden relative`}>
      {/* Decorações do tema */}
      <Decorations type={theme.decorations} />

      {/* Fadas voando - ficam sempre visíveis no tema Fada */}
      {selectedTheme === 'fairy' && (
        <FairyCallAnimation 
          patientName={currentCall?.patientName || ''} 
          isCallingPatient={showCallAnimation}
          speed={fairySpeed}
        />
      )}

      {/* Header */}
      <header className={`flex items-center justify-between p-6 border-b ${theme.border} relative z-10`}>
        <div className="flex items-center gap-4">
          {clinicLogo ? (
            <img src={clinicLogo} alt={clinicName} className="w-14 h-14 rounded-xl object-cover shadow-lg" />
          ) : (
            <div className={`w-14 h-14 bg-gradient-to-br ${colorGradient} rounded-xl flex items-center justify-center shadow-lg`}>
              <span className="text-3xl">🦷</span>
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              {clinicName}
            </h1>
            <p className="text-slate-400 text-sm">Sistema de Gestão Odontológica</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Botão de Configurações */}
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="bg-black/40 hover:bg-black/60 text-white shadow-lg border border-white/20 h-12 w-12"
              >
                <Settings className="h-6 w-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações do Painel TV
                </DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="theme" className="mt-4">
                <TabsList className="grid w-full grid-cols-7">
                  <TabsTrigger value="clinic">Clínica</TabsTrigger>
                  <TabsTrigger value="theme">Tema</TabsTrigger>
                  <TabsTrigger value="colors">Cores</TabsTrigger>
                  <TabsTrigger value="sound">Som</TabsTrigger>
                  <TabsTrigger value="messages">Avisos</TabsTrigger>
                  <TabsTrigger value="slides">Slides</TabsTrigger>
                  <TabsTrigger value="youtube">YouTube</TabsTrigger>
                </TabsList>
                
                <TabsContent value="clinic" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div>
                      <Label>Nome da Clínica</Label>
                      <Input
                        value={clinicName}
                        onChange={(e) => setClinicName(e.target.value)}
                        placeholder="Digite o nome da sua clínica"
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Este nome aparecerá no cabeçalho do Painel TV</p>
                    </div>
                    <div>
                      <Label>Logo da Clínica</Label>
                      <div className="mt-2 space-y-3">
                        {/* Upload de arquivo */}
                        <div className="flex items-center gap-2">
                          <label className="flex-1">
                            <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-teal-500 hover:bg-teal-500/10 transition-all">
                              <Upload className="h-5 w-5 text-slate-400" />
                              <span className="text-sm text-slate-400">Clique para enviar uma imagem</span>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setClinicLogo(reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                        {/* Ou URL */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">ou cole uma URL:</span>
                          <Input
                            value={clinicLogo.startsWith('data:') ? '' : clinicLogo}
                            onChange={(e) => setClinicLogo(e.target.value)}
                            placeholder="https://exemplo.com/logo.png"
                            className="flex-1"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Envie uma imagem do seu dispositivo ou cole uma URL. Deixe vazio para usar o ícone padrão.</p>
                      </div>
                    </div>
                    {clinicLogo && (
                      <div className="mt-4">
                        <Label>Pré-visualização</Label>
                        <div className="mt-2 flex items-center gap-4 p-4 bg-slate-800 rounded-lg">
                          <img src={clinicLogo} alt="Logo" className="w-14 h-14 rounded-xl object-cover" />
                          <div className="flex-1">
                            <p className="font-bold text-white">{clinicName}</p>
                            <p className="text-sm text-slate-400">Sistema de Gestão Odontológica</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
                            onClick={() => setClinicLogo('')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="theme" className="space-y-4 mt-4">
                  <Label>Tema Sazonal</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(SEASONAL_THEMES).map(([key, themeOption]) => {
                      const ThemeIcon = themeOption.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => setSelectedTheme(key as keyof typeof SEASONAL_THEMES)}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            selectedTheme === key
                              ? 'border-teal-500 bg-teal-500/20'
                              : 'border-slate-600 hover:border-slate-500'
                          }`}
                        >
                          <ThemeIcon className="h-6 w-6 mx-auto mb-2" />
                          <span className="text-sm">{themeOption.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Controle de velocidade das fadas - só aparece no tema Fada */}
                  {selectedTheme === 'fairy' && (
                    <div className="mt-6 p-4 bg-purple-900/30 border border-purple-500/30 rounded-lg">
                      <Label className="flex items-center gap-2 mb-3">
                        <Wand2 className="h-4 w-4 text-pink-400" />
                        Velocidade das Fadas
                      </Label>
                      <div className="flex gap-2">
                        {[
                          { value: 0.5, label: 'Lento' },
                          { value: 1, label: 'Normal' },
                          { value: 1.5, label: 'Rápido' },
                          { value: 2, label: 'Muito Rápido' },
                        ].map((option) => (
                          <Button
                            key={option.value}
                            variant={fairySpeed === option.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFairySpeed(option.value)}
                            className="flex-1"
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="colors" className="space-y-4 mt-4">
                  <Label>Cor de Destaque</Label>
                  <div className="grid grid-cols-4 gap-3">
                    {CUSTOM_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setCustomColor(color.value)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          customColor === color.value
                            ? 'border-white'
                            : 'border-transparent hover:border-slate-500'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full mx-auto mb-2 bg-gradient-to-r ${color.gradient}`} />
                        <span className="text-sm">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="sound" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div>
                      <Label>Som de Notificação</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Escolha o som que tocará quando um paciente for chamado.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { value: 'bell', label: 'Sininho', icon: Bell },
                        { value: 'chime', label: 'Carrilhão', icon: Music },
                        { value: 'ding', label: 'Ding', icon: Volume2 },
                        { value: 'magic', label: 'Mágico', icon: Sparkles },
                        { value: 'none', label: 'Sem Som', icon: VolumeX },
                      ].map((option) => {
                        const Icon = option.icon;
                        return (
                          <Button
                            key={option.value}
                            variant={notificationSound === option.value ? "default" : "outline"}
                            className="flex flex-col gap-1 h-auto py-3"
                            onClick={() => setNotificationSound(option.value as any)}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="text-xs">{option.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Volume</Label>
                        <span className="text-sm text-muted-foreground">{Math.round(notificationVolume * 100)}%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Volume1 className="h-4 w-4 text-muted-foreground" />
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={notificationVolume}
                          onChange={(e) => setNotificationVolume(parseFloat(e.target.value))}
                          className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <Volume2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      onClick={() => playNotificationSound()}
                      className="w-full"
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Testar Som
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="messages" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div>
                      <Label>Mensagens e Avisos</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Adicione mensagens que serão exibidas no painel. As mensagens alternam automaticamente a cada 10 segundos.
                      </p>
                    </div>
                    
                    {/* Lista de mensagens existentes */}
                    {customMessages.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm">Mensagens cadastradas ({customMessages.length})</Label>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {customMessages.map((msg, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-slate-800 rounded-lg">
                              <span className="flex-1 text-sm truncate">{msg}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/30"
                                onClick={() => {
                                  setCustomMessages(prev => prev.filter((_, i) => i !== index));
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Adicionar nova mensagem */}
                    <div className="space-y-2">
                      <Label>Adicionar nova mensagem</Label>
                      <div className="flex gap-2">
                        <Input
                          id="newMessage"
                          placeholder="Digite sua mensagem ou aviso..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const input = e.target as HTMLInputElement;
                              if (input.value.trim()) {
                                setCustomMessages(prev => [...prev, input.value.trim()]);
                                input.value = '';
                              }
                            }
                          }}
                        />
                        <Button
                          onClick={() => {
                            const input = document.getElementById('newMessage') as HTMLInputElement;
                            if (input && input.value.trim()) {
                              setCustomMessages(prev => [...prev, input.value.trim()]);
                              input.value = '';
                            }
                          }}
                        >
                          Adicionar
                        </Button>
                      </div>
                    </div>
                    
                    {/* Exemplos de mensagens */}
                    <div className="p-4 bg-teal-900/20 border border-teal-500/30 rounded-lg">
                      <Label className="text-teal-400 text-sm">Sugestões de mensagens</Label>
                      <div className="mt-2 space-y-1 text-xs text-slate-400">
                        <p>• "Bem-vindos à nossa clínica! Aguarde ser chamado."</p>
                        <p>• "Wi-Fi: NomeDaRede | Senha: 12345678"</p>
                        <p>• "Horário de funcionamento: Seg-Sex 8h-18h"</p>
                        <p>• "Promoção: Clareamento dental com 20% de desconto!"</p>
                        <p>• "Mantenha o celular no silencioso, por favor."</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="slides" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div>
                      <Label>Slides Promocionais</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Adicione imagens promocionais da clínica que serão exibidas em rotação no painel.
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                      <div>
                        <Label>Ativar Slides</Label>
                        <p className="text-xs text-slate-400">Exibe imagens promocionais no painel</p>
                      </div>
                      <Button
                        variant={slidesEnabled ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSlidesEnabled(!slidesEnabled)}
                      >
                        {slidesEnabled ? "Ativado" : "Desativado"}
                      </Button>
                    </div>
                    
                    {/* Lista de slides existentes */}
                    {promoSlides.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm">Imagens cadastradas ({promoSlides.length})</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {promoSlides.map((slide, index) => (
                            <div key={index} className="relative group">
                              <img 
                                src={slide} 
                                alt={`Slide ${index + 1}`} 
                                className="w-full h-20 object-cover rounded-lg"
                              />
                              <Button
                                variant="destructive"
                                size="sm"
                                className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  setPromoSlides(prev => prev.filter((_, i) => i !== index));
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Upload de nova imagem */}
                    <div className="space-y-2">
                      <Label>Adicionar imagem</Label>
                      <div className="flex gap-2">
                        <label className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-600 rounded-lg hover:border-slate-500 transition-colors">
                            <ImagePlus className="h-5 w-5 text-slate-400" />
                            <span className="text-sm text-slate-400">Clique para enviar uma imagem</span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  if (event.target?.result) {
                                    setPromoSlides(prev => [...prev, event.target!.result as string]);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-slate-400">
                        ou cole uma URL de imagem:
                      </p>
                      <div className="flex gap-2">
                        <Input
                          id="slideUrl"
                          placeholder="https://exemplo.com/imagem.jpg"
                        />
                        <Button
                          onClick={() => {
                            const input = document.getElementById('slideUrl') as HTMLInputElement;
                            if (input && input.value.trim()) {
                              setPromoSlides(prev => [...prev, input.value.trim()]);
                              input.value = '';
                            }
                          }}
                        >
                          Adicionar
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-teal-900/30 border border-teal-500/30 rounded-lg">
                      <p className="text-xs text-teal-400">
                        💡 Dica: As imagens alternam automaticamente a cada 8 segundos. Use imagens com resolução 16:9 para melhor visualização.
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="youtube" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>URL do YouTube</Label>
                    <Input
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={tempYoutubeUrl || youtubeUrl}
                      onChange={(e) => setTempYoutubeUrl(e.target.value)}
                    />
                    <p className="text-xs text-slate-400">
                      Cole a URL de um vídeo ou playlist do YouTube
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                    <div>
                      <Label>Modo Apenas Áudio</Label>
                      <p className="text-xs text-slate-400">Toca apenas o som, sem exibir o vídeo</p>
                    </div>
                    <Button
                      variant={audioOnlyMode ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAudioOnlyMode(!audioOnlyMode)}
                    >
                      {audioOnlyMode ? "Ativado" : "Desativado"}
                    </Button>
                  </div>
                  
                  {/* Botão para desativar YouTube */}
                  {youtubeEnabled && youtubeUrl && (
                    <div className="flex items-center justify-between p-4 bg-red-900/30 border border-red-500/30 rounded-lg">
                      <div>
                        <Label className="text-red-400">Desativar YouTube</Label>
                        <p className="text-xs text-slate-400">Remove o vídeo/música do painel</p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={removeYoutube}
                      >
                        Desativar
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={saveSettings}>
                  Salvar Configurações
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <div className="text-right">
            <div className="text-6xl font-extralight tabular-nums tracking-tight">
              {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-slate-400 text-lg capitalize">
              {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6 grid grid-cols-12 gap-6 h-[calc(100vh-140px)] relative z-10">
        {/* Área Principal */}
        <div className="col-span-8 flex flex-col gap-6">
          {/* Slides Promocionais */}
          {slidesEnabled && promoSlides.length > 0 && !showCallAnimation && !youtubeEnabled && (
            <div className="flex-1 rounded-3xl overflow-hidden shadow-2xl relative">
              <img 
                src={promoSlides[currentSlideIndex]} 
                alt={`Slide ${currentSlideIndex + 1}`}
                className="w-full h-full object-cover animate-fade-in"
                key={currentSlideIndex}
              />
              {/* Indicadores de slide */}
              {promoSlides.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {promoSlides.map((_, index) => (
                    <div 
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentSlideIndex 
                          ? 'bg-white w-6' 
                          : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* YouTube Player ou Card de Chamada */}
          {youtubeEnabled && youtubeUrl && !showCallAnimation ? (
            <div className={`${audioOnlyMode ? '' : 'flex-1'} rounded-3xl overflow-hidden shadow-2xl`}>
              <YouTubePlayer
                videoUrl={youtubeUrl}
                isPlaying={isVideoPlaying}
                onPlayPause={() => setIsVideoPlaying(!isVideoPlaying)}
                shouldPause={videoPausedByCall}
                audioOnly={audioOnlyMode}
              />
            </div>
          ) : null}
          
          {/* Card de Chamada (sempre visível no modo áudio ou quando não há YouTube) */}
          {(!youtubeEnabled || !youtubeUrl || showCallAnimation || audioOnlyMode) && (
            <div className={`flex-1 rounded-3xl p-8 shadow-2xl transition-all duration-500 bg-gradient-to-r ${
              showCallAnimation 
                ? colorGradient + ' scale-[1.02]' 
                : theme.accentMuted
            }`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-full bg-white/20 ${showCallAnimation ? 'animate-pulse' : ''}`}>
                  <Bell className="h-8 w-8" />
                </div>
                <span className="text-2xl font-semibold tracking-wide">
                  {showCallAnimation ? 'CHAMANDO AGORA' : 'ÚLTIMA CHAMADA'}
                </span>
                {showCallAnimation && (
                  <div className="ml-auto flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                    <Volume2 className="h-5 w-5 animate-pulse" />
                    <span className="text-sm font-medium">Som ativo</span>
                  </div>
                )}
              </div>
              
              {currentCall ? (
                <div className="space-y-6">
                  <div className={`text-7xl font-bold tracking-tight ${showCallAnimation ? 'animate-pulse' : ''}`}>
                    {currentCall.patientName}
                  </div>
                  <div className="flex items-center gap-6 text-2xl">
                    <div className="flex items-center gap-3 bg-white/20 px-6 py-3 rounded-xl">
                      <MapPin className="h-7 w-7" />
                      <span className="font-semibold">{currentCall.officeName || "Consultório"}</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white/20 px-6 py-3 rounded-xl">
                      <Users className="h-7 w-7" />
                      <span>{currentCall.professionalName || "Profissional"}</span>
                    </div>
                  </div>
                  <div className="text-xl text-white/80 mt-4">
                    Por favor, dirija-se ao local indicado
                  </div>
                </div>
              ) : (
                <div className="text-4xl text-white/70">
                  Aguardando próxima chamada...
                </div>
              )}
            </div>
          )}

          {/* Overlay de chamada sobre o YouTube */}
          {youtubeEnabled && showCallAnimation && (
            <div className={`absolute inset-6 rounded-3xl p-8 shadow-2xl bg-gradient-to-r ${colorGradient} z-20 flex flex-col justify-center`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-full bg-white/20 animate-pulse">
                  <Bell className="h-8 w-8" />
                </div>
                <span className="text-2xl font-semibold tracking-wide">CHAMANDO AGORA</span>
                <div className="ml-auto flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                  <Volume2 className="h-5 w-5 animate-pulse" />
                  <span className="text-sm font-medium">Som ativo</span>
                </div>
              </div>
              
              {currentCall && (
                <div className="space-y-6">
                  <div className="text-7xl font-bold tracking-tight animate-pulse">
                    {currentCall.patientName}
                  </div>
                  <div className="flex items-center gap-6 text-2xl">
                    <div className="flex items-center gap-3 bg-white/20 px-6 py-3 rounded-xl">
                      <MapPin className="h-7 w-7" />
                      <span className="font-semibold">{currentCall.officeName || "Consultório"}</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white/20 px-6 py-3 rounded-xl">
                      <Users className="h-7 w-7" />
                      <span>{currentCall.professionalName || "Profissional"}</span>
                    </div>
                  </div>
                  <div className="text-xl text-white/80 mt-4">
                    Por favor, dirija-se ao local indicado
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chamadas Ativas */}
          {activeCalls && activeCalls.length > 1 && !showCallAnimation && (
            <div className={`${theme.cardBg} rounded-2xl p-6 border ${theme.border}`}>
              <h3 className="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5 text-teal-400" />
                Outras Chamadas Ativas
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {activeCalls.slice(1, 5).map((call) => (
                  <div key={call.id} className="bg-slate-700/50 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-lg">{call.patientName}</div>
                      <div className="text-slate-400 text-sm">{call.professionalName}</div>
                    </div>
                    <div className="flex items-center gap-2 text-teal-400">
                      <MapPin className="h-5 w-5" />
                      <span className="font-medium">{call.officeName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className={`${theme.cardBg} rounded-xl p-5 border ${theme.border}`}>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-amber-400" />
                <span className="text-slate-400 text-sm">Na Fila</span>
              </div>
              <div className="text-4xl font-bold text-amber-400">{waitingPatients.length}</div>
            </div>
            <div className={`${theme.cardBg} rounded-xl p-5 border ${theme.border}`}>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-emerald-400" />
                <span className="text-slate-400 text-sm">Em Atendimento</span>
              </div>
              <div className="text-4xl font-bold text-emerald-400">{inServicePatients.length}</div>
            </div>
            <div className={`${theme.cardBg} rounded-xl p-5 border ${theme.border}`}>
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-5 w-5 text-teal-400" />
                <span className="text-slate-400 text-sm">Chamados</span>
              </div>
              <div className="text-4xl font-bold text-teal-400">{activeCalls?.length || 0}</div>
            </div>
          </div>
        </div>

        {/* Fila de Espera */}
        <div className={`col-span-4 ${theme.cardBg} rounded-2xl border ${theme.border} flex flex-col`}>
          <div className={`p-5 border-b ${theme.border}`}>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-teal-400" />
              Fila de Espera
            </h2>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {waitingPatients.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <Users className="h-16 w-16 mb-4 opacity-30" />
                <p className="text-lg">Nenhum paciente na fila</p>
              </div>
            ) : (
              <div className="space-y-3">
                {waitingPatients.slice(0, 15).map((item, index) => (
                  <div 
                    key={item.id}
                    className={`p-4 rounded-xl transition-all ${
                      index === 0 
                        ? `bg-gradient-to-r ${colorGradient}/20 border border-teal-500/30` 
                        : 'bg-slate-700/30 hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? `bg-gradient-to-r ${colorGradient} text-white` : 'bg-slate-600 text-slate-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.patientName}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getQueueTypeColor(item.queueType)} text-white`}>
                            {getQueueTypeLabel(item.queueType)}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(item.arrivalTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      {item.priority === "urgent" && (
                        <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                          Urgente
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer com Mensagens Personalizadas */}
      <footer className={`absolute bottom-0 left-0 right-0 border-t ${theme.border} bg-slate-900/80 z-10`}>
        {/* Área de mensagens personalizadas */}
        {customMessages.length > 0 && (
          <div className={`px-6 py-4 bg-gradient-to-r ${colorGradient}/20 border-b ${theme.border}`}>
            <div className="flex items-center justify-center gap-3">
              <Bell className="h-5 w-5 text-teal-400 flex-shrink-0" />
              <p className="text-lg font-medium text-white text-center animate-fade-in" key={currentMessageIndex}>
                {customMessages[currentMessageIndex]}
              </p>
            </div>
            {customMessages.length > 1 && (
              <div className="flex justify-center gap-1 mt-2">
                {customMessages.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentMessageIndex ? 'bg-teal-400 w-4' : 'bg-slate-600'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        {/* Texto padrão do footer */}
        <div className="p-3 text-center text-slate-500 text-sm">
          <p>Mantenha seu celular em mãos para receber notificações • Atualização automática a cada 3 segundos</p>
        </div>
      </footer>

      {/* CSS para animações */}
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }
        @keyframes confetti {
          0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes fairy-dust {
          0% { transform: translateY(-20px) translateX(0); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateY(100vh) translateX(50px); opacity: 0; }
        }
        @keyframes fairy-fly {
          0% { 
            transform: translate(0, 0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          50% {
            transform: translate(var(--target-x), var(--target-y)) scale(1.5);
          }
          80% {
            transform: translate(var(--target-x), var(--target-y)) scale(1.2);
            opacity: 1;
          }
          100% {
            transform: translate(var(--target-x), var(--target-y)) scale(1);
            opacity: 0.8;
          }
        }
        @keyframes fairy-glow {
          0%, 100% { 
            filter: drop-shadow(0 0 8px rgba(255, 182, 193, 0.8));
          }
          50% { 
            filter: drop-shadow(0 0 20px rgba(255, 105, 180, 1)) drop-shadow(0 0 40px rgba(255, 182, 193, 0.6));
          }
        }
        @keyframes fairy-trail {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.3); }
        }
        @keyframes fairy-wander {
          0%, 100% { transform: translate(0, 0) rotate(-5deg); }
          25% { transform: translate(30px, -20px) rotate(5deg); }
          50% { transform: translate(-20px, -40px) rotate(-10deg); }
          75% { transform: translate(40px, -10px) rotate(8deg); }
        }
        @keyframes float-up {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-30px) scale(1.2); opacity: 0; }
        }
        @keyframes float-up-fade {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-80px); opacity: 0; }
        }
        @keyframes sparkle-burst {
          0% { transform: scale(0) rotate(0deg); opacity: 0; }
          50% { transform: scale(1.5) rotate(180deg); opacity: 1; }
          100% { transform: scale(0) rotate(360deg); opacity: 0; }
        }
        @keyframes spin-slow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .animate-fall { animation: fall linear infinite; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-confetti { animation: confetti linear infinite; }
        .animate-sparkle { animation: sparkle 2s ease-in-out infinite; }
        .animate-twinkle { animation: twinkle 2s ease-in-out infinite; }
        .animate-fairy-dust { animation: fairy-dust linear infinite; }
        .animate-fairy-fly { animation: fairy-fly 2s ease-out forwards; }
        .animate-fairy-glow { animation: fairy-glow 1s ease-in-out infinite; }
        .animate-fairy-trail { animation: fairy-trail 0.5s ease-out forwards; }
        .animate-fairy-wander { animation: fairy-wander 4s ease-in-out infinite; }
        .animate-float-up { animation: float-up 1.5s ease-out infinite; }
        .animate-float-up-fade { animation: float-up-fade 2s ease-out infinite; }
        .animate-sparkle-burst { animation: sparkle-burst 1s ease-out infinite; }
        .animate-spin-slow { animation: spin-slow 10s linear infinite; }
        
        /* Animação fade-in para mensagens */
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        
        /* Animações das Borboletas */
        @keyframes butterfly-fly-0 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(100px, -50px) rotate(10deg); }
          50% { transform: translate(200px, 20px) rotate(-5deg); }
          75% { transform: translate(50px, -30px) rotate(15deg); }
        }
        @keyframes butterfly-fly-1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-80px, 40px) rotate(-10deg); }
          50% { transform: translate(-150px, -20px) rotate(5deg); }
          75% { transform: translate(-50px, 60px) rotate(-15deg); }
        }
        @keyframes butterfly-fly-2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(60px, 80px) rotate(15deg); }
          50% { transform: translate(-40px, 120px) rotate(-10deg); }
          75% { transform: translate(80px, 40px) rotate(5deg); }
        }
        @keyframes butterfly-fly-3 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-120px, -60px) rotate(-15deg); }
          50% { transform: translate(30px, -100px) rotate(10deg); }
          75% { transform: translate(-60px, -40px) rotate(-5deg); }
        }
        @keyframes sway {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        @keyframes float-pollen {
          0%, 100% { transform: translate(0, 0); opacity: 0.6; }
          25% { transform: translate(20px, -30px); opacity: 0.8; }
          50% { transform: translate(-10px, -50px); opacity: 0.4; }
          75% { transform: translate(30px, -20px); opacity: 0.7; }
        }
        .animate-sway { animation: sway 3s ease-in-out infinite; }
        .animate-float-pollen { animation: float-pollen 5s ease-in-out infinite; }
        
        /* Animações Halloween */
        @keyframes bat-fly {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(50px, -30px) rotate(10deg); }
          50% { transform: translate(100px, 10px) rotate(-5deg); }
          75% { transform: translate(30px, -20px) rotate(5deg); }
        }
        
        /* Animações Dia das Crianças */
        @keyframes balloon-rise {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-120vh) rotate(20deg); opacity: 0; }
        }
        
        /* Animações Copa do Mundo */
        @keyframes ball-bounce {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
      `}</style>
    </div>
  );
}

// Declaração para TypeScript do YouTube API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}
