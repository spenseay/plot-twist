<script>
  import { createEventDispatcher } from 'svelte';
  import gameStore, { actions } from '$lib/stores/gameStore.js';
  import PlayerList from '$lib/components/UI/PlayerList.svelte';

  // Set up event dispatcher to communicate with parent
  const dispatch = createEventDispatcher();
  
  // Reference to the PlayerList component
  let playerListComponent;
  
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
  
  // Clear all players using the PlayerList component's method
  function clearPlayers() {
    playerListComponent.clearPlayers();
  }
</script>

<div class="setup-section section">
  <h2>Player Setup</h2>
  <div class="instructions">
    <p>Enter the names of all players who will participate.</p>
  </div>
  
  <!-- Use our PlayerList component with a reference -->
  <div class="player-list-container">
    <PlayerList 
      bind:this={playerListComponent}
      on:playerAdded={handlePlayerAdded}
      on:playerRemoved={handlePlayerRemoved}
      on:playersCleared={handlePlayersCleared}
    />
  </div>
  
  <div class="button-group">
    <button 
      class="start-button"
      on:click={startGame} 
      disabled={players.length < 2}
    >
      <div class="button-content">
        <div class="emoji">🎮</div>
        <div class="text-content">
          <span>{players.length < 2 ? 'Need at least 2 players' : 'Start Game'}</span>
        </div>
      </div>
    </button>
    
    <!-- Clear All button moved here to be aligned with Start Game -->
    <button 
      class="clear-button"
      on:click={clearPlayers}
      disabled={players.length === 0}
    >
      <div class="button-content">
        <div class="emoji">🗑️</div>
        <div class="text-content">
          <span>Clear All</span>
        </div>
      </div>
    </button>
  </div>
  
  <!-- Decorative elements -->
  <div class="decoration top-left"></div>
  <div class="decoration top-right"></div>
  <div class="decoration bottom-left"></div>
  <div class="decoration bottom-right"></div>
</div>

