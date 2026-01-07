# Intégration Nakama dans Unreal Engine - MMO Harry Potter

Ce guide explique comment intégrer le système de gestion de personnages Nakama dans votre projet Unreal Engine.

## Prérequis

1. **Plugin Nakama Unreal installé**
   - Téléchargez depuis: https://github.com/heroiclabs/nakama-unreal
   - Placez dans `YourProject/Plugins/Nakama/`

2. **Serveur Nakama démarré**
   ```bash
   docker-compose up -d
   ```

3. **Modules serveur compilés**
   ```bash
   cd server-modules
   npm install
   npm run build
   ```

## Configuration du Client Nakama

### 1. Créer un subsystem de jeu

Créez `UHarryPotterGameInstanceSubsystem` dans votre projet:

```cpp
// HarryPotterGameInstanceSubsystem.h
#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "NakamaClient.h"
#include "NakamaSession.h"
#include "HarryPotterGameInstanceSubsystem.generated.h"

USTRUCT(BlueprintType)
struct FCharacterData
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadWrite)
    FString Id;

    UPROPERTY(BlueprintReadWrite)
    FString Name;

    UPROPERTY(BlueprintReadWrite)
    int32 Level;

    UPROPERTY(BlueprintReadWrite)
    int32 XP;

    UPROPERTY(BlueprintReadWrite)
    FString House;

    UPROPERTY(BlueprintReadWrite)
    int64 CreatedAt;

    UPROPERTY(BlueprintReadWrite)
    int64 UpdatedAt;
};

UCLASS()
class YOURPROJECT_API UHarryPotterGameInstanceSubsystem : public UGameInstanceSubsystem
{
    GENERATED_BODY()

public:
    virtual void Initialize(FSubsystemCollectionBase& Collection) override;
    virtual void Deinitialize() override;

    // Authentification
    UFUNCTION(BlueprintCallable, Category = "Nakama|Auth")
    void AuthenticateDevice(const FString& DeviceId);

    // Gestion des personnages
    UFUNCTION(BlueprintCallable, Category = "Nakama|Characters")
    void CreateCharacter(const FString& CharacterName);

    UFUNCTION(BlueprintCallable, Category = "Nakama|Characters")
    void GetAllCharacters();

    UFUNCTION(BlueprintCallable, Category = "Nakama|Characters")
    void UpdateCharacter(const FString& CharacterId, int32 NewLevel, int32 NewXP);

    UFUNCTION(BlueprintCallable, Category = "Nakama|Characters")
    void DeleteCharacter(const FString& CharacterId);

    UFUNCTION(BlueprintCallable, Category = "Nakama|Characters")
    void AssignHouse(const FString& CharacterId, const FString& House);

    // Callbacks
    DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnAuthSuccess, UNakamaSession*, Session);
    DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnAuthError, const FString&, ErrorMessage);
    DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnCharacterCreated, FCharacterData, Character);
    DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnCharactersLoaded, const TArray<FCharacterData>&, Characters);
    DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnCharacterUpdated, FCharacterData, Character);
    DECLARE_DYNAMIC_MULTICAST_DELEGATE(FOnCharacterDeleted);
    DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnHouseAssigned, FCharacterData, Character);
    DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnError, const FString&, ErrorMessage);

    UPROPERTY(BlueprintAssignable)
    FOnAuthSuccess OnAuthSuccess;

    UPROPERTY(BlueprintAssignable)
    FOnAuthError OnAuthError;

    UPROPERTY(BlueprintAssignable)
    FOnCharacterCreated OnCharacterCreated;

    UPROPERTY(BlueprintAssignable)
    FOnCharactersLoaded OnCharactersLoaded;

    UPROPERTY(BlueprintAssignable)
    FOnCharacterUpdated OnCharacterUpdated;

    UPROPERTY(BlueprintAssignable)
    FOnCharacterDeleted OnCharacterDeleted;

    UPROPERTY(BlueprintAssignable)
    FOnHouseAssigned OnHouseAssigned;

    UPROPERTY(BlueprintAssignable)
    FOnError OnError;

private:
    UPROPERTY()
    UNakamaClient* NakamaClient;

    UPROPERTY()
    UNakamaSession* CurrentSession;

    FCharacterData ParseCharacterJson(const TSharedPtr<FJsonObject>& JsonObject);
};
```

### 2. Implémenter le subsystem

