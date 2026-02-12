import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { GripVertical, Edit2, Trash2, Plus } from "lucide-react";

export default function ConfiguracaoAreas() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: areas, isLoading } = trpc.specializedAreas.list.useQuery();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Record<number, any>>({});
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  const updateMutation = trpc.specializedAreas.update.useMutation({
    onSuccess: () => {
      utils.specializedAreas.list.invalidate();
      setEditingId(null);
      toast.success("Área atualizada com sucesso!");
    },
    onError: () => toast.error("Erro ao atualizar área"),
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
        <div className="text-lg text-gray-500">Carregando áreas...</div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Configuração de Áreas Especializadas</h1>
        <p className="text-gray-600">
          Gerencie os nomes, ordem e visibilidade das áreas especializadas do seu consultório
        </p>
      </div>

      <div className="space-y-4">
        {areas?.map((area) => (
          <Card
            key={area.id}
            draggable
            onDragStart={() => handleDragStart(area.id)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(area.id)}
            className={`cursor-move transition-opacity ${draggedItem === area.id ? "opacity-50" : ""}`}
          >
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <GripVertical className="mt-2 text-gray-400 flex-shrink-0" size={20} />

                <div className="flex-1 space-y-4">
                  {editingId === area.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Nome da Área</label>
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
                          placeholder="Ex: Dentista, Ortodontista"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Descrição</label>
                        <Input
                          value={editValues[area.id]?.description || area.description || ""}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              [area.id]: {
                                ...editValues[area.id],
                                description: e.target.value,
                              },
                            })
                          }
                          placeholder="Descrição da área"
                          className="mt-1"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium">Ícone</label>
                          <Input
                            value={editValues[area.id]?.icon || area.icon || ""}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                [area.id]: {
                                  ...editValues[area.id],
                                  icon: e.target.value,
                                },
                              })
                            }
                            placeholder="Ex: tooth, smile"
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium">Cor</label>
                          <Input
                            type="color"
                            value={editValues[area.id]?.color || area.color || "#ff6b35"}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                [area.id]: {
                                  ...editValues[area.id],
                                  color: e.target.value,
                                },
                              })
                            }
                            className="mt-1 h-10"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(area.id)}
                          disabled={updateMutation.isPending}
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
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{area.displayName}</h3>
                        {area.description && (
                          <p className="text-sm text-gray-600 mt-1">{area.description}</p>
                        )}
                        <div className="flex gap-2 mt-2">
                          {area.icon && (
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              Ícone: {area.icon}
                            </span>
                          )}
                          <span
                            className="text-xs px-2 py-1 rounded text-white"
                            style={{ backgroundColor: area.color || "#ff6b35" }}
                          >
                            Cor
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            {area.isActive ? "Ativo" : "Inativo"}
                          </span>
                          <Switch
                            checked={area.isActive ?? false}
                            onCheckedChange={() => handleToggle(area.id, area.isActive ?? false)}
                            disabled={toggleMutation.isPending}
                          />
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
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
                        >
                          <Edit2 size={16} />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Dicas</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Arraste as áreas para reordenar a exibição no menu</li>
          <li>• Desative uma área para removê-la do menu e da fila de atendimento</li>
          <li>• Edite o nome para personalizar conforme sua clínica</li>
          <li>• Áreas desativadas desaparecem automaticamente do Atendente</li>
        </ul>
      </div>
    </div>
  );
}
