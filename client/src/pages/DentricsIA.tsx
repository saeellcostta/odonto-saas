import { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import {
  Bot,
  Send,
  Sparkles,
  BookOpen,
  MessageSquare,
  Lightbulb,
  Search,
  FileText,
  Smile,
  Wand2,
  Clock,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Loader2,
  ExternalLink,
  GraduationCap,
  Microscope,
  Brain,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: Array<{
    title: string;
    url: string;
    type: "pubmed" | "journal" | "clinic";
  }>;
}

interface SuggestedQuestion {
  icon: React.ReactNode;
  text: string;
  category: string;
}

export default function DentricsIA() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [ttsSupported, setTtsSupported] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Verificar suporte a Text-to-Speech
  useEffect(() => {
    if ('speechSynthesis' in window) {
      setTtsSupported(true);
    }
  }, []);

  // Verificar suporte a reconhecimento de voz
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        toast.success('Voz reconhecida!');
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast.error('Permissão de microfone negada');
        } else {
          toast.error('Erro no reconhecimento de voz');
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Função para ler resposta em voz alta
  const speakMessage = (messageId: string, text: string) => {
    if (!ttsSupported) {
      toast.error('Síntese de voz não suportada neste navegador');
      return;
    }

    // Se já está falando esta mensagem, parar
    if (isSpeaking && speakingMessageId === messageId) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      return;
    }

    // Parar qualquer fala anterior
    window.speechSynthesis.cancel();

    // Limpar markdown e formatação do texto
    const cleanText = text
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
      .replace(/`[^`]+`/g, '') // Remove code
      .replace(/\n+/g, '. ') // Replace newlines with periods
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Tentar usar uma voz brasileira
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.startsWith('pt'));
    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeakingMessageId(messageId);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      toast.error('Erro ao reproduzir áudio');
    };

    window.speechSynthesis.speak(utterance);
  };

  // Parar toda fala
  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setSpeakingMessageId(null);
  };

  const toggleVoiceInput = () => {
    if (!speechSupported) {
      toast.error('Reconhecimento de voz não suportado neste navegador');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        toast.info('Ouvindo... Fale sua pergunta');
      } catch (error) {
        toast.error('Erro ao iniciar reconhecimento de voz');
      }
    }
  };

  // tRPC queries e mutations
  const askIA = trpc.dentricsIA.ask.useMutation();
  const searchPubMed = trpc.dentricsIA.searchPubMed.useMutation();
  const saveMessage = trpc.dentricsIA.saveMessage.useMutation();
  const clearHistory = trpc.dentricsIA.clearHistory.useMutation();
  const { data: historyData, isLoading: historyLoading } = trpc.dentricsIA.getHistory.useQuery();

  // Carregar histórico ao abrir a página
  useEffect(() => {
    if (historyData && !historyLoaded) {
      const loadedMessages: Message[] = historyData.map((h: any) => ({
        id: h.id.toString(),
        role: h.role as "user" | "assistant",
        content: h.content,
        timestamp: new Date(h.createdAt),
        sources: h.sources || [],
      }));
      setMessages(loadedMessages);
      setHistoryLoaded(true);
    }
  }, [historyData, historyLoaded]);

  const suggestedQuestions: SuggestedQuestion[] = [
    { icon: <TrendingUp className="h-4 w-4" />, text: "Qual foi meu faturamento este mês?", category: "Financeiro" },
    { icon: <Users className="h-4 w-4" />, text: "Quantos pacientes atendi hoje?", category: "Pacientes" },
    { icon: <Calendar className="h-4 w-4" />, text: "Quais consultas tenho amanhã?", category: "Agenda" },
    { icon: <DollarSign className="h-4 w-4" />, text: "Quais orçamentos estão pendentes?", category: "Orçamentos" },
    { icon: <BookOpen className="h-4 w-4" />, text: "Buscar estudos sobre implantes dentários", category: "Pesquisa" },
    { icon: <Microscope className="h-4 w-4" />, text: "Últimas pesquisas sobre clareamento dental", category: "Pesquisa" },
    { icon: <Smile className="h-4 w-4" />, text: "Simular resultado de tratamento estético", category: "Smile Design" },
    { icon: <Lightbulb className="h-4 w-4" />, text: "Sugestões para aumentar conversão de orçamentos", category: "Insights" },
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput("");
    setIsLoading(true);

    // Salvar mensagem do usuário no histórico
    try {
      await saveMessage.mutateAsync({
        role: "user",
        content: currentInput,
      });
    } catch (e) {
      console.error("Erro ao salvar mensagem do usuário:", e);
    }

    try {
      // Construir contexto do histórico para a IA
      const recentMessages = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await askIA.mutateAsync({ 
        message: currentInput,
      });
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: typeof response.answer === 'string' ? response.answer : String(response.answer),
        timestamp: new Date(),
        sources: response.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Salvar resposta da IA no histórico
      try {
        await saveMessage.mutateAsync({
          role: "assistant",
          content: assistantMessage.content,
          sources: response.sources,
        });
      } catch (e) {
        console.error("Erro ao salvar resposta da IA:", e);
      }
    } catch (error) {
      toast.error("Erro ao processar sua pergunta. Tente novamente.");
      console.error(error);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
    inputRef.current?.focus();
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Copiado para a área de transferência");
  };

  const handleClearChat = async () => {
    try {
      await clearHistory.mutateAsync();
      setMessages([]);
      toast.success("Histórico limpo com sucesso");
    } catch (error) {
      toast.error("Erro ao limpar histórico");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Mostrar loading enquanto carrega histórico
  if (historyLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <p className="text-muted-foreground">Carregando histórico de conversas...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)] p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Dentrics IA</h1>
              <p className="text-sm text-muted-foreground">
                Assistente inteligente com integração PubMed e IA Manus
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {messages.length} mensagens
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearChat}
              disabled={messages.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Chat Area */}
          <Card className="flex-1 flex flex-col">
            <CardContent className="flex-1 flex flex-col p-4 min-h-0">
              {/* Messages */}
              <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12">
                    <div className="p-4 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20 rounded-full mb-4">
                      <Sparkles className="h-12 w-12 text-orange-500" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Olá! Sou a Dentrics IA</h3>
                    <p className="text-muted-foreground text-center max-w-md mb-6">
                      Posso ajudar com dados da sua clínica, pesquisas científicas no PubMed,
                      e insights para melhorar sua gestão.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-2xl">
                      {suggestedQuestions.slice(0, 4).map((q, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          className="justify-start h-auto py-3 px-4"
                          onClick={() => handleSuggestedQuestion(q.text)}
                        >
                          {q.icon}
                          <span className="ml-2 text-left text-sm">{q.text}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                            message.role === "user"
                              ? "bg-orange-500 text-white"
                              : "bg-muted"
                          }`}
                        >
                          {message.role === "assistant" ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              <Streamdown>{message.content}</Streamdown>
                            </div>
                          ) : (
                            <p>{message.content}</p>
                          )}
                          
                          {/* Sources */}
                          {message.sources && message.sources.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border/50">
                              <p className="text-xs font-medium mb-2 opacity-70">Fontes:</p>
                              <div className="flex flex-wrap gap-2">
                                {message.sources.map((source, i) => (
                                  <a
                                    key={i}
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs bg-background/50 hover:bg-background px-2 py-1 rounded-md transition-colors"
                                  >
                                    {source.type === "pubmed" && <GraduationCap className="h-3 w-3" />}
                                    {source.type === "clinic" && <FileText className="h-3 w-3" />}
                                    <span className="truncate max-w-[150px]">{source.title}</span>
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Actions */}
                          {message.role === "assistant" && (
                            <div className="mt-2 flex justify-end gap-1">
                              {/* Botão de ouvir */}
                              {ttsSupported && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`h-6 px-2 text-xs opacity-50 hover:opacity-100 ${speakingMessageId === message.id ? 'opacity-100 text-primary' : ''}`}
                                  onClick={() => speakMessage(message.id, message.content)}
                                  title={speakingMessageId === message.id ? "Parar leitura" : "Ouvir resposta"}
                                >
                                  {speakingMessageId === message.id ? (
                                    <Square className="h-3 w-3" />
                                  ) : (
                                    <Volume2 className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                              {/* Botão de copiar */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs opacity-50 hover:opacity-100"
                                onClick={() => handleCopy(message.content, message.id)}
                              >
                                {copiedId === message.id ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-2xl px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Pensando...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              {/* Input Area */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      ref={inputRef}
                      placeholder={isListening ? "Ouvindo..." : "Digite ou fale sua pergunta..."}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isLoading || isListening}
                      className={`pr-10 ${isListening ? 'border-orange-500 animate-pulse' : ''}`}
                    />
                    {speechSupported && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={`absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 ${isListening ? 'text-orange-500' : 'text-muted-foreground hover:text-foreground'}`}
                        onClick={toggleVoiceInput}
                        disabled={isLoading}
                      >
                        {isListening ? (
                          <MicOff className="h-4 w-4" />
                        ) : (
                          <Mic className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {speechSupported && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Mic className="h-3 w-3" />
                    Clique no microfone ou pressione e segure para falar
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sidebar - Sugestões e Ações Rápidas */}
          <div className="hidden lg:flex flex-col w-80 gap-4">
            {/* Ações Rápidas */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-orange-500" />
                  Ações Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleSuggestedQuestion("Resumo do meu dia: consultas, faturamento e pendências")}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Resumo do Dia
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleSuggestedQuestion("Buscar últimos estudos sobre periodontia no PubMed")}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Pesquisar PubMed
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleSuggestedQuestion("Quais pacientes precisam de retorno esta semana?")}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Alertas de Retorno
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleSuggestedQuestion("Análise de performance: comparar este mês com o anterior")}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Performance
                </Button>
              </CardContent>
            </Card>

            {/* Sugestões de Perguntas */}
            <Card className="flex-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Sugestões
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {suggestedQuestions.map((q, i) => (
                      <Button
                        key={i}
                        variant="ghost"
                        className="w-full justify-start h-auto py-2 px-3 text-left"
                        onClick={() => handleSuggestedQuestion(q.text)}
                      >
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5">{q.icon}</div>
                          <div>
                            <p className="text-sm">{q.text}</p>
                            <Badge variant="secondary" className="text-xs mt-1">
                              {q.category}
                            </Badge>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Pesquisas Científicas */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-blue-500" />
                  Pesquisas Científicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Button
                  variant="ghost"
                  className="w-full justify-start h-auto py-2"
                  onClick={() => handleSuggestedQuestion("Buscar estudos sobre regeneração óssea guiada")}
                >
                  <Microscope className="h-4 w-4 mr-2" />
                  Regeneração óssea
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-auto py-2"
                  onClick={() => handleSuggestedQuestion("Últimas pesquisas sobre alinhadores transparentes")}
                >
                  <Smile className="h-4 w-4 mr-2" />
                  Alinhadores
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-auto py-2"
                  onClick={() => handleSuggestedQuestion("Estudos sobre endodontia minimamente invasiva")}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Endodontia
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