```cpp
// HarryPotterGameInstanceSubsystem.cpp
#include "HarryPotterGameInstanceSubsystem.h"
#include "NakamaClient.h"
#include "NakamaSession.h"
#include "NakamaRealtimeClient.h"
#include "JsonObjectConverter.h"

void UHarryPotterGameInstanceSubsystem::Initialize(FSubsystemCollectionBase& Collection)
{
    Super::Initialize(Collection);

    // Créer le client Nakama
    NakamaClient = UNakamaClient::CreateDefaultClient(
        TEXT("defaultkey"),      // Server Key
        TEXT("localhost"),       // Server (changez pour votre serveur)
        7350,                    // Port
        TEXT("http"),            // Protocole
        false                    // SSL
    );

    UE_LOG(LogTemp, Log, TEXT("Nakama Client initialisé"));
}

void UHarryPotterGameInstanceSubsystem::Deinitialize()
{
    Super::Deinitialize();
}

void UHarryPotterGameInstanceSubsystem::AuthenticateDevice(const FString& DeviceId)
{
    if (!NakamaClient)
    {
        OnAuthError.Broadcast("Client Nakama non initialisé");
        return;
    }

    NakamaClient->AuthenticateDevice(
        DeviceId,
        TEXT(""),
        true, // Créer le compte s'il n'existe pas
        {},
        [this](UNakamaSession* Session)
        {
            CurrentSession = Session;
            OnAuthSuccess.Broadcast(Session);
            UE_LOG(LogTemp, Log, TEXT("Authentification réussie"));
        },
        [this](const FNakamaError& Error)
        {
            OnAuthError.Broadcast(Error.Message);
            UE_LOG(LogTemp, Error, TEXT("Erreur d'authentification: %s"), *Error.Message);
        }
    );
}

void UHarryPotterGameInstanceSubsystem::CreateCharacter(const FString& CharacterName)
{
    if (!CurrentSession)
    {
        OnError.Broadcast("Non authentifié");
        return;
    }

    // Créer le JSON payload
    TSharedPtr<FJsonObject> JsonObject = MakeShareable(new FJsonObject);
    JsonObject->SetStringField(TEXT("name"), CharacterName);

    FString JsonString;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&JsonString);
    FJsonSerializer::Serialize(JsonObject.ToSharedRef(), Writer);

    // Appeler le RPC
    NakamaClient->RPC(
        CurrentSession,
        TEXT("create_character"),
        JsonString,
        [this](const FNakamaRPC& Rpc)
        {
            // Parser la réponse
            TSharedPtr<FJsonObject> ResponseJson;
            TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Rpc.Payload);

            if (FJsonSerializer::Deserialize(Reader, ResponseJson))
            {
                FCharacterData Character = ParseCharacterJson(ResponseJson);
                OnCharacterCreated.Broadcast(Character);
                UE_LOG(LogTemp, Log, TEXT("Personnage créé: %s"), *Character.Name);
            }
        },
        [this](const FNakamaError& Error)
        {
            OnError.Broadcast(Error.Message);
            UE_LOG(LogTemp, Error, TEXT("Erreur création personnage: %s"), *Error.Message);
        }
    );
}

void UHarryPotterGameInstanceSubsystem::GetAllCharacters()
{
    if (!CurrentSession)
    {
        OnError.Broadcast("Non authentifié");
        return;
    }

    NakamaClient->RPC(
        CurrentSession,
        TEXT("get_characters"),
        TEXT("{}"),
        [this](const FNakamaRPC& Rpc)
        {
            TSharedPtr<FJsonObject> ResponseJson;
            TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Rpc.Payload);

            if (FJsonSerializer::Deserialize(Reader, ResponseJson))
            {
                const TArray<TSharedPtr<FJsonValue>>* CharactersArray;
                if (ResponseJson->TryGetArrayField(TEXT("characters"), CharactersArray))
                {
                    TArray<FCharacterData> Characters;
                    for (const TSharedPtr<FJsonValue>& CharValue : *CharactersArray)
                    {
                        FCharacterData Character = ParseCharacterJson(CharValue->AsObject());
                        Characters.Add(Character);
                    }
                    OnCharactersLoaded.Broadcast(Characters);
                    UE_LOG(LogTemp, Log, TEXT("Chargé %d personnages"), Characters.Num());
                }
            }
        },
        [this](const FNakamaError& Error)
        {
            OnError.Broadcast(Error.Message);
            UE_LOG(LogTemp, Error, TEXT("Erreur chargement personnages: %s"), *Error.Message);
        }
    );
}

void UHarryPotterGameInstanceSubsystem::UpdateCharacter(const FString& CharacterId, int32 NewLevel, int32 NewXP)
{
    if (!CurrentSession)
    {
        OnError.Broadcast("Non authentifié");
        return;
    }

    TSharedPtr<FJsonObject> JsonObject = MakeShareable(new FJsonObject);
    JsonObject->SetStringField(TEXT("characterId"), CharacterId);
    JsonObject->SetNumberField(TEXT("level"), NewLevel);
    JsonObject->SetNumberField(TEXT("xp"), NewXP);

    FString JsonString;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&JsonString);
    FJsonSerializer::Serialize(JsonObject.ToSharedRef(), Writer);

    NakamaClient->RPC(
        CurrentSession,
        TEXT("update_character"),
        JsonString,
        [this](const FNakamaRPC& Rpc)
        {
            TSharedPtr<FJsonObject> ResponseJson;
            TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Rpc.Payload);

            if (FJsonSerializer::Deserialize(Reader, ResponseJson))
            {
                FCharacterData Character = ParseCharacterJson(ResponseJson);
                OnCharacterUpdated.Broadcast(Character);
                UE_LOG(LogTemp, Log, TEXT("Personnage mis à jour: %s"), *Character.Name);
            }
        },
        [this](const FNakamaError& Error)
        {
            OnError.Broadcast(Error.Message);
        }
    );
}

void UHarryPotterGameInstanceSubsystem::DeleteCharacter(const FString& CharacterId)
{
    if (!CurrentSession)
    {
        OnError.Broadcast("Non authentifié");
        return;
    }

    TSharedPtr<FJsonObject> JsonObject = MakeShareable(new FJsonObject);
    JsonObject->SetStringField(TEXT("characterId"), CharacterId);

    FString JsonString;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&JsonString);
    FJsonSerializer::Serialize(JsonObject.ToSharedRef(), Writer);

    NakamaClient->RPC(
        CurrentSession,
        TEXT("delete_character"),
        JsonString,
        [this](const FNakamaRPC& Rpc)
        {
            OnCharacterDeleted.Broadcast();
            UE_LOG(LogTemp, Log, TEXT("Personnage supprimé"));
        },
        [this](const FNakamaError& Error)
        {
            OnError.Broadcast(Error.Message);
        }
    );
}

void UHarryPotterGameInstanceSubsystem::AssignHouse(const FString& CharacterId, const FString& House)
{
    if (!CurrentSession)
    {
        OnError.Broadcast("Non authentifié");
        return;
    }

    // Valider la maison
    TArray<FString> ValidHouses = {TEXT("Pas de Maison"), TEXT("Venatrix"), TEXT("Falcon"), TEXT("Brumval"), TEXT("Aerwyn")};
    if (!ValidHouses.Contains(House))
    {
        OnError.Broadcast("Maison invalide. Maisons valides: Venatrix, Falcon, Brumval, Aerwyn, Pas de Maison");
        return;
    }

    TSharedPtr<FJsonObject> JsonObject = MakeShareable(new FJsonObject);
    JsonObject->SetStringField(TEXT("characterId"), CharacterId);
    JsonObject->SetStringField(TEXT("house"), House);

    FString JsonString;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&JsonString);
    FJsonSerializer::Serialize(JsonObject.ToSharedRef(), Writer);

    NakamaClient->RPC(
        CurrentSession,
        TEXT("assign_house"),
        JsonString,
        [this](const FNakamaRPC& Rpc)
        {
            TSharedPtr<FJsonObject> ResponseJson;
            TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Rpc.Payload);

            if (FJsonSerializer::Deserialize(Reader, ResponseJson))
            {
                FCharacterData Character = ParseCharacterJson(ResponseJson);
                OnHouseAssigned.Broadcast(Character);
                UE_LOG(LogTemp, Log, TEXT("Maison assignée: %s pour %s"), *Character.House, *Character.Name);
            }
        },
        [this](const FNakamaError& Error)
        {
            OnError.Broadcast(Error.Message);
            UE_LOG(LogTemp, Error, TEXT("Erreur assignation maison: %s"), *Error.Message);
        }
    );
}

FCharacterData UHarryPotterGameInstanceSubsystem::ParseCharacterJson(const TSharedPtr<FJsonObject>& JsonObject)
{
    FCharacterData Character;
    Character.Id = JsonObject->GetStringField(TEXT("id"));
    Character.Name = JsonObject->GetStringField(TEXT("name"));
    Character.Level = JsonObject->GetIntegerField(TEXT("level"));
    Character.XP = JsonObject->GetIntegerField(TEXT("xp"));
    Character.House = JsonObject->GetStringField(TEXT("house"));
    Character.CreatedAt = JsonObject->GetNumberField(TEXT("createdAt"));
    Character.UpdatedAt = JsonObject->GetNumberField(TEXT("updatedAt"));
    return Character;
}
```

