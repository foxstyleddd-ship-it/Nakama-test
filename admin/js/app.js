// Configuration Nakama
const NAKAMA_SERVER = "localhost";
const NAKAMA_PORT = "7350";
const NAKAMA_USE_SSL = false;

// Client Nakama
let client = null;
let session = null;
let currentCharacter = null;
let availableSpells = [];
let availableItems = [];

// ============================================================================
// INITIALISATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialiser le client Nakama
    client = new nakamajs.Client("defaultkey", NAKAMA_SERVER, NAKAMA_PORT, NAKAMA_USE_SSL);

    // Vérifier si une session existe déjà
    const savedSession = localStorage.getItem('nakamaSession');
    if (savedSession) {
        try {
            session = nakamajs.Session.restore(savedSession);
            if (!session.isexpired(Date.now() / 1000)) {
                showAdminView();
                return;
            }
        } catch (e) {
            localStorage.removeItem('nakamaSession');
        }
    }

    // Afficher la page de connexion
    showLoginView();

    // Event listeners
    setupEventListeners();
});

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function setupEventListeners() {
    // Connexion
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // Tabs navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
    });

    // Modal tabs
    document.querySelectorAll('.modal-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => switchModalTab(e.target.dataset.tab));
    });

    // Points de maison
    document.getElementById('points-form').addEventListener('submit', handlePointsSubmit);

    // Personnages
    document.getElementById('refresh-characters-btn').addEventListener('click', loadCharacters);

    // Modal personnage
    document.querySelector('.close-btn').addEventListener('click', closeCharacterModal);
    document.getElementById('character-edit-form').addEventListener('submit', handleCharacterEdit);
    document.getElementById('add-spell-form').addEventListener('submit', handleAddSpell);
    document.getElementById('add-item-form').addEventListener('submit', handleAddItem);

    // Fermer modal en cliquant à l'extérieur
    document.getElementById('character-modal').addEventListener('click', (e) => {
        if (e.target.id === 'character-modal') {
            closeCharacterModal();
        }
    });
}

// ============================================================================
// NAVIGATION
// ============================================================================

function showLoginView() {
    document.getElementById('login-view').classList.add('active');
    document.getElementById('admin-view').classList.remove('active');
}

function showAdminView() {
    document.getElementById('login-view').classList.remove('active');
    document.getElementById('admin-view').classList.add('active');

    // Afficher l'email de l'utilisateur
    if (session) {
        document.getElementById('user-email').textContent = session.username || 'Admin';
    }

    // Charger les données initiales
    loadHouseRankings();
    loadHouseHistory();
}

function switchTab(tabName) {
    // Désactiver tous les onglets
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Activer l'onglet sélectionné
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Charger les données selon l'onglet
    if (tabName === 'houses') {
        loadHouseRankings();
        loadHouseHistory();
    } else if (tabName === 'characters') {
        loadCharacters();
    }
}

function switchModalTab(tabName) {
    // Désactiver tous les onglets de la modal
    document.querySelectorAll('.modal-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.modal-tab-content').forEach(content => content.classList.remove('active'));

    // Activer l'onglet sélectionné
    document.querySelector(`.modal-tab-btn[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-modal-tab`).classList.add('active');

    // Charger les données selon l'onglet
    if (tabName === 'spells') {
        loadCharacterSpells();
    } else if (tabName === 'inventory') {
        loadCharacterInventory();
    }
}

// ============================================================================
// AUTHENTIFICATION
// ============================================================================

async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');

    try {
        session = await client.authenticateEmail(email, password);
        localStorage.setItem('nakamaSession', session.token);

        showAdminView();
    } catch (error) {
        errorDiv.textContent = "Erreur de connexion. Vérifiez vos identifiants.";
        errorDiv.classList.add('show');
        console.error('Login error:', error);
    }
}

function handleLogout() {
    session = null;
    localStorage.removeItem('nakamaSession');
    showLoginView();

    // Réinitialiser le formulaire
    document.getElementById('login-form').reset();
    document.getElementById('login-error').classList.remove('show');
}

// ============================================================================
// POINTS DE MAISON
// ============================================================================

async function loadHouseRankings() {
    try {
        const result = await client.rpc(session, "get_house_rankings", "{}");
        const data = JSON.parse(result.payload);

        displayHouseRankings(data.rankings);
    } catch (error) {
        console.error('Error loading rankings:', error);
        showToast('Erreur lors du chargement du classement', 'error');
    }
}

