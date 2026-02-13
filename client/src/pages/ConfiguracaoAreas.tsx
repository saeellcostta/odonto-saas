import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { GripVertical, Edit2, Plus, Trash2 } from "lucide-react";

export default function ConfiguracaoAreas() {
  const utils = trpc.useUtils();
  const { data: areas = [], isLoading, refetch } = trpc.specializedAreas.list.useQuery();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Record<number, any>>({});
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  
  const initializeMutation = trpc.specializedAreas.initializeDefaults.useMutation({
    onSuccess: () => {
      toast.success("Áreas padrão inicializadas!");
      refetch();
    },
    onError: (error) => {
      console.error("Erro ao inicializar áreas:", error);
      toast.error("Erro ao inicializar áreas");
    },
  });

  const updateMutation = trpc.specializedAreas.update.useMutation({
    onSuccess: () => {
      utils.specializedAreas.list.invalidate();
      setEditingId(null);
      toast.success("Área atualizada!");
    },
    onError: () => toast.error("Erro ao atualizar"),
  });

  const toggleMutation = trpc.specializedAreas.toggle.useMutation({
    onSuccess: () => {
      utils.specializedAreas.list.invalidate();
      toast.success("Status atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar status"),
  });

  const reorderMutation = trpc.specializedAreas.reorder.useMutation({
    onSuccess: () => {
      utils.specializedAreas.list.invalidate();
      toast.success("Ordem atualizada!");
    },
    onError: () => toast.error("Erro ao reordenar"),
  });

  const handleSaveEdit = (id: number) => {
    const values = editValues[id];
    if (!values?.displayName?.trim()) {
      toast.error("Nome não pode estar vazio");
      return;
    }

    updateMutation.mutate({
      id,
      displayName: values.displayName,
      description: values.description,
      icon: values.icon,
      color: values.color,
    });
  };

  const handleToggle = (id: number, currentStatus: boolean) => {
    toggleMutation.mutate({
      id,
      isActive: !currentStatus,
    });
  };

  const handleDragStart = (id: number) => {
    setDraggedItem(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetId: number) => {
    if (!draggedItem || !areas) return;

    const draggedIndex = areas.findIndex(a => a.id === draggedItem);
    const targetIndex = areas.findIndex(a => a.id === targetId);

    if (draggedIndex === targetIndex) return;

    const newAreas = [...areas];
    [newAreas[draggedIndex], newAreas[targetIndex]] = [newAreas[targetIndex], newAreas[draggedIndex]];

    const reorderData = newAreas.map((area, index) => ({
      id: area.id,
      sortOrder: index,
    }));

    reorderMutation.mutate({ areas: reorderData });
    setDraggedItem(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Personalizar Menu</h1>
        <p className="text-gray-600">
          Organize e ative/desative as áreas especializadas do seu consultório
        </p>
      </div>

      {areas.length === 0 ? (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <p className="text-yellow-800 mb-4">Nenhuma área configurada.</p>
            <Button 
              onClick={() => initializeMutation.mutate()}
              disabled={initializeMutation.isPending}
            >
              {initializeMutation.isPending ? "Inicializando..." : "Inicializar Áreas Padrão"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            <div className="space-y-0 divide-y">
              {areas.map((area, index) => (
                <div
                  key={area.id}
                  draggable
                  onDragStart={() => handleDragStart(area.id)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(area.id)}
                  className={`flex items-center gap-4 p-4 cursor-move transition-all hover:bg-gray-50 ${
                    draggedItem === area.id ? "bg-blue-50 opacity-60" : ""
                  }`}
                >
                  {/* Drag Handle */}
                  <div className="flex-shrink-0 text-gray-400 cursor-grab active:cursor-grabbing">
                    <GripVertical size={20} />
                  </div>

                  {/* Content */}
                  {editingId === area.id ? (
                    <div className="flex-1 space-y-3">
                      <Input
                        value={editValues[area.id]?.displayName || area.displayName}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            [area.id]: {
                              ...editValues[area.id],
                              displayName: e.target.value,
                            },
                          })
                        }
                        placeholder="Nome da área"
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(area.id)}
                          disabled={updateMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{area.displayName}</h3>
                        {area.description && (
                          <p className="text-xs text-gray-500 mt-1">{area.description}</p>
                        )}
                      </div>

                      {/* Edit Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(area.id);
                          setEditValues({
                            [area.id]: {
                              displayName: area.displayName,
                              description: area.description,
                              icon: area.icon,
                              color: area.color,
                            },
                          });
                        }}
                        className="flex-shrink-0"
                      >
                        <Edit2 size={16} />
                      </Button>

                      {/* Toggle Switch */}
                      <Switch
                        checked={area.isActive ?? false}
                        onCheckedChange={() => handleToggle(area.id, area.isActive ?? false)}
                        disabled={toggleMutation.isPending}
                        className="flex-shrink-0"
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Como usar</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Arraste o ícone ≡ para reordenar as áreas</li>
          <li>• Use o toggle verde para ativar ou desativar áreas</li>
          <li>• Clique no lápis para editar o nome da área</li>
          <li>• Áreas desativadas não aparecem para o atendente</li>
        </ul>
      </div>
    </div>
  );
}
