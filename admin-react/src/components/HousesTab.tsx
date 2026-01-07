import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NakamaService } from "@/lib/nakama";
import type { House, HouseScore, HousePointHistory } from "@/types";

const HOUSES: House[] = ["Venatrix", "Falcon", "Brumval", "Aerwyn"];

const HOUSE_COLORS = {
  Venatrix: "bg-red-600",
  Falcon: "bg-blue-600",
  Brumval: "bg-green-600",
  Aerwyn: "bg-yellow-600",
  "Pas de Maison": "bg-gray-600",
};

export function HousesTab() {
  const [rankings, setRankings] = useState<HouseScore[]>([]);
  const [history, setHistory] = useState<HousePointHistory[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedHouse, setSelectedHouse] = useState<House>("Venatrix");
  const [action, setAction] = useState<"add" | "remove">("add");
  const [points, setPoints] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [reason, setReason] = useState("");

  const loadData = async () => {
    try {
      const [rankingsData, historyData] = await Promise.all([
        NakamaService.rpc<{ rankings: HouseScore[] }>("get_house_rankings"),
        NakamaService.rpc<{ history: HousePointHistory[] }>("get_house_point_history"),
      ]);
      setRankings(rankingsData.rankings);
      setHistory(historyData.history);
    } catch (error) {
      console.error("Error loading houses data:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const pointsValue = action === "add" ? parseInt(points) : -parseInt(points);
      await NakamaService.rpc("add_house_points", {
        house: selectedHouse,
        points: pointsValue,
        characterName: characterName || undefined,
        reason,
      });

      setPoints("");
      setCharacterName("");
      setReason("");
      await loadData();
    } catch (error: any) {
      alert(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Rankings */}
        <Card>
          <CardHeader>
            <CardTitle>Classement des Maisons</CardTitle>
            <CardDescription>Points actuels de chaque maison</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rankings.map((score, index) => (
                <div key={score.house} className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-muted-foreground w-8">
                    {index + 1}
                  </span>
                  <div className={`w-4 h-4 rounded-full ${HOUSE_COLORS[score.house]}`} />
                  <span className="font-semibold flex-1">{score.house}</span>
                  <span className="text-xl font-bold">{score.points}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Add/Remove Points */}
        <Card>
          <CardHeader>
            <CardTitle>Gérer les Points</CardTitle>
            <CardDescription>Ajouter ou retirer des points</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="house">Maison</Label>
                <select
                  id="house"
                  value={selectedHouse}
                  onChange={(e) => setSelectedHouse(e.target.value as House)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  disabled={loading}
                >
                  {HOUSES.map((house) => (
                    <option key={house} value={house}>
                      {house}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="action">Action</Label>
                <select
                  id="action"
                  value={action}
                  onChange={(e) => setAction(e.target.value as "add" | "remove")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  disabled={loading}
                >
                  <option value="add">Ajouter</option>
                  <option value="remove">Retirer</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="points">Points</Label>
                <Input
                  id="points"
                  type="number"
                  min="1"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="characterName">Nom du personnage (optionnel)</Label>
                <Input
                  id="characterName"
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Raison</Label>
                <Input
                  id="reason"
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Traitement..." : "Valider"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des Transactions</CardTitle>
          <CardDescription>20 dernières modifications de points</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
              >
                <div className={`w-3 h-3 rounded-full ${HOUSE_COLORS[entry.house]}`} />
                <div className="flex-1">
                  <div className="font-semibold">
                    {entry.house} {entry.points > 0 ? "+" : ""}
                    {entry.points} points
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {entry.characterName && <span>{entry.characterName} - </span>}
                    {entry.reason}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(entry.timestamp).toLocaleString("fr-FR")}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