function displayHouseRankings(rankings) {
    const container = document.getElementById('ranking-list');
    container.innerHTML = '';

    rankings.forEach((ranking, index) => {
        const houseClass = ranking.house.toLowerCase();
        const rankClass = `rank-${index + 1}`;

        const item = document.createElement('div');
        item.className = `ranking-item ${houseClass} ${rankClass}`;
        item.innerHTML = `
            <div>
                <div class="house-name">#${index + 1} ${ranking.house}</div>
            </div>
            <div class="house-points">${ranking.points} pts</div>
        `;

        container.appendChild(item);
    });
}

async function loadHouseHistory() {
    try {
        const payload = JSON.stringify({ limit: 20 });
        const result = await client.rpc(session, "get_house_points_history", payload);
        const data = JSON.parse(result.payload);

        displayHouseHistory(data.history);
    } catch (error) {
        console.error('Error loading history:', error);
        showToast('Erreur lors du chargement de l\'historique', 'error');
    }
}

function displayHouseHistory(history) {
    const container = document.getElementById('history-list');
    container.innerHTML = '';

    if (history.length === 0) {
        container.innerHTML = '<div class="loading">Aucun historique</div>';
        return;
    }

    history.forEach(transaction => {
        const typeClass = transaction.type;
        const amountClass = transaction.type === 'add' ? 'positive' : 'negative';
        const sign = transaction.type === 'add' ? '+' : '-';

        const item = document.createElement('div');
        item.className = `history-item ${typeClass}`;
        item.innerHTML = `
            <div class="history-info">
                <div class="history-house">${transaction.house}</div>
                <div class="history-reason">
                    ${transaction.characterName ? `${transaction.characterName} - ` : ''}
                    ${transaction.reason}
                </div>
            </div>
            <div class="history-amount ${amountClass}">${sign}${transaction.amount}</div>
        `;

        container.appendChild(item);
    });
}

async function handlePointsSubmit(e) {
    e.preventDefault();

    const house = document.getElementById('house-select').value;
    const action = document.getElementById('points-action').value;
    const amount = parseInt(document.getElementById('points-amount').value);
    const characterName = document.getElementById('character-name').value;
    const reason = document.getElementById('points-reason').value;

    const payload = {
        house,
        amount,
        reason,
    };

    if (characterName) {
        payload.characterName = characterName;
    }

    try {
        const rpcName = action === 'add' ? 'add_house_points' : 'remove_house_points';
        await client.rpc(session, rpcName, JSON.stringify(payload));

        showToast(`${amount} points ${action === 'add' ? 'ajoutés à' : 'retirés de'} ${house}`, 'success');

        // Rafraîchir les données
        loadHouseRankings();
        loadHouseHistory();

        // Réinitialiser le formulaire
        e.target.reset();
    } catch (error) {
        console.error('Error updating points:', error);
        showToast('Erreur lors de la modification des points', 'error');
    }
}

// ============================================================================
// PERSONNAGES
// ============================================================================

async function loadCharacters() {
    const container = document.getElementById('characters-list');
    container.innerHTML = '<div class="loading">Chargement...</div>';

    try {
        // Note: On devrait avoir un RPC qui retourne TOUS les personnages pour un admin
        // Pour l'instant, on va utiliser get_characters qui ne retourne que les personnages de l'utilisateur connecté
        const result = await client.rpc(session, "get_characters", "{}");
        const data = JSON.parse(result.payload);

        displayCharacters(data.characters || []);
    } catch (error) {
        console.error('Error loading characters:', error);
        container.innerHTML = '<div class="loading">Erreur lors du chargement des personnages</div>';
        showToast('Erreur lors du chargement des personnages', 'error');
    }
}

function displayCharacters(characters) {
    const container = document.getElementById('characters-list');
    container.innerHTML = '';

    if (characters.length === 0) {
        container.innerHTML = '<div class="loading">Aucun personnage</div>';
        return;
    }

    characters.forEach(character => {
        const houseClass = character.house.toLowerCase().replace(/ /g, '-');

        const card = document.createElement('div');
        card.className = 'character-card';
        card.onclick = () => openCharacterModal(character);
        card.innerHTML = `
            <h3>${character.name}</h3>
            <span class="character-house-badge ${houseClass}">${character.house}</span>
            <div class="character-info">
                <div class="character-info-item">
                    <span class="character-info-label">Niveau:</span>
                    <span>${character.level}</span>
                </div>
                <div class="character-info-item">
                    <span class="character-info-label">XP:</span>
                    <span>${character.xp}</span>
                </div>
                <div class="character-info-item">
                    <span class="character-info-label">ID:</span>
                    <span style="font-size: 11px; color: #999;">${character.id.substring(0, 8)}...</span>
                </div>
            </div>
        `;

        container.appendChild(card);
    });
}

// ============================================================================
// MODAL PERSONNAGE
// ============================================================================

