import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NakamaService } from "@/lib/nakama";
import type { Character, Item } from "@/types";
import { Trash2 } from "lucide-react";

interface CharacterInventoryTabProps {
  character: Character;
}

const RARITY_COLORS = {
  common: "text-gray-600",
  uncommon: "text-green-600",
  rare: "text-blue-600",
  epic: "text-purple-600",
  legendary: "text-orange-600",
};

export function CharacterInventoryTab({ character }: CharacterInventoryTabProps) {
  const [inventory, setInventory] = useState<Array<{ item: Item; quantity: number }>>([]);
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(false);

  const loadInventory = async () => {
    try {
      const [invData, itemsData] = await Promise.all([
        NakamaService.rpc<{ inventory: Array<{ item: Item; quantity: number }> }>(
          "get_character_inventory",
          { characterId: character.id }
        ),
        NakamaService.rpc<{ items: Item[] }>("get_available_items"),
      ]);

      setInventory(invData.inventory);
      setAvailableItems(itemsData.items);
      if (itemsData.items.length > 0) {
        setSelectedItemId(itemsData.items[0].id);
      }
    } catch (error) {
      console.error("Error loading inventory:", error);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [character.id]);

  const handleAddItem = async () => {
    if (!selectedItemId || !quantity) return;
    setLoading(true);

    try {
      await NakamaService.rpc("add_item_to_inventory", {
        characterId: character.id,
        itemId: selectedItemId,
        quantity: parseInt(quantity),
      });
      await loadInventory();
      setQuantity("1");
    } catch (error: any) {
      alert(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    const qty = prompt("Quantité à retirer:");
    if (!qty) return;

    setLoading(true);
    try {
      await NakamaService.rpc("remove_item_from_inventory", {
        characterId: character.id,
        itemId,
        quantity: parseInt(qty),
      });
      await loadInventory();
    } catch (error: any) {
      alert(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Inventaire</CardTitle>
          <CardDescription>
            {inventory.length} type(s) d'objet(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inventory.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Inventaire vide
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {inventory.map(({ item, quantity }) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex-1">
                    <div className={`font-semibold ${RARITY_COLORS[item.rarity]}`}>
                      {item.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.type} - {item.rarity}
                    </div>
                    <div className="text-xs mt-1">
                      Quantité: {quantity}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ajouter un Objet</CardTitle>
          <CardDescription>
            Ajouter un objet à l'inventaire
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item">Objet</Label>
              <select
                id="item"
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={loading}
              >
                {availableItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.type} - {item.rarity})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantité</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={loading}
              />
            </div>

            <Button
              onClick={handleAddItem}
              className="w-full"
              disabled={loading || !selectedItemId}
            >
              {loading ? "Ajout..." : "Ajouter l'Objet"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