## Utilisation en Blueprint

### 1. Connexion au serveur

Dans votre GameMode ou Widget de menu principal:

1. **Get Game Instance**
2. **Get Subsystem** → Sélectionnez `HarryPotterGameInstanceSubsystem`
3. **Authenticate Device** → Passez un ID unique (ex: `GetPlatformUserId()`)
4. **Bind Event to OnAuthSuccess** → Gérez le succès de connexion
5. **Bind Event to OnAuthError** → Gérez les erreurs

### 2. Créer un personnage

```
Get Subsystem → Create Character → "Harry Potter"
```

Bind l'événement `OnCharacterCreated` pour recevoir les données.

### 3. Charger tous les personnages

```
Get Subsystem → Get All Characters
```

Bind l'événement `OnCharactersLoaded` pour afficher la liste.

### 4. Mettre à jour un personnage

```
Get Subsystem → Update Character
  ├─ Character Id: "uuid-du-personnage"
  ├─ New Level: 5
  └─ New XP: 1250
```

### 5. Assigner une maison

```
Get Subsystem → Assign House
  ├─ Character Id: "uuid-du-personnage"
  └─ House: "Venatrix"
```

**Maisons disponibles:**
- `"Venatrix"`
- `"Falcon"`
- `"Brumval"`
- `"Aerwyn"`
- `"Pas de Maison"`

