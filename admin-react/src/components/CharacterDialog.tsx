import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Character } from "@/types";
import { CharacterInfoTab } from "./CharacterInfoTab";
import { CharacterSpellsTab } from "./CharacterSpellsTab";
import { CharacterInventoryTab } from "./CharacterInventoryTab";

interface CharacterDialogProps {
  character: Character;
  onClose: () => void;
  onUpdate: () => void;
}

export function CharacterDialog({ character, onClose, onUpdate }: CharacterDialogProps) {
  const [activeTab, setActiveTab] = useState("info");

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{character.name}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Informations</TabsTrigger>
            <TabsTrigger value="spells">Sorts</TabsTrigger>
            <TabsTrigger value="inventory">Inventaire</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4">
            <CharacterInfoTab character={character} onUpdate={onUpdate} />
          </TabsContent>

          <TabsContent value="spells" className="mt-4">
            <CharacterSpellsTab character={character} />
          </TabsContent>

          <TabsContent value="inventory" className="mt-4">
            <CharacterInventoryTab character={character} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
