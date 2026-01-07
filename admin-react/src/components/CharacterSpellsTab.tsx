import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NakamaService } from "@/lib/nakama";
import type { Character, Spell } from "@/types";
import { ArrowUp } from "lucide-react";

interface CharacterSpellsTabProps {
  character: Character;
}

export function CharacterSpellsTab({ character }: CharacterSpellsTabProps) {
  const [learnedSpells, setLearnedSpells] = useState<
    Array<{ spell: Spell; level: number }>
  >([]);
  const [availableSpells, setAvailableSpells] = useState<Spell[]>([]);
  const [selectedSpellId, setSelectedSpellId] = useState("");
  const [loading, setLoading] = useState(false);

  const loadSpells = async () => {
    try {
      const [learned, available] = await Promise.all([
        NakamaService.rpc<{ spells: Array<{ spell: Spell; level: number }> }>(
          "get_character_spells",
          { characterId: character.id }
        ),
        NakamaService.rpc<{ spells: Spell[] }>("get_available_spells"),
      ]);

      setLearnedSpells(learned.spells);
      setAvailableSpells(available.spells);
      if (available.spells.length > 0) {
        setSelectedSpellId(available.spells[0].id);
      }
    } catch (error) {
      console.error("Error loading spells:", error);
    }
  };

  useEffect(() => {
    loadSpells();
  }, [character.id]);

  const handleLearnSpell = async () => {
    if (!selectedSpellId) return;
    setLoading(true);

    try {
      await NakamaService.rpc("learn_spell", {
        characterId: character.id,
        spellId: selectedSpellId,
      });
      await loadSpells();
    } catch (error: any) {
      alert(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeSpell = async (spellId: string) => {
    setLoading(true);

    try {
      await NakamaService.rpc("upgrade_spell", {
        characterId: character.id,
        spellId,
      });
      await loadSpells();
    } catch (error: any) {
      alert(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const notLearnedSpells = availableSpells.filter(
    (spell) => !learnedSpells.find((ls) => ls.spell.id === spell.id)
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sorts Appris</CardTitle>
          <CardDescription>
            {learnedSpells.length} sort(s) appris
          </CardDescription>
        </CardHeader>
        <CardContent>
          {learnedSpells.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Aucun sort appris
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {learnedSpells.map(({ spell, level }) => (
                <div
                  key={spell.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex-1">
                    <div className="font-semibold">{spell.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {spell.element} - {spell.category}
                    </div>
                    <div className="text-xs mt-1">
                      Niveau: {level}/3
                    </div>
                  </div>
                  {level < 3 && (
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleUpgradeSpell(spell.id)}
                      disabled={loading}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Apprendre un Sort</CardTitle>
          <CardDescription>
            Sélectionnez un sort à apprendre
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notLearnedSpells.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Tous les sorts ont été appris
            </p>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="spell">Sort</Label>
                <select
                  id="spell"
                  value={selectedSpellId}
                  onChange={(e) => setSelectedSpellId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  disabled={loading}
                >
                  {notLearnedSpells.map((spell) => (
                    <option key={spell.id} value={spell.id}>
                      {spell.name} ({spell.element} - {spell.category})
                    </option>
                  ))}
                </select>
              </div>
              <Button
                onClick={handleLearnSpell}
                className="w-full"
                disabled={loading || !selectedSpellId}
              >
                {loading ? "Apprentissage..." : "Apprendre le Sort"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
