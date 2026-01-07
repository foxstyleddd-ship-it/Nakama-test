import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NakamaService } from "@/lib/nakama";
import { HousesTab } from "./HousesTab";
import { CharactersTab } from "./CharactersTab";
import { LogOut } from "lucide-react";

interface DashboardProps {
  onLogout: () => void;
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState("houses");

  const handleLogout = () => {
    NakamaService.logout();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">
            Administration MMO Harry Potter
          </h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="houses">Maisons</TabsTrigger>
            <TabsTrigger value="characters">Personnages</TabsTrigger>
          </TabsList>

          <TabsContent value="houses" className="mt-6">
            <HousesTab />
          </TabsContent>

          <TabsContent value="characters" className="mt-6">
            <CharactersTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
