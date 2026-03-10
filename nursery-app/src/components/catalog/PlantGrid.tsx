"use client";

import { useCatalog } from "@/context/CatalogContext";
import { PlantCard } from "./PlantCard";
import { Leaf } from "lucide-react";

export function PlantGrid() {
  const { filteredPlants, setSelectedPlant } = useCatalog();

  if (filteredPlants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Leaf className="text-gray-200 mb-4" size={48} />
        <h3 className="text-lg font-semibold text-gray-500">
          Растения не найдены
        </h3>
        <p className="text-sm text-gray-400 mt-1">
          Попробуйте изменить параметры фильтрации
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
      {filteredPlants.map((plant) => (
        <PlantCard
          key={plant.id}
          plant={plant}
          onDetails={setSelectedPlant}
        />
      ))}
    </div>
  );
}
