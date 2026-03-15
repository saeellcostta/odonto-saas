import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("Login realizado com sucesso!");
      setLocation("/");
      // Recarregar para atualizar o estado de autenticação
      window.location.href = "/";
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao fazer login");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }
    loginMutation.mutate({ email, password });
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: 'url(https://d2xsxph8kpxj0f.cloudfront.net/310519663313164752/ZxQkmxiVcK2LVVsppAdeCn/dental-clinic-background-icxVbGY8GJ4VBbaZWeWnMF.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Overlay escuro com gradiente para melhor legibilidade */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/30 to-black/40"></div>

      {/* Conteúdo da página */}
      <div className="relative z-10 w-full max-w-md">
        {/* Card com efeito glass-morphism */}
        <Card className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            {/* Logo da Dentrics */}
            <div className="flex justify-center mb-2">
              <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-lg hover:bg-white/10 transition-all duration-300">
                <img 
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663313164752/ZxQkmxiVcK2LVVsppAdeCn/dentrics-logo-9tZfwEkWi8esenz93Ammb9.webp"
                  alt="Dentrics Logo"
                  className="w-20 h-20 object-contain"
                />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-white drop-shadow-lg">Dentrics</CardTitle>
            <CardDescription className="text-white/80 text-base">
              Sistema de Gestão Odontológica
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/90">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loginMutation.isPending}
                  autoComplete="email"
                  className="bg-white/10 border border-white/20 text-white placeholder:text-white/50 backdrop-blur-sm focus:bg-white/20 focus:border-white/40"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/90">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loginMutation.isPending}
                    autoComplete="current-password"
                    className="bg-white/10 border border-white/20 text-white placeholder:text-white/50 backdrop-blur-sm focus:bg-white/20 focus:border-white/40"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-white/70 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
              
              <div className="text-center text-sm text-white/80">
                Não tem uma conta?{" "}
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-orange-300 hover:text-orange-200 transition-colors"
                  onClick={() => setLocation("/registro")}
                >
                  Cadastre-se
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Rodapé discreto */}
        <div className="text-center mt-8 text-white/60 text-xs">
          <p>© 2026 Dentrics. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