<style>
  .setup-section {
    background: linear-gradient(135deg, #f9f9f9 0%, #fff2d1 100%);
    position: relative;
    overflow: hidden;
    border: 2px solid #4c2c69;
    box-shadow: 0 8px 25px rgba(76, 44, 105, 0.15);
  }
  
  /* Decorative elements */
  .decoration {
    position: absolute;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    opacity: 0.2;
    z-index: 0;
  }
  
  .top-left {
    top: -30px;
    left: -30px;
    background-color: #fdc30f;
  }
  
  .top-right {
    top: -20px;
    right: -20px;
    background-color: #3891a6;
    width: 70px;
    height: 70px;
  }
  
  .bottom-left {
    bottom: -20px;
    left: -20px;
    background-color: #a6d3a0;
    width: 70px;
    height: 70px;
  }
  
  .bottom-right {
    bottom: -30px;
    right: -30px;
    background-color: #db5461;
  }
  
  /* Section styles */
  .section {
    margin-bottom: 15px;
    padding: 20px;
    border-radius: 15px;
    position: relative;
  }
  
  h2 {
    font-size: 2.2em;
    color: #4c2c69;
    margin-bottom: 15px;
    position: relative;
    z-index: 1;
    text-align: center;
  }
  
  /* Instructions */
  .instructions {
    margin-bottom: 20px;
    padding: 15px;
    background-color: #fdc30f;
    border-radius: 10px;
    font-size: 1.1em;
    position: relative;
    z-index: 1;
    box-shadow: 0 4px 0 #d9a40b, 0 5px 10px rgba(253, 195, 15, 0.2);
    color: #4c2c69;
    font-weight: bold;
    text-align: center;
  }
  
  .player-list-container {
    position: relative;
    z-index: 1;
    margin-bottom: 10px;
    width: 100%;
    box-sizing: border-box;
  }
  
  /* Button styles */
  .button-group {
    display: flex;
    gap: 15px;
    margin-top: 20px;
    position: relative;
    z-index: 1;
    flex-direction: column;
  }
  
  .start-button, .clear-button {
    border: none;
    border-radius: 12px;
    padding: 0;
    cursor: pointer;
    transition: all 0.3s;
    overflow: hidden;
    width: 100%;
  }
  
  .start-button {
    background-color: #3891a6;
    color: white;
    box-shadow: 0 4px 0 #2a6b7d, 0 5px 10px rgba(56, 145, 166, 0.3);
  }
  
  .clear-button {
    background-color: #db5461;
    color: white;
    box-shadow: 0 4px 0 #b73642, 0 5px 10px rgba(219, 84, 97, 0.3);
  }
  
  .button-content {
    display: flex;
    align-items: center;
    padding: 14px 20px;
    justify-content: center;
  }
  
  .emoji {
    font-size: 1.5em;
    margin-right: 12px;
  }
  
  .text-content {
    font-size: 1.2em;
    font-weight: bold;
  }
  
  .start-button:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 7px 0 #2a6b7d, 0 8px 15px rgba(56, 145, 166, 0.4);
  }
  
  .clear-button:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 7px 0 #b73642, 0 8px 15px rgba(219, 84, 97, 0.4);
  }
  
  .start-button:active:not(:disabled), 
  .clear-button:active:not(:disabled) {
    transform: translateY(2px);
    box-shadow: 0 2px 0 #2a6b7d, 0 3px 5px rgba(0, 0, 0, 0.2);
  }
  
  .start-button:disabled, 
  .clear-button:disabled {
    background-color: #cccccc;
    color: #666666;
    cursor: not-allowed;
    opacity: 0.7;
    box-shadow: 0 4px 0 #999999;
  }
  
  /* Modify some of PlayerList component's styles */
  :global(.setup-section .player-item) {
    background-color: #a6d3a0;
    box-shadow: 0 3px 0 #85b57e, 0 4px 6px rgba(166, 211, 160, 0.3);
    transition: all 0.2s;
  }
  
  :global(.setup-section .player-item:hover) {
    transform: translateX(5px);
  }
  
  :global(.setup-section .form-group input[type="text"]) {
    border: 2px solid rgba(76, 44, 105, 0.3);
    border-radius: 8px;
    padding: 12px;
    font-size: 16px;
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
    transition: all 0.3s;
  }
  
  :global(.setup-section .form-group input[type="text"]:focus) {
    border-color: #3891a6;
    box-shadow: 0 0 0 3px rgba(56, 145, 166, 0.3);
    outline: none;
  }
  
  :global(.setup-section .add-player-btn) {
    background-color: #3891a6;
    box-shadow: 0 3px 0 #2a6b7d, 0 4px 6px rgba(56, 145, 166, 0.3);
    transition: all 0.2s;
  }
  
  :global(.setup-section .add-player-btn:hover) {
    transform: translateY(-2px);
    box-shadow: 0 5px 0 #2a6b7d, 0 6px 10px rgba(56, 145, 166, 0.4);
  }
  
  :global(.setup-section .remove-btn) {
    box-shadow: 0 2px 0 #b73642, 0 3px 5px rgba(219, 84, 97, 0.3);
    transition: all 0.2s;
  }
  
  :global(.setup-section .remove-btn:hover) {
    transform: translateY(-2px);
    box-shadow: 0 4px 0 #b73642, 0 5px 8px rgba(219, 84, 97, 0.4);
  }
  
  /* Responsive styles */
  @media (min-width: 768px) {
    .section {
      padding: 30px;
      margin-bottom: 25px;
    }
    
    .instructions {
      font-size: 1.2em;
      padding: 18px;
    }
    
    .button-group {
      flex-direction: row;
      justify-content: space-between;
    }
    
    .start-button {
      flex: 3;
    }
    
    .clear-button {
      flex: 1;
    }
  }
  
  @media (max-width: 480px) {
    .section {
      padding: 18px 14px;
      border-radius: 12px;
      margin-bottom: 15px;
    }
    
    h2 {
      font-size: 2.4em;
      margin-bottom: 15px;
    }
    
    .instructions {
      font-size: 1.4em;
      line-height: 1.4;
      padding: 15px;
    }
    
    .button-content {
      padding: 16px 20px;
    }
    
    .emoji {
      font-size: 2em;
    }
    
    .text-content {
      font-size: 1.6em;
    }
    
    /* Make decoration less prominent on mobile */
    .decoration {
      opacity: 0.15;
    }
    
    :global(.setup-section .form-group input[type="text"]) {
      font-size: 1.4em;
      padding: 14px;
    }
    
    :global(.setup-section .player-item) {
      padding: 15px;
    }
    
    :global(.setup-section .player-name) {
      font-size: 1.4em;
    }
  }
</style>