async function openCharacterModal(character) {
    currentCharacter = character;

    // Charger les listes des sorts et objets disponibles
    await loadAvailableSpells();
    await loadAvailableItems();

    // Remplir le formulaire d'édition
    document.getElementById('character-modal-title').textContent = `Personnage: ${character.name}`;
    document.getElementById('edit-character-id').value = character.id;
    document.getElementById('edit-character-name').value = character.name;
    document.getElementById('edit-character-level').value = character.level;
    document.getElementById('edit-character-xp').value = character.xp;
    document.getElementById('edit-character-house').value = character.house;

    // Afficher la modal
    document.getElementById('character-modal').classList.add('show');

    // Charger les sorts et l'inventaire
    loadCharacterSpells();
    loadCharacterInventory();
}

function closeCharacterModal() {
    document.getElementById('character-modal').classList.remove('show');
    currentCharacter = null;
}

async function handleCharacterEdit(e) {
    e.preventDefault();

    const characterId = document.getElementById('edit-character-id').value;
    const name = document.getElementById('edit-character-name').value;
    const level = parseInt(document.getElementById('edit-character-level').value);
    const xp = parseInt(document.getElementById('edit-character-xp').value);
    const house = document.getElementById('edit-character-house').value;

    try {
        // Mettre à jour les infos de base
        const updatePayload = {
            characterId,
            name,
            level,
            xp,
        };

        await client.rpc(session, "update_character", JSON.stringify(updatePayload));

        // Mettre à jour la maison si nécessaire
        if (house !== currentCharacter.house) {
            const housePayload = {
                characterId,
                house,
            };
            await client.rpc(session, "assign_house", JSON.stringify(housePayload));
        }

        showToast('Personnage mis à jour avec succès', 'success');

        // Mettre à jour currentCharacter
        currentCharacter.name = name;
        currentCharacter.level = level;
        currentCharacter.xp = xp;
        currentCharacter.house = house;

        // Rafraîchir la liste des personnages
        loadCharacters();
    } catch (error) {
        console.error('Error updating character:', error);
        showToast('Erreur lors de la mise à jour du personnage', 'error');
    }
}

// ============================================================================
// SORTS
// ============================================================================

