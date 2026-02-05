import { useCallback, useRef, useEffect, useState } from 'react';
import { toast } from 'sonner';

export type NotificationType = 
  | 'patient_call'      // Paciente sendo chamado
  | 'patient_return'    // Paciente retornou de atendimento
  | 'new_patient'       // Novo paciente na fila
  | 'queue_update'      // Atualização na fila
  | 'urgent'            // Notificação urgente
  | 'success'           // Sucesso
  | 'info';             // Informação

export interface NotificationOptions {
  title: string;
  message?: string;
  type: NotificationType;
  duration?: number;
  playSound?: boolean;
  showVisual?: boolean;
  patientName?: string;
  officeName?: string;
}

// Frequências para diferentes tipos de notificação
const SOUND_FREQUENCIES: Record<NotificationType, number[]> = {
  patient_call: [880, 1100, 880],      // Chamada de paciente - melodia alegre
  patient_return: [660, 880, 1100],    // Retorno - melodia ascendente
  new_patient: [523, 659, 784],        // Novo paciente - acorde maior
  queue_update: [440, 550],            // Atualização - dois tons
  urgent: [880, 440, 880, 440],        // Urgente - alternado
  success: [523, 659, 784, 1047],      // Sucesso - escala ascendente
  info: [440, 523],                    // Info - dois tons suaves
};

export function useNotifications() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [notificationQueue, setNotificationQueue] = useState<NotificationOptions[]>([]);
  const [currentNotification, setCurrentNotification] = useState<NotificationOptions | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Inicializar AudioContext
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Tocar som de notificação
  const playNotificationSound = useCallback((type: NotificationType, volume: number = 0.5) => {
    try {
      const audioContext = getAudioContext();
      const frequencies = SOUND_FREQUENCIES[type];
      
      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = type === 'urgent' ? 'square' : 'sine';
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
        
        // Envelope de volume
        const startTime = audioContext.currentTime + (index * 0.2);
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.35);
      });
    } catch (error) {
      console.warn('Erro ao tocar som de notificação:', error);
    }
  }, [getAudioContext]);

  // Tocar som de chamada de paciente (mais elaborado)
  const playPatientCallSound = useCallback((volume: number = 0.6) => {
    try {
      const audioContext = getAudioContext();
      
      // Melodia de chamada: Dó-Mi-Sol-Dó (acorde maior ascendente)
      const notes = [523.25, 659.25, 783.99, 1046.50];
      
      notes.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
        
        const startTime = audioContext.currentTime + (index * 0.15);
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.03);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.45);
      });

      // Repetir a melodia após 1 segundo
      setTimeout(() => {
        notes.forEach((freq, index) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
          
          const startTime = audioContext.currentTime + (index * 0.15);
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(volume * 0.8, startTime + 0.03);
          gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
          
          oscillator.start(startTime);
          oscillator.stop(startTime + 0.45);
        });
      }, 1000);
    } catch (error) {
      console.warn('Erro ao tocar som de chamada:', error);
    }
  }, [getAudioContext]);

  // Mostrar notificação
  const notify = useCallback((options: NotificationOptions) => {
    const { 
      title, 
      message, 
      type, 
      duration = 5000, 
      playSound = true, 
      showVisual = true,
      patientName,
      officeName
    } = options;

    // Tocar som
    if (playSound) {
      if (type === 'patient_call') {
        playPatientCallSound();
      } else {
        playNotificationSound(type);
      }
    }

    // Mostrar toast visual
    if (showVisual) {
      const toastOptions = {
        duration,
        className: getToastClassName(type),
      };

      switch (type) {
        case 'patient_call':
          toast.success(title, {
            ...toastOptions,
            description: message || `${patientName} - ${officeName}`,
            icon: '🔔',
          });
          break;
        case 'patient_return':
          toast.info(title, {
            ...toastOptions,
            description: message,
            icon: '↩️',
          });
          break;
        case 'new_patient':
          toast.info(title, {
            ...toastOptions,
            description: message,
            icon: '👤',
          });
          break;
        case 'urgent':
          toast.error(title, {
            ...toastOptions,
            description: message,
            icon: '⚠️',
          });
          break;
        case 'success':
          toast.success(title, {
            ...toastOptions,
            description: message,
          });
          break;
        default:
          toast.info(title, {
            ...toastOptions,
            description: message,
          });
      }
    }

    // Atualizar estado para animações
    setCurrentNotification(options);
    setIsAnimating(true);
    
    setTimeout(() => {
      setIsAnimating(false);
      setCurrentNotification(null);
    }, duration);
  }, [playNotificationSound, playPatientCallSound]);

  // Notificação de chamada de paciente
  const notifyPatientCall = useCallback((patientName: string, officeName: string, professionalName?: string) => {
    notify({
      title: '🔔 Chamando Paciente',
      message: `${patientName} → ${officeName}${professionalName ? ` (${professionalName})` : ''}`,
      type: 'patient_call',
      duration: 8000,
      patientName,
      officeName,
    });
  }, [notify]);

  // Notificação de retorno de paciente
  const notifyPatientReturn = useCallback((patientName: string, fromQueue: string) => {
    notify({
      title: '↩️ Paciente Retornou',
      message: `${patientName} retornou de ${fromQueue}`,
      type: 'patient_return',
      duration: 6000,
    });
  }, [notify]);

  // Notificação de novo paciente na fila
  const notifyNewPatient = useCallback((patientName: string, queueName: string) => {
    notify({
      title: '👤 Novo Paciente na Fila',
      message: `${patientName} entrou na fila de ${queueName}`,
      type: 'new_patient',
      duration: 5000,
    });
  }, [notify]);

  // Notificação de atualização na fila
  const notifyQueueUpdate = useCallback((message: string) => {
    notify({
      title: '📋 Atualização na Fila',
      message,
      type: 'queue_update',
      duration: 4000,
    });
  }, [notify]);

  return {
    notify,
    notifyPatientCall,
    notifyPatientReturn,
    notifyNewPatient,
    notifyQueueUpdate,
    playNotificationSound,
    playPatientCallSound,
    currentNotification,
    isAnimating,
  };
}

// Função auxiliar para classes do toast
function getToastClassName(type: NotificationType): string {
  const baseClasses = 'border-l-4';
  
  switch (type) {
    case 'patient_call':
      return `${baseClasses} border-l-orange-500 bg-orange-50 dark:bg-orange-950/50`;
    case 'patient_return':
      return `${baseClasses} border-l-blue-500 bg-blue-50 dark:bg-blue-950/50`;
    case 'new_patient':
      return `${baseClasses} border-l-green-500 bg-green-50 dark:bg-green-950/50`;
    case 'urgent':
      return `${baseClasses} border-l-red-500 bg-red-50 dark:bg-red-950/50`;
    case 'success':
      return `${baseClasses} border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/50`;
    default:
      return `${baseClasses} border-l-slate-500`;
  }
}

export default useNotifications;
