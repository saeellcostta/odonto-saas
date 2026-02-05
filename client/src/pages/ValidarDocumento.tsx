import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileCheck,
  FileX,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Building2,
  Stethoscope,
  Clock,
  Shield,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ValidarDocumento() {
  const params = useParams<{ token: string }>();
  const token = params.token || "";

  const { data, isLoading, error } = trpc.medicalDocuments.validateDocument.useQuery(
    { token },
    { enabled: !!token }
  );

  const typeLabels: Record<string, string> = {
    atestado: "Atestado Médico",
    receituario: "Receituário",
    termo_consentimento: "Termo de Consentimento",
    contrato: "Contrato de Serviços",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
            <Skeleton className="h-6 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-red-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <FileX className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-red-700">Erro na Validação</CardTitle>
            <CardDescription>
              Não foi possível validar o documento. O link pode estar incorreto ou expirado.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!data.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-red-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-red-700">Documento Inválido</CardTitle>
            <CardDescription>{data.error || "O documento não pôde ser validado."}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const doc = data.document;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header de Validação */}
        <Card className="mb-6 border-green-200 bg-green-50/50">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <FileCheck className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-green-700 text-2xl">Documento Válido</CardTitle>
            <CardDescription className="text-green-600">
              Este documento foi verificado e é autêntico
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Informações do Documento */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{typeLabels[doc?.type || ""] || doc?.type}</CardTitle>
              <Badge className="bg-green-100 text-green-700">
                <Shield className="h-3 w-3 mr-1" />
                Verificado
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Clínica */}
            {doc?.clinicName && (
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Clínica</p>
                  <p className="text-sm text-muted-foreground">{doc.clinicName}</p>
                </div>
              </div>
            )}

            {/* Profissional */}
            {doc?.dentistName && (
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Stethoscope className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Profissional</p>
                  <p className="text-sm text-muted-foreground">
                    {doc.dentistName}
                    {doc.dentistCro && ` - CRO: ${doc.dentistCro}`}
                  </p>
                </div>
              </div>
            )}

            {/* Paciente */}
            {doc?.patientName && (
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Paciente</p>
                  <p className="text-sm text-muted-foreground">
                    {doc.patientName}
                    {doc.patientCpf && ` - CPF: ${doc.patientCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.***.***-$4")}`}
                  </p>
                </div>
              </div>
            )}

            {/* Data */}
            {doc?.documentDate && (
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Data de Emissão</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(doc.documentDate), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}

            {/* Detalhes específicos por tipo */}
            {doc?.type === "atestado" && doc.attestationType && (
              <div className="p-4 border rounded-lg">
                <p className="font-medium mb-2">Detalhes do Atestado</p>
                <p className="text-sm text-muted-foreground">
                  {doc.attestationType === "dias"
                    ? `Afastamento de ${doc.attestationDays} dia(s)`
                    : "Atestado de Presença"}
                  {doc.cidCode && ` • CID: ${doc.cidCode}`}
                </p>
              </div>
            )}

            {doc?.type === "termo_consentimento" && doc.consentProcedure && (
              <div className="p-4 border rounded-lg">
                <p className="font-medium mb-2">Procedimento</p>
                <p className="text-sm text-muted-foreground">{doc.consentProcedure}</p>
              </div>
            )}

            {doc?.type === "contrato" && (
              <div className="p-4 border rounded-lg">
                <p className="font-medium mb-2">Detalhes do Contrato</p>
                {doc.contractProcedures && (
                  <p className="text-sm text-muted-foreground mb-1">
                    Serviços: {doc.contractProcedures}
                  </p>
                )}
                {doc.contractValue && (
                  <p className="text-sm text-muted-foreground mb-1">
                    Valor: R$ {doc.contractValue}
                  </p>
                )}
                {doc.paymentMethod && (
                  <p className="text-sm text-muted-foreground">
                    Forma de Pagamento: {doc.paymentMethod.replace(/_/g, " ")}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status das Assinaturas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status das Assinaturas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Assinatura do Paciente */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Assinatura do Paciente</span>
              </div>
              {doc?.patientSigned ? (
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Assinado
                  </Badge>
                  {doc.patientSignedAt && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(doc.patientSignedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  )}
                </div>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  Pendente
                </Badge>
              )}
            </div>

            {/* Assinatura do Profissional */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Stethoscope className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Assinatura do Profissional</span>
              </div>
              {doc?.professionalSigned ? (
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Assinado
                  </Badge>
                  {doc.professionalSignedAt && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(doc.professionalSignedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  )}
                </div>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  Pendente
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Documento verificado pelo sistema Dentrics</p>
          <p className="mt-1">
            Verificação realizada em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
      </div>
    </div>
  );
}