Bind l'événement `OnHouseAssigned` pour recevoir la confirmation.

### 6. Supprimer un personnage

```
Get Subsystem → Delete Character → "uuid-du-personnage"
```

## Système de Maisons

### Cérémonie de Répartition

Vous pouvez créer une scène de "répartition" où le joueur choisit ou se voit assigner une maison:

**Exemple de Widget Blueprint pour la répartition:**

1. **Afficher les 4 maisons** avec leurs descriptions
2. **Bouton pour chaque maison:**
   ```
   On Clicked (Bouton Venatrix)
   └─ Get Subsystem
      └─ Assign House
         ├─ Character Id: [Selected Character Id]
         └─ House: "Venatrix"
         └─ On House Assigned
            └─ Show Success Message
            └─ Transition to Game
   ```

### Répartition automatique (Choixpeau magique)

Pour une répartition aléatoire basée sur des critères:

```cpp
void UHarryPotterGameInstanceSubsystem::AutoAssignHouseBasedOnStats(const FString& CharacterId)
{
    // Exemple: basé sur des stats du personnage ou aléatoire
    TArray<FString> Houses = {TEXT("Venatrix"), TEXT("Falcon"), TEXT("Brumval"), TEXT("Aerwyn")};
    int32 RandomIndex = FMath::RandRange(0, Houses.Num() - 1);
    FString SelectedHouse = Houses[RandomIndex];

    AssignHouse(CharacterId, SelectedHouse);
}
```

## Système de Points de Maison

### Ajouter des points à une maison

Lorsqu'un joueur réalise une bonne action:

```cpp
void UHarryPotterGameInstanceSubsystem::AddHousePoints(
    const FString& House,
    int32 Amount,
    const FString& CharacterName,
    const FString& Reason)
{
    if (!CurrentSession)
    {
        OnError.Broadcast("Non authentifié");
        return;
    }

    TSharedPtr<FJsonObject> JsonObject = MakeShareable(new FJsonObject);
    JsonObject->SetStringField(TEXT("house"), House);
    JsonObject->SetNumberField(TEXT("amount"), Amount);
    if (!CharacterName.IsEmpty())
    {
        JsonObject->SetStringField(TEXT("characterName"), CharacterName);
    }
    JsonObject->SetStringField(TEXT("reason"), Reason);

    FString JsonString;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&JsonString);
    FJsonSerializer::Serialize(JsonObject.ToSharedRef(), Writer);

    NakamaClient->RPC(
        CurrentSession,
        TEXT("add_house_points"),
        JsonString,
        [this](const FNakamaRPC& Rpc)
        {
            // Points ajoutés avec succès
            UE_LOG(LogTemp, Log, TEXT("Points de maison ajoutés"));
        },
        [this](const FNakamaError& Error)
        {
            OnError.Broadcast(Error.Message);
        }
    );
}
```

### Retirer des points

```cpp
void UHarryPotterGameInstanceSubsystem::RemoveHousePoints(
    const FString& House,
    int32 Amount,
    const FString& CharacterName,
    const FString& Reason)
{
    // Similaire à AddHousePoints mais avec "remove_house_points"
}
```

### Afficher le classement des maisons

