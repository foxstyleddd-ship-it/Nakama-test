import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NakamaService } from "@/lib/nakama";
import type { Character, House } from "@/types";

const HOUSES: House[] = ["Venatrix", "Falcon", "Brumval", "Aerwyn", "Pas de Maison"];

interface CharacterInfoTabProps {
  character: Character;
  onUpdate: () => void;
}

export function CharacterInfoTab({ character, onUpdate }: CharacterInfoTabProps) {
  const [name, setName] = useState(character.name);
  const [level, setLevel] = useState(character.level.toString());
  const [xp, setXp] = useState(character.xp.toString());
  const [house, setHouse] = useState<House>(character.house);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await NakamaService.rpc("update_character", {
        characterId: character.id,
        name,
        level: parseInt(level),
        xp: parseInt(xp),
        house,
      });
      onUpdate();
    } catch (error: any) {
      alert(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="level">Niveau (1-100)</Label>
              <Input
                id="level"
                type="number"
                min="1"
                max="100"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="xp">XP</Label>
              <Input
                id="xp"
                type="number"
                min="0"
                value={xp}
                onChange={(e) => setXp(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="house">Maison</Label>
            <select
              id="house"
              value={house}
              onChange={(e) => setHouse(e.target.value as House)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={loading}
            >
              {HOUSES.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
