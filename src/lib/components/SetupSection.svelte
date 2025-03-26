<script>
  import { createEventDispatcher } from 'svelte';
  import gameStore, { actions } from '$lib/stores/gameStore.js';

  // Set up event dispatcher to communicate with parent
  const dispatch = createEventDispatcher();
  
  // Subscribe to game store for player data
  $: players = $gameStore?.players || [];
  $: playerNameInput = $gameStore?.playerNameInput || '';
  
  // Add a new player to the game
  function addPlayer() {
    const name = playerNameInput.trim();
    if (!name) {
      alert('Please enter a player name.');
      return;
    }
    if (players.includes(name)) {
      alert('This player is already added.');
      return;
    }
    
    actions.addPlayer(name);
  }

  // Remove a player at the specified index
  function removePlayer(index) {
    actions.removePlayer(index);
  }

  // Clear all players
  function clearPlayers() {
    actions.clearPlayers();
  }

  // Start the game
  function startGame() {
    if (players.length < 2) {
      alert('You need at least 2 players to start the game.');
      return;
    }
    
    dispatch('startGame');
  }

  // Handle Enter key press in the input field
  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      addPlayer();
    }
  }
</script>

<div class="setup-section section">
  <h2>Player Setup</h2>
  <div class="instructions">
    <p>Enter the names of all players who will participate.</p>
  </div>
  
  <div class="form-group">
    <label for="player-name">Player Name:</label>
    <input 
      type="text" 
      id="player-name" 
      placeholder="Enter player name" 
      bind:value={playerNameInput}
      on:keydown={handleKeyDown}
    />
  </div>
  
  <button on:click={addPlayer}>Add Player</button>
  
  <div class="players-list">
    {#each players as player, i}
      <div class="player-item">
        <div style="margin-right: 10px;">{i + 1}.</div>
        <span>{player}</span>
        <button 
          class="secondary" 
          style="padding: 5px 10px;"
          on:click={() => removePlayer(i)}
        >
          Remove
        </button>
      </div>
    {/each}
  </div>
  
  <div class="button-group">
    <button 
      on:click={startGame} 
      disabled={players.length < 2}
    >
      Start Game
    </button>
    <button 
      on:click={clearPlayers} 
      class="secondary"
    >
      Clear All
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
  
  /* Form styles */
  .form-group {
    margin-bottom: 15px;
  }
  
  /* Instructions */
  .instructions {
    margin-bottom: 10px;
    padding: 10px;
    background-color: #fdc30f;
    border-radius: 4px;
    font-size: 13px;
  }
  
  /* Player list styles */
  .players-list {
    margin: 20px 0;
  }
  
  .player-item {
    background-color: #a6d3a0;
    padding: 10px;
    margin-bottom: 10px;
    border-radius: 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .player-item span {
    flex-grow: 1;
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
  
  button.secondary {
    background-color: #db5461;
  }
  
  button.secondary:hover {
    background-color: #c14853;
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