async function loadAvailableSpells() {
    if (availableSpells.length > 0) return; // Déjà chargés

    try {
        const result = await client.rpc(session, "get_available_spells", "{}");
        const data = JSON.parse(result.payload);
        availableSpells = data.spells;

        // Remplir le select des sorts
        const select = document.getElementById('spell-select');
        select.innerHTML = '<option value="">-- Sélectionner --</option>';

        availableSpells.forEach(spell => {
            const option = document.createElement('option');
            option.value = spell.id;
            option.textContent = `${spell.name} (${spell.type} - ${spell.element})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading available spells:', error);
    }
}

async function loadCharacterSpells() {
    if (!currentCharacter) return;

    const container = document.getElementById('character-spells-list');
    container.innerHTML = '<div class="loading">Chargement...</div>';

    try {
        const payload = JSON.stringify({ characterId: currentCharacter.id });
        const result = await client.rpc(session, "get_character_spells", payload);
        const data = JSON.parse(result.payload);

        displayCharacterSpells(data.spells || []);
    } catch (error) {
        console.error('Error loading character spells:', error);
        container.innerHTML = '<div class="loading">Erreur lors du chargement des sorts</div>';
    }
}

function displayCharacterSpells(spells) {
    const container = document.getElementById('character-spells-list');
    container.innerHTML = '';

    if (spells.length === 0) {
        container.innerHTML = '<div class="loading">Aucun sort appris</div>';
        return;
    }

    spells.forEach(spell => {
        const item = document.createElement('div');
        item.className = 'spell-item';

        // Créer les étoiles de niveau
        let stars = '';
        for (let i = 0; i < 3; i++) {
            stars += `<span class="level-star ${i <= spell.level ? '' : 'empty'}">⭐</span>`;
        }

        item.innerHTML = `
            <div class="spell-info">
                <h4>${spell.spell.name}</h4>
                <div class="spell-meta">Type: ${spell.spell.type} | Élément: ${spell.spell.element}</div>
                <div class="spell-level">Niveau ${spell.level}: ${stars}</div>
            </div>
            <div class="spell-actions">
                ${spell.level < 3 ? `<button class="btn btn-success" onclick="upgradeSpell('${spell.spellId}')">⬆️</button>` : ''}
            </div>
        `;

        container.appendChild(item);
    });
}

async function handleAddSpell(e) {
    e.preventDefault();

    const spellId = document.getElementById('spell-select').value;

    if (!spellId) {
        showToast('Veuillez sélectionner un sort', 'error');
        return;
    }

    try {
        const payload = {
            characterId: currentCharacter.id,
            spellId,
        };

        await client.rpc(session, "learn_spell", JSON.stringify(payload));

        showToast('Sort appris avec succès', 'success');

        // Rafraîchir la liste
        loadCharacterSpells();

        // Réinitialiser le formulaire
        e.target.reset();
    } catch (error) {
        console.error('Error learning spell:', error);
        if (error.message.includes('déjà appris')) {
            showToast('Ce sort est déjà appris', 'error');
        } else {
            showToast('Erreur lors de l\'apprentissage du sort', 'error');
        }
    }
}

async function upgradeSpell(spellId) {
    try {
        const payload = {
            characterId: currentCharacter.id,
            spellId,
        };

        await client.rpc(session, "upgrade_spell", JSON.stringify(payload));

        showToast('Sort amélioré avec succès', 'success');

        // Rafraîchir la liste
        loadCharacterSpells();
    } catch (error) {
        console.error('Error upgrading spell:', error);
        showToast('Erreur lors de l\'amélioration du sort', 'error');
    }
}

// ============================================================================
// INVENTAIRE
// ============================================================================

async function loadAvailableItems() {
    if (availableItems.length > 0) return; // Déjà chargés

    try {
        const result = await client.rpc(session, "get_available_items", "{}");
        const data = JSON.parse(result.payload);
        availableItems = data.items;

        // Remplir le select des objets
        const select = document.getElementById('item-select');
        select.innerHTML = '<option value="">-- Sélectionner --</option>';

        availableItems.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.name} (${item.type} - ${item.rarity})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading available items:', error);
    }
}

async function loadCharacterInventory() {
    if (!currentCharacter) return;

    const container = document.getElementById('character-inventory-list');
    container.innerHTML = '<div class="loading">Chargement...</div>';

    try {
        const payload = JSON.stringify({ characterId: currentCharacter.id });
        const result = await client.rpc(session, "get_character_inventory", payload);
        const data = JSON.parse(result.payload);

        displayCharacterInventory(data.items || []);
    } catch (error) {
        console.error('Error loading character inventory:', error);
        container.innerHTML = '<div class="loading">Erreur lors du chargement de l\'inventaire</div>';
    }
}

function displayCharacterInventory(items) {
    const container = document.getElementById('character-inventory-list');
    container.innerHTML = '';

    if (items.length === 0) {
        container.innerHTML = '<div class="loading">Inventaire vide</div>';
        return;
    }

    items.forEach(invItem => {
        const item = document.createElement('div');
        item.className = 'inventory-item';
        item.innerHTML = `
            <div class="item-info">
                <h4>${invItem.item.name}</h4>
                <div class="item-meta">
                    Type: ${invItem.item.type}
                    <span class="item-rarity ${invItem.item.rarity}">${invItem.item.rarity}</span>
                </div>
            </div>
            <div>
                <div class="item-quantity">x${invItem.quantity}</div>
                <button class="btn btn-danger" onclick="removeItem('${invItem.itemId}', ${invItem.quantity})">🗑️</button>
            </div>
        `;

        container.appendChild(item);
    });
}

async function handleAddItem(e) {
    e.preventDefault();

    const itemId = document.getElementById('item-select').value;
    const quantity = parseInt(document.getElementById('item-quantity').value);

    if (!itemId) {
        showToast('Veuillez sélectionner un objet', 'error');
        return;
    }

    try {
        const payload = {
            characterId: currentCharacter.id,
            itemId,
            quantity,
        };

        await client.rpc(session, "add_item_to_inventory", JSON.stringify(payload));

        showToast('Objet ajouté avec succès', 'success');

        // Rafraîchir la liste
        loadCharacterInventory();

        // Réinitialiser le formulaire
        e.target.reset();
    } catch (error) {
        console.error('Error adding item:', error);
        showToast('Erreur lors de l\'ajout de l\'objet', 'error');
    }
}

async function removeItem(itemId, maxQuantity) {
    const quantity = prompt(`Quantité à retirer (max ${maxQuantity}):`, '1');

    if (!quantity || isNaN(quantity) || quantity <= 0) return;

    try {
        const payload = {
            characterId: currentCharacter.id,
            itemId,
            quantity: parseInt(quantity),
        };

        await client.rpc(session, "remove_item_from_inventory", JSON.stringify(payload));

        showToast('Objet retiré avec succès', 'success');

        // Rafraîchir la liste
        loadCharacterInventory();
    } catch (error) {
        console.error('Error removing item:', error);
        showToast('Erreur lors du retrait de l\'objet', 'error');
    }
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