```cpp
USTRUCT(BlueprintType)
struct FHouseRanking
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadWrite)
    FString House;

    UPROPERTY(BlueprintReadWrite)
    int32 Points;

    UPROPERTY(BlueprintReadWrite)
    int64 UpdatedAt;
};

void UHarryPotterGameInstanceSubsystem::GetHouseRankings()
{
    NakamaClient->RPC(
        CurrentSession,
        TEXT("get_house_rankings"),
        TEXT("{}"),
        [this](const FNakamaRPC& Rpc)
        {
            TSharedPtr<FJsonObject> ResponseJson;
            TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Rpc.Payload);

            if (FJsonSerializer::Deserialize(Reader, ResponseJson))
            {
                const TArray<TSharedPtr<FJsonValue>>* RankingsArray;
                if (ResponseJson->TryGetArrayField(TEXT("rankings"), RankingsArray))
                {
                    TArray<FHouseRanking> Rankings;
                    for (const TSharedPtr<FJsonValue>& RankValue : *RankingsArray)
                    {
                        const TSharedPtr<FJsonObject>& RankObj = RankValue->AsObject();
                        FHouseRanking Ranking;
                        Ranking.House = RankObj->GetStringField(TEXT("house"));
                        Ranking.Points = RankObj->GetIntegerField(TEXT("points"));
                        Ranking.UpdatedAt = RankObj->GetNumberField(TEXT("updatedAt"));
                        Rankings.Add(Ranking);
                    }
                    OnHouseRankingsLoaded.Broadcast(Rankings);
                }
            }
        },
        [this](const FNakamaError& Error)
        {
            OnError.Broadcast(Error.Message);
        }
    );
}
```

### Widget de classement des maisons

Créez un Widget Blueprint pour afficher le classement en temps réel:

```
Event Construct
└─ Get Subsystem
   └─ Get House Rankings
      └─ On Rankings Loaded
         └─ For Each Ranking
            └─ Create Ranking Entry Widget
               ├─ Display House Name
               ├─ Display Points
               └─ Display Position/Medal

Set Timer by Event (60 seconds, looping)
└─ Refresh Rankings
```

### Exemple d'utilisation - Récompenser un joueur

```cpp
// Quand un joueur termine une quête
void AQuestManager::OnQuestCompleted(const FString& CharacterName, const FString& House)
{
    auto* Subsystem = GetGameInstance()->GetSubsystem<UHarryPotterGameInstanceSubsystem>();
    if (Subsystem && House != TEXT("Pas de Maison"))
    {
        Subsystem->AddHousePoints(
            House,
            10,
            CharacterName,
            TEXT("Quête principale terminée")
        );

        // Afficher notification
        ShowNotification(FString::Printf(
            TEXT("+10 points pour %s !"), *House
        ));
    }
}
```

### Historique des transactions

```cpp
USTRUCT(BlueprintType)
struct FHousePointsTransaction
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadWrite)
    FString Id;

    UPROPERTY(BlueprintReadWrite)
    FString House;

    UPROPERTY(BlueprintReadWrite)
    int32 Amount;

    UPROPERTY(BlueprintReadWrite)
    FString CharacterName;

    UPROPERTY(BlueprintReadWrite)
    FString Reason;

    UPROPERTY(BlueprintReadWrite)
    FString Type; // "add" or "remove"

    UPROPERTY(BlueprintReadWrite)
    int64 Timestamp;
};

void UHarryPotterGameInstanceSubsystem::GetHousePointsHistory(const FString& House, int32 Limit)
{
    TSharedPtr<FJsonObject> JsonObject = MakeShareable(new FJsonObject);
    if (!House.IsEmpty())
    {
        JsonObject->SetStringField(TEXT("house"), House);
    }
    JsonObject->SetNumberField(TEXT("limit"), Limit);

    FString JsonString;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&JsonString);
    FJsonSerializer::Serialize(JsonObject.ToSharedRef(), Writer);

    NakamaClient->RPC(
        CurrentSession,
        TEXT("get_house_points_history"),
        JsonString,
        [this](const FNakamaRPC& Rpc)
        {
            // Parser l'historique et afficher
            UE_LOG(LogTemp, Log, TEXT("Historique récupéré"));
        },
        [this](const FNakamaError& Error)
        {
            OnError.Broadcast(Error.Message);
        }
    );
}
```

## Système d'Inventaire

### Structures de données

Ajoutez ces structures à votre subsystem:

```cpp
UENUM(BlueprintType)
enum class EItemType : uint8
{
    Wand UMETA(DisplayName = "Baguette"),
    Potion UMETA(DisplayName = "Potion"),
    Book UMETA(DisplayName = "Livre"),
    Equipment UMETA(DisplayName = "Équipement"),
    Ingredient UMETA(DisplayName = "Ingrédient"),
    Consumable UMETA(DisplayName = "Consommable")
};

UENUM(BlueprintType)
enum class EItemRarity : uint8
{
    Common UMETA(DisplayName = "Commun"),
    Uncommon UMETA(DisplayName = "Peu commun"),
    Rare UMETA(DisplayName = "Rare"),
    Epic UMETA(DisplayName = "Épique"),
    Legendary UMETA(DisplayName = "Légendaire")
};

USTRUCT(BlueprintType)
struct FItem
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadWrite)
    FString Id;

    UPROPERTY(BlueprintReadWrite)
    FString Name;

    UPROPERTY(BlueprintReadWrite)
    FString Description;

    UPROPERTY(BlueprintReadWrite)
    EItemType Type;

    UPROPERTY(BlueprintReadWrite)
    EItemRarity Rarity;

    UPROPERTY(BlueprintReadWrite)
    int32 MaxStack;
};

USTRUCT(BlueprintType)
struct FInventoryItem
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadWrite)
    FString ItemId;

    UPROPERTY(BlueprintReadWrite)
    int32 Quantity;

    UPROPERTY(BlueprintReadWrite)
    int64 AddedAt;

    UPROPERTY(BlueprintReadWrite)
    FItem Item; // Enrichi depuis PREDEFINED_ITEMS
};

USTRUCT(BlueprintType)
struct FInventory
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadWrite)
    FString CharacterId;

    UPROPERTY(BlueprintReadWrite)
    TArray<FInventoryItem> Items;

    UPROPERTY(BlueprintReadWrite)
    int64 UpdatedAt;
};
```

