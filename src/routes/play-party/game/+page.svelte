<script>
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { database } from '$lib/firebase/config.js';
  import { ref, onValue, update, get } from 'firebase/database';
  
  // Import the same components used in pass-and-play version
  import GameSection from '$lib/components/GameSection.svelte';
  import ScoreSection from '$lib/components/ScoreSection.svelte';
  import gameStore from '$lib/stores/gameStore.js';
  
  // Game state
  let roomCode = '';
  let playerName = '';
  let roomData = null;
  let players = [];
  let axes = { x: { start: '', end: '' }, y: { start: '', end: '' } };
  let placementsSubmitted = false;
  let allPlayersSubmitted = false;
  let error = null;
  let unsubscribe = null;
  
  onMount(() => {
    // Get room from URL parameters
    if ($page.url.searchParams.has('room')) {
      roomCode = $page.url.searchParams.get('room');
      
      // Load player data from localStorage - FIXED VERSION
      try {
        const hostData = localStorage.getItem('ptGameHost');
        const playerData = localStorage.getItem('ptGamePlayer');
        
        if (hostData) {
          const data = JSON.parse(hostData);
          // Only use this data if it's for the current room
          if (data.roomCode === roomCode) {
            playerName = data.playerName;
          }
        } 
        
        if (playerData && !playerName) {
          const data = JSON.parse(playerData);
          // Only use this data if it's for the current room
          if (data.roomCode === roomCode) {
            playerName = data.playerName;
          }
        }
        
        // If still no valid player name, show error
        if (!playerName) {
          error = "Could not determine player name for this room";
        }
      } catch (err) {
        console.error('Error loading player data:', err);
        error = "Error loading player data: " + err.message;
      }
      
      // Subscribe to room updates
      subscribeToRoom();
    } else {
      // No room code, redirect to party mode menu
      goto('/play-party');
    }
  });
  
  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });
  
  // Subscribe to room data updates
  function subscribeToRoom() {
    const roomRef = ref(database, `rooms/${roomCode}`);
    
    unsubscribe = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        roomData = snapshot.val();
        
        // Get players list
        if (roomData.players) {
          players = Object.entries(roomData.players).map(([name, data]) => ({
            name,
            isHost: data.isHost,
            hasSubmitted: data.hasSubmitted || false,
            joinedAt: data.joinedAt
          })).sort((a, b) => {
            // Host first, then by join time
            if (a.isHost) return -1;
            if (b.isHost) return 1;
            return a.joinedAt - b.joinedAt;
          });
          
          // Validate player is in this room
          if (!players.some(p => p.name === playerName)) {
            error = "Your player name was not found in this room";
          }
        }
        
        // Get axes
        if (roomData.settings && roomData.settings.axes) {
          axes = roomData.settings.axes;
        }
        
        // Check if current player has submitted
        if (roomData.players && roomData.players[playerName]) {
          placementsSubmitted = roomData.players[playerName].hasSubmitted || false;
        }
        
        // Check if everyone has submitted
        allPlayersSubmitted = players.length > 0 && players.every(p => p.hasSubmitted);
        
        // Update game store with room data
        updateGameStore();
      } else {
        error = 'Room no longer exists';
        roomData = null;
      }
    });
  }
  
  // Update the game store with data from Firebase
  function updateGameStore() {
    const playerNames = players.map(p => p.name);
    // Find the index of the current player in the players array
    const playerIndex = playerNames.indexOf(playerName);
    
    gameStore.update(state => ({
      ...state,
      players: playerNames,
      // This is the key change - set currentTurn to this player's index
      currentTurn: playerIndex !== -1 ? playerIndex : 0,
      axes: axes,
      setupSectionVisible: false,
      gameSectionVisible: !placementsSubmitted,
      finalScoresSectionVisible: allPlayersSubmitted,
      placements: roomData.placements || {}
    }));
  }
  
  // Handle placement confirmation from GameSection
  async function handleConfirmPlacement(event) {
    const { placement } = event.detail;
    
    try {
      // Update player status in Firebase
      const playerRef = ref(database, `rooms/${roomCode}/players/${playerName}`);
      await update(playerRef, { hasSubmitted: true });
      
      // Update placements in Firebase
      const placementsRef = ref(database, `rooms/${roomCode}/placements/${playerName}`);
      await update(placementsRef, placement);
      
      // Check if all players have submitted
      const roomRef = ref(database, `rooms/${roomCode}`);
      const snapshot = await get(roomRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const allSubmitted = Object.values(data.players).every(p => p.hasSubmitted);
        
        if (allSubmitted) {
          // Mark room as completed
          await update(roomRef, { 
            status: 'completed',
            completedAt: Date.now()
          });
        }
      }
      
      // Locally mark as submitted
      placementsSubmitted = true;
      
      // Update store to show waiting screen
      gameStore.update(state => ({
        ...state,
        gameSectionVisible: false
      }));
    } catch (err) {
      console.error('Error submitting placements:', err);
      error = err.message || 'Failed to submit placements';
    }
  }
  
  // Reset the game
  function handleResetGame() {
    leaveGame();
  }
  
  // Return to menu
  function leaveGame() {
    if (unsubscribe) {
      unsubscribe();
    }
    
    goto('/play-party');
  }
