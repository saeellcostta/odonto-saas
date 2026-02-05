import { useEffect, useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count: number;
  hasNew?: boolean;
  className?: string;
  onClick?: () => void;
}

export function NotificationBadge({ count, hasNew = false, className, onClick }: NotificationBadgeProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (hasNew) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [hasNew, count]);

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative inline-flex items-center justify-center p-2 rounded-full transition-all',
        'hover:bg-muted',
        isAnimating && 'animate-bounce',
        className
      )}
    >
      {isAnimating ? (
        <BellRing className="h-5 w-5 text-orange-500 animate-wiggle" />
      ) : (
        <Bell className="h-5 w-5" />
      )}
      
      {count > 0 && (
        <span className={cn(
          'absolute -top-1 -right-1 flex items-center justify-center',
          'min-w-[18px] h-[18px] px-1 text-xs font-bold rounded-full',
          'bg-red-500 text-white',
          isAnimating && 'animate-pulse'
        )}>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}

// Componente de indicador de nova ação
export function NewActionIndicator({ show, label }: { show: boolean; label?: string }) {
  if (!show) return null;

  return (
    <div className="absolute -top-1 -right-1 flex items-center gap-1">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500" />
      </span>
      {label && (
        <span className="text-xs font-medium text-orange-500 bg-orange-100 dark:bg-orange-950 px-1.5 py-0.5 rounded">
          {label}
        </span>
      )}
    </div>
  );
}

// Componente de overlay de chamada
export function CallOverlay({ 
  show, 
  patientName, 
  officeName, 
  onDismiss 
}: { 
  show: boolean; 
  patientName: string; 
  officeName: string;
  onDismiss?: () => void;
}) {
  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onDismiss}
    >
      <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-3xl p-8 shadow-2xl max-w-lg w-full mx-4 animate-in zoom-in-95 duration-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-white/20 animate-pulse">
            <BellRing className="h-8 w-8 text-white" />
          </div>
          <span className="text-xl font-semibold text-white tracking-wide">
            CHAMANDO PACIENTE
          </span>
        </div>
        
        <div className="text-4xl font-bold text-white mb-4 animate-pulse">
          {patientName}
        </div>
        
        <div className="flex items-center gap-2 text-white/90">
          <span className="bg-white/20 px-4 py-2 rounded-lg">
            📍 {officeName}
          </span>
        </div>
        
        <p className="text-white/70 mt-4 text-sm">
          Clique para fechar
        </p>
      </div>
    </div>
  );
}

// Componente de toast de notificação customizado
export function NotificationToast({
  title,
  message,
  type,
  icon,
  onClose,
}: {
  title: string;
  message?: string;
  type: 'call' | 'return' | 'new' | 'info';
  icon?: React.ReactNode;
  onClose?: () => void;
}) {
  const bgColors = {
    call: 'bg-gradient-to-r from-orange-500 to-amber-500',
    return: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    new: 'bg-gradient-to-r from-green-500 to-emerald-500',
    info: 'bg-gradient-to-r from-slate-500 to-slate-600',
  };

  return (
    <div 
      className={cn(
        'fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl text-white max-w-sm',
        'animate-in slide-in-from-right duration-300',
        bgColors[type]
      )}
      onClick={onClose}
    >
      <div className="flex items-start gap-3">
        {icon && <div className="text-2xl">{icon}</div>}
        <div>
          <h4 className="font-bold">{title}</h4>
          {message && <p className="text-sm text-white/80 mt-1">{message}</p>}
        </div>
      </div>
    </div>
  );
}

export default NotificationBadge;