### Ajouter un objet à l'inventaire

```cpp
void UHarryPotterGameInstanceSubsystem::AddItemToInventory(
    const FString& CharacterId,
    const FString& ItemId,
    int32 Quantity)
{
    if (!CurrentSession)
    {
        OnError.Broadcast("Non authentifié");
        return;
    }

    TSharedPtr<FJsonObject> JsonObject = MakeShareable(new FJsonObject);
    JsonObject->SetStringField(TEXT("characterId"), CharacterId);
    JsonObject->SetStringField(TEXT("itemId"), ItemId);
    JsonObject->SetNumberField(TEXT("quantity"), Quantity);

    FString JsonString;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&JsonString);
    FJsonSerializer::Serialize(JsonObject.ToSharedRef(), Writer);

    NakamaClient->RPC(
        CurrentSession,
        TEXT("add_item_to_inventory"),
        JsonString,
        [this](const FNakamaRPC& Rpc)
        {
            // Parser la réponse
            TSharedPtr<FJsonObject> ResponseJson;
            TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Rpc.Payload);

            if (FJsonSerializer::Deserialize(Reader, ResponseJson))
            {
                const TSharedPtr<FJsonObject>* InventoryObj;
                if (ResponseJson->TryGetObjectField(TEXT("inventory"), InventoryObj))
                {
                    FInventory Inventory = ParseInventory(*InventoryObj);
                    OnInventoryUpdated.Broadcast(Inventory);
                }
            }
        },
        [this](const FNakamaError& Error)
        {
            OnError.Broadcast(Error.Message);
        }
    );
}
```

### Retirer un objet de l'inventaire

```cpp
void UHarryPotterGameInstanceSubsystem::RemoveItemFromInventory(
    const FString& CharacterId,
    const FString& ItemId,
    int32 Quantity)
{
    TSharedPtr<FJsonObject> JsonObject = MakeShareable(new FJsonObject);
    JsonObject->SetStringField(TEXT("characterId"), CharacterId);
    JsonObject->SetStringField(TEXT("itemId"), ItemId);
    JsonObject->SetNumberField(TEXT("quantity"), Quantity);

    FString JsonString;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&JsonString);
    FJsonSerializer::Serialize(JsonObject.ToSharedRef(), Writer);

    NakamaClient->RPC(
        CurrentSession,
        TEXT("remove_item_from_inventory"),
        JsonString,
        [this](const FNakamaRPC& Rpc)
        {
            // Objet retiré avec succès
            UE_LOG(LogTemp, Log, TEXT("Objet retiré de l'inventaire"));
        },
        [this](const FNakamaError& Error)
        {
            OnError.Broadcast(Error.Message);
        }
    );
}
```

### Récupérer l'inventaire d'un personnage