</script>

<div class="content">
{#if error}
  <div class="error-message">
    <p>{error}</p>
    <button class="try-again" on:click={leaveGame}>
      Back to Menu
    </button>
  </div>
{:else if placementsSubmitted && !allPlayersSubmitted}
  <!-- Waiting for others -->
  <div class="waiting-section section">
    <h2>Waiting for Others</h2>
    <p class="waiting-text">You've submitted your placements! Waiting for other players to finish...</p>
    
    <div class="players-status">
      <h3>Player Status</h3>
      <div class="players-list">
        {#each players as player}
          <div class="player-item" class:submitted={player.hasSubmitted}>
            <span class="player-name">{player.name}</span>
            <span class="status-badge">{player.hasSubmitted ? 'Submitted' : 'Placing...'}</span>
          </div>
        {/each}
      </div>
    </div>
  </div>
{:else if !error && players.length > 0}
  <!-- Game Play Section (using component from pass-and-play) -->
  {#if !placementsSubmitted && !allPlayersSubmitted}
    <GameSection on:confirmPlacement={handleConfirmPlacement} />
  {/if}
  
  <!-- Final Scores Section (using component from pass-and-play) -->
  {#if allPlayersSubmitted}
    <ScoreSection on:resetGame={handleResetGame} />
  {/if}
{:else}
  <div class="loading">
    <p>Loading game data...</p>
  </div>
{/if}

<!-- Back button at bottom left -->
<div class="back-button-container">
  <button class="back-button" on:click={leaveGame}>← Menu</button>
</div>
</div>

<style>
/* Content container - REMOVED the outer container with purple border */
.content {
  max-width: 600px;
  margin: 0 auto;
  padding: 15px;
  background: linear-gradient(135deg, #f9f9f9 0%, #e8f2f5 100%);
  position: relative;
  padding-bottom: 70px; /* Make room for the back button */
}

/* Back button container */
.back-button-container {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 100;
}

/* Back button style */
.back-button {
  background-color: #3891a6;
  color: white;
  border: none;
  border-radius: 50px;
  padding: 10px 20px;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  transition: all 0.2s;
}

.back-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
}

.loading {
  text-align: center;
  padding: 20px;
  font-style: italic;
  color: #666;
}

/* Section styles */
.section {
  margin-bottom: 15px;
  padding: 12px;
  border-radius: 8px;
}

/* Waiting section styles */
.waiting-section {
  background-color: #4c2c69;
  color: white;
}

.waiting-text {
  background-color: #fdc30f;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-weight: bold;
  color: #4c2c69;
}

.players-status {
  margin-top: 20px;
}

.players-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.player-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
}

.player-item.submitted {
  background-color: #a6d3a0;
  color: #4c2c69;
}

.status-badge {
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.85em;
  background-color: rgba(255, 255, 255, 0.2);
}

.player-item.submitted .status-badge {
  background-color: #2a6b34;
  color: white;
}

/* Error message */
.error-message {
  background-color: #fde8e8;
  border-left: 4px solid #e53e3e;
  padding: 15px;
  margin-bottom: 20px;
  border-radius: 4px;
  color: #e53e3e;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.try-again {
  align-self: center;
  background-color: #e53e3e;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.try-again:hover {
  background-color: #c53030;
}

/* Responsive styles */
@media (min-width: 768px) {
  .content {
    max-width: 700px;
    padding: 20px;
    padding-bottom: 80px;
  }
  
  .back-button {
    font-size: 1.1rem;
    padding: 12px 24px;
  }
}

@media (max-width: 480px) {
  .content {
    padding: 12px;
    padding-bottom: 70px;
  }
  
  .back-button {
    font-size: 0.9rem;
    padding: 8px 16px;
  }
  
  .back-button-container {
    bottom: 15px;
    left: 15px;
  }
}
</style>