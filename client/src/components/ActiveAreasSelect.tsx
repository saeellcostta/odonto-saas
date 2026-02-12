import { SelectContent, SelectItem } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

type QueueType = "reception" | "budget" | "dentist" | "orthodontics" | "implant" | "prosthetics" | "maxillofacial" | "pediatric";

const queueLabels: Record<QueueType, string> = {
  reception: "Recepção",
  budget: "Orçamento",
  dentist: "Dentista",
  orthodontics: "Ortodontia",
  implant: "Implante",
  prosthetics: "Prótese",
  maxillofacial: "Buco-Maxilo-Facial",
  pediatric: "Odontopediatria",
};

// Mapeamento de areaKey para QueueType
const areaKeyToQueueType: Record<string, QueueType> = {
  "dentist": "dentist",
  "orthodontist": "orthodontics",
  "implantodontist": "implant",
  "prosthodontist": "prosthetics",
  "maxillofacial": "maxillofacial",
  "pediatric": "pediatric",
};

export function ActiveAreasSelectContent() {
  const { data: activeAreas, isLoading } = trpc.specializedAreas.listActive.useQuery();

  if (isLoading) {
    return (
      <SelectContent>
        <div className="flex items-center justify-center p-4">
          <Loader2 className="animate-spin" size={20} />
        </div>
      </SelectContent>
    );
  }

  // Áreas padrão que sempre devem aparecer
  const defaultAreas: QueueType[] = ["budget"];
  
  // Se não há áreas customizadas, mostrar todas as áreas padrão
  if (!activeAreas || activeAreas.length === 0) {
    return (
      <SelectContent>
        <SelectItem value="budget">Orçamento</SelectItem>
        <SelectItem value="dentist">Dentista</SelectItem>
        <SelectItem value="orthodontics">Ortodontia</SelectItem>
        <SelectItem value="implant">Implante</SelectItem>
        <SelectItem value="prosthetics">Prótese</SelectItem>
        <SelectItem value="maxillofacial">Buco-Maxilo-Facial</SelectItem>
        <SelectItem value="pediatric">Odontopediatria</SelectItem>
      </SelectContent>
    );
  }

  // Renderizar apenas áreas ativas
  return (
    <SelectContent>
      {activeAreas.map((area) => {
        const queueType = areaKeyToQueueType[area.areaKey] || (area.areaKey as QueueType);
        return (
          <SelectItem key={area.id} value={queueType}>
            {area.displayName}
          </SelectItem>
        );
      })}
    </SelectContent>
  );
}
