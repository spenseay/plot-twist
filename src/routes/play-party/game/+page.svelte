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
        
        // Load player data from localStorage
        try {
          const hostData = localStorage.getItem('ptGameHost');
          const playerData = localStorage.getItem('ptGamePlayer');
          
          if (hostData) {
            const data = JSON.parse(hostData);
            playerName = data.playerName;
          } else if (playerData) {
            const data = JSON.parse(playerData);
            playerName = data.playerName;
          }
        } catch (err) {
          console.error('Error loading player data:', err);
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
      
      gameStore.update(state => ({
        ...state,
        players: playerNames,
        currentTurn: 0,
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

<div class="container">
  <div class="header">
    <button class="back-button" on:click={leaveGame}>← Menu</button>
    <h1>Plot Twist! Party Mode</h1>
    <div class="spacer"></div>
  </div>
  
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
  </div>
</div>

<style>
  /* Container with background gradient */
  .container {
    max-width: 600px;
    margin: 0 auto;
    padding: 15px;
    background: linear-gradient(135deg, #f9f9f9 0%, #e8f2f5 100%);
    border-radius: 10px;
    box-shadow: 0 0 15px rgba(0,0,0,0.1);
    border: 2px solid #4c2c69;
  }
  
  /* Header with back button */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 15px;
  }
  
  h1 {
    font-size: 1.5em;
    color: #4c2c69;
    margin: 0;
  }
  
  h2 {
    font-size: 1.3em;
    color: #4c2c69;
    margin-bottom: 10px;
  }
  
  h3 {
    font-size: 1.1em;
    color: #4c2c69;
    margin-bottom: 8px;
  }
  
  .back-button {
    background: none;
    border: none;
    color: #3891a6;
    font-size: 1rem;
    cursor: pointer;
    padding: 5px 10px;
    border-radius: 4px;
    transition: background-color 0.2s;
  }
  
  .back-button:hover {
    background-color: #f0f0f0;
  }
  
  .spacer {
    width: 70px;
  }
  
  .content {
    padding: 10px;
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
    .container {
      max-width: 700px;
      padding: 20px;
    }
    
    h1 {
      font-size: 1.8em;
    }
  }
  
  @media (max-width: 480px) {
    .container {
      padding: 12px;
    }
    
    h1 {
      font-size: 1.3em;
    }
    
    button {
      padding: 8px 16px;
      font-size: 14px;
    }
  }
</style>