import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NakamaService } from "@/lib/nakama";
import type { Character, House } from "@/types";
import { CharacterDialog } from "./CharacterDialog";

const HOUSE_COLORS = {
  Venatrix: "bg-red-600",
  Falcon: "bg-blue-600",
  Brumval: "bg-green-600",
  Aerwyn: "bg-yellow-600",
  "Pas de Maison": "bg-gray-600",
};

export function CharactersTab() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCharacters = async () => {
    setLoading(true);
    try {
      const response = await NakamaService.rpc<{ characters: Character[] }>(
        "get_all_characters"
      );
      setCharacters(response.characters || []);
    } catch (error) {
      console.error("Error loading characters:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCharacters();
  }, []);

  const handleCharacterUpdate = () => {
    loadCharacters();
    setSelectedCharacter(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Chargement des personnages...</p>
      </div>
    );
  }

  return (
    <div>
      {characters.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Aucun personnage trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {characters.map((character) => (
            <Card
              key={character.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedCharacter(character)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      HOUSE_COLORS[character.house as House]
                    }`}
                  />
                  {character.name}
                </CardTitle>
                <CardDescription>{character.house}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-muted-foreground">Niveau:</span>{" "}
                    <span className="font-semibold">{character.level}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">XP:</span>{" "}
                    <span className="font-semibold">{character.xp}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedCharacter && (
        <CharacterDialog
          character={selectedCharacter}
          onClose={() => setSelectedCharacter(null)}
          onUpdate={handleCharacterUpdate}
        />
      )}
    </div>
  );
}