```cpp
void UHarryPotterGameInstanceSubsystem::GetCharacterInventory(const FString& CharacterId)
{
    TSharedPtr<FJsonObject> JsonObject = MakeShareable(new FJsonObject);
    JsonObject->SetStringField(TEXT("characterId"), CharacterId);

    FString JsonString;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&JsonString);
    FJsonSerializer::Serialize(JsonObject.ToSharedRef(), Writer);

    NakamaClient->RPC(
        CurrentSession,
        TEXT("get_character_inventory"),
        JsonString,
        [this](const FNakamaRPC& Rpc)
        {
            TSharedPtr<FJsonObject> ResponseJson;
            TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Rpc.Payload);

            if (FJsonSerializer::Deserialize(Reader, ResponseJson))
            {
                FInventory Inventory = ParseInventory(ResponseJson);
                OnInventoryLoaded.Broadcast(Inventory);
            }
        },
        [this](const FNakamaError& Error)
        {
            OnError.Broadcast(Error.Message);
        }
    );
}

FInventory UHarryPotterGameInstanceSubsystem::ParseInventory(const TSharedPtr<FJsonObject>& JsonObject)
{
    FInventory Inventory;
    Inventory.CharacterId = JsonObject->GetStringField(TEXT("characterId"));
    Inventory.UpdatedAt = JsonObject->GetNumberField(TEXT("updatedAt"));

    const TArray<TSharedPtr<FJsonValue>>* ItemsArray;
    if (JsonObject->TryGetArrayField(TEXT("items"), ItemsArray))
    {
        for (const TSharedPtr<FJsonValue>& ItemValue : *ItemsArray)
        {
            const TSharedPtr<FJsonObject>& ItemObj = ItemValue->AsObject();
            FInventoryItem InvItem;

            InvItem.ItemId = ItemObj->GetStringField(TEXT("itemId"));
            InvItem.Quantity = ItemObj->GetIntegerField(TEXT("quantity"));
            InvItem.AddedAt = ItemObj->GetNumberField(TEXT("addedAt"));

            // Parser l'objet enrichi
            const TSharedPtr<FJsonObject>* ItemDataObj;
            if (ItemObj->TryGetObjectField(TEXT("item"), ItemDataObj))
            {
                InvItem.Item.Id = (*ItemDataObj)->GetStringField(TEXT("id"));
                InvItem.Item.Name = (*ItemDataObj)->GetStringField(TEXT("name"));
                InvItem.Item.Description = (*ItemDataObj)->GetStringField(TEXT("description"));
                InvItem.Item.MaxStack = (*ItemDataObj)->GetIntegerField(TEXT("maxStack"));
                // Parser type et rarity...
            }

            Inventory.Items.Add(InvItem);
        }
    }

    return Inventory;
}
```

### Obtenir la liste des objets disponibles

```cpp
void UHarryPotterGameInstanceSubsystem::GetAvailableItems()
{
    NakamaClient->RPC(
        CurrentSession,
        TEXT("get_available_items"),
        TEXT("{}"),
        [this](const FNakamaRPC& Rpc)
        {
            TSharedPtr<FJsonObject> ResponseJson;
            TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Rpc.Payload);

            if (FJsonSerializer::Deserialize(Reader, ResponseJson))
            {
                const TArray<TSharedPtr<FJsonValue>>* ItemsArray;
                if (ResponseJson->TryGetArrayField(TEXT("items"), ItemsArray))
                {
                    TArray<FItem> AvailableItems;
                    for (const TSharedPtr<FJsonValue>& ItemValue : *ItemsArray)
                    {
                        const TSharedPtr<FJsonObject>& ItemObj = ItemValue->AsObject();
                        FItem Item;
                        Item.Id = ItemObj->GetStringField(TEXT("id"));
                        Item.Name = ItemObj->GetStringField(TEXT("name"));
                        Item.Description = ItemObj->GetStringField(TEXT("description"));
                        Item.MaxStack = ItemObj->GetIntegerField(TEXT("maxStack"));
                        AvailableItems.Add(Item);
                    }
                    OnAvailableItemsLoaded.Broadcast(AvailableItems);
                }
            }
        },
        [this](const FNakamaError& Error)
        {
            OnError.Broadcast(Error.Message);
        }
    );
}
```

### Exemple d'utilisation - Ramasser un objet

```cpp
// Quand le joueur ramasse un objet dans le monde
void APickupActor::OnPickedUp(ACharacter* PickingCharacter)
{
    auto* Subsystem = GetGameInstance()->GetSubsystem<UHarryPotterGameInstanceSubsystem>();
    if (Subsystem)
    {
        // Ajouter l'objet à l'inventaire
        Subsystem->AddItemToInventory(
            CurrentCharacterId,
            ItemId, // Ex: "potion_health"
            1
        );

        // Afficher notification
        ShowNotification(FString::Printf(
            TEXT("Objet ramassé : %s"), *ItemName
        ));

        // Détruire le pickup
        Destroy();
    }
}
```

### Widget d'inventaire

Créez un Widget Blueprint pour afficher l'inventaire:

```
Event Construct
└─ Get Subsystem
   └─ Get Character Inventory
      └─ On Inventory Loaded
         └─ For Each Item
            └─ Create Item Slot Widget
               ├─ Display Item Icon
               ├─ Display Item Name
               ├─ Display Quantity (si > 1)
               └─ Display Rarity Border Color

On Item Slot Clicked
└─ Show Item Details Panel
   ├─ Item Name
   ├─ Item Description
   ├─ Item Type & Rarity
   ├─ Quantity / MaxStack
   └─ Button "Utiliser" ou "Équiper"
```

### Exemple - Utiliser une potion

