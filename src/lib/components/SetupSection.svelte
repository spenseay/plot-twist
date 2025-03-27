<script>
  import { createEventDispatcher } from 'svelte';
  import gameStore, { actions } from '$lib/stores/gameStore.js';
  import PlayerList from '$lib/components/UI/PlayerList.svelte';

  // Set up event dispatcher to communicate with parent
  const dispatch = createEventDispatcher();
  
  // Subscribe to game store for player data
  $: players = $gameStore?.players || [];

  // Start the game
  function startGame() {
    if (players.length < 2) {
      alert('You need at least 2 players to start the game.');
      return;
    }
    
    dispatch('startGame');
  }

  // Handle events from PlayerList component
  function handlePlayerAdded(event) {
    // Additional logic can be added here if needed
    console.log('Player added:', event.detail.player);
  }

  function handlePlayerRemoved(event) {
    // Additional logic can be added here if needed
    console.log('Player removed:', event.detail.player);
  }

  function handlePlayersCleared() {
    // Additional logic can be added here if needed
    console.log('All players cleared');
  }
</script>

<div class="setup-section section">
  <h2>Player Setup</h2>
  <div class="instructions">
    <p>Enter the names of all players who will participate.</p>
  </div>
  
  <!-- Use our new PlayerList component -->
  <PlayerList 
    on:playerAdded={handlePlayerAdded}
    on:playerRemoved={handlePlayerRemoved}
    on:playersCleared={handlePlayersCleared}
  />
  
  <div class="button-group">
    <button 
      on:click={startGame} 
      disabled={players.length < 2}
    >
      Start Game
    </button>
  </div>
</div>

<style>
  .setup-section {
    background-color: #fdc30f;
  }
  
  /* Section styles */
  .section {
    margin-bottom: 15px;
    padding: 12px;
    border-radius: 8px;
  }
  
  /* Instructions */
  .instructions {
    margin-bottom: 10px;
    padding: 10px;
    background-color: #fdc30f;
    border-radius: 4px;
    font-size: 13px;
  }
  
  /* Button styles */
  button {
    background-color: #3891a6;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s;
  }
  
  button:hover {
    background-color: #2f758a;
  }
  
  button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
    opacity: 0.7;
  }
  
  .button-group {
    display: flex;
    gap: 10px;
    margin-top: 20px;
  }
  
  /* Responsive styles */
  @media (min-width: 768px) {
    .section {
      padding: 15px;
      margin-bottom: 20px;
    }
    .instructions {
      font-size: 14px;
    }
    button {
      padding: 10px 20px;
      font-size: 16px;
    }
  }
  
  @media (max-width: 480px) {
    .section {
      padding: 10px;
      margin-bottom: 15px;
    }
    button {
      padding: 8px 16px;
      font-size: 14px;
    }
  }
</style>