```cpp
void UInventoryWidget::OnUsePotion(const FString& ItemId, int32 Quantity)
{
    auto* Subsystem = GetGameInstance()->GetSubsystem<UHarryPotterGameInstanceSubsystem>();
    if (Subsystem)
    {
        // Appliquer l'effet de la potion
        if (ItemId == TEXT("potion_health"))
        {
            // Soigner le joueur
            PlayerCharacter->Heal(50);
        }
        else if (ItemId == TEXT("potion_mana"))
        {
            // Restaurer la mana
            PlayerCharacter->RestoreMana(100);
        }

        // Retirer la potion de l'inventaire
        Subsystem->RemoveItemFromInventory(
            CurrentCharacterId,
            ItemId,
            1 // Consommer 1 potion
        );
    }
}
```

### Callbacks pour l'inventaire

Ajoutez ces delegates au subsystem:

```cpp
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnInventoryLoaded, FInventory, Inventory);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnInventoryUpdated, FInventory, Inventory);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnAvailableItemsLoaded, const TArray<FItem>&, Items);

UPROPERTY(BlueprintAssignable, Category = "Nakama|Inventory")
FOnInventoryLoaded OnInventoryLoaded;

UPROPERTY(BlueprintAssignable, Category = "Nakama|Inventory")
FOnInventoryUpdated OnInventoryUpdated;

UPROPERTY(BlueprintAssignable, Category = "Nakama|Inventory")
FOnAvailableItemsLoaded OnAvailableItemsLoaded;
```

## Exemple de flux complet

### Écran de sélection de personnage

1. **Au démarrage du widget:**
   ```
   Event Construct
   └─ Get All Characters
      └─ On Characters Loaded
         └─ For Each Character
            └─ Create Character Button Widget
   ```

2. **Bouton "Nouveau Personnage":**
   ```
   On Clicked
   └─ Show Name Input Dialog
      └─ On Name Confirmed
         └─ Create Character
            └─ On Character Created
               └─ Refresh Character List
   ```

3. **Bouton "Jouer":**
   ```
   On Clicked
   └─ Save Selected Character to Game Instance
      └─ Open Level "GameWorld"
   ```

## Progression du personnage en jeu

Dans votre système de XP:

```cpp
void UXPComponent::AddExperience(int32 Amount)
{
    CurrentXP += Amount;

    // Vérifier level up
    if (CurrentXP >= GetXPForNextLevel())
    {
        CurrentLevel++;
        CurrentXP = 0;
        OnLevelUp.Broadcast(CurrentLevel);
    }

    // Sauvegarder sur le serveur
    UHarryPotterGameInstanceSubsystem* Subsystem =
        GetGameInstance()->GetSubsystem<UHarryPotterGameInstanceSubsystem>();

    if (Subsystem)
    {
        Subsystem->UpdateCharacter(CurrentCharacterId, CurrentLevel, CurrentXP);
    }
}
```

## Sauvegarde automatique

Créez un Timer pour sauvegarder périodiquement:

```cpp
// Dans votre PlayerController
void AHPPlayerController::BeginPlay()
{
    Super::BeginPlay();

    // Sauvegarder toutes les 5 minutes
    GetWorldTimerManager().SetTimer(
        SaveTimerHandle,
        this,
        &AHPPlayerController::SaveCharacterProgress,
        300.0f, // 5 minutes
        true
    );
}

void AHPPlayerController::SaveCharacterProgress()
{
    // Récupérer les stats actuelles et sauvegarder
    auto* Subsystem = GetGameInstance()->GetSubsystem<UHarryPotterGameInstanceSubsystem>();
    if (Subsystem)
    {
        Subsystem->UpdateCharacter(
            CurrentCharacterId,
            GetCharacterLevel(),
            GetCharacterXP()
        );
    }
}
```

## Extensions futures possibles

Vous pouvez étendre le système pour ajouter:

- **Maison de Poudlard** (Gryffondor, Serpentard, etc.)
- **Inventaire** (baguettes, potions, équipement)
- **Sorts appris**
- **Quêtes complétées**
- **Relations sociales** (amis, groupes)
- **Statistiques** (sorts lancés, ennemis vaincus, etc.)

Modifiez simplement `server-modules/src/main.ts` pour ajouter ces champs à l'interface `Character` et recompilez avec `npm run build`.

## Débogage

### Voir les logs Nakama

```bash
docker-compose logs -f nakama
```

### Console admin

http://localhost:7351 → Onglet "Storage" pour voir les données des personnages

### Logs Unreal

Activez les logs détaillés dans `DefaultEngine.ini`:

```ini
[Core.Log]
LogNakama=Verbose
LogTemp=Verbose
```

## Sécurité

⚠️ **En production:**

1. Changez `defaultkey` dans la configuration Nakama
2. Utilisez HTTPS/WSS au lieu de HTTP/WS
3. Ajoutez une validation supplémentaire côté serveur
4. Limitez les appels RPC (rate limiting)
5. Utilisez l'authentification par email/steam/etc. au lieu de Device ID
