<script>
    import { createEventDispatcher } from 'svelte';
    import gameStore, { actions } from '$lib/stores/gameStore.js';
  
    // Props - These can be overridden by the parent component if needed
    export let canAddPlayers = true;
    export let showControls = true;
    export let showRemoveButtons = true;
    export let showPlayerNumbers = true;
  
    // Set up event dispatcher to communicate with parent
    const dispatch = createEventDispatcher();
    
    // Subscribe to game store for player data
    $: players = $gameStore?.players || [];
    $: playerNameInput = $gameStore?.playerNameInput || '';
  
    // Handle player input change
    function updatePlayerNameInput(e) {
      const value = e.target.value;
      gameStore.update(state => ({
        ...state,
        playerNameInput: value
      }));
    }
    
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
      dispatch('playerAdded', { player: name });
    }
  
    // Remove a player at the specified index
    function removePlayer(index) {
      const playerName = players[index];
      actions.removePlayer(index);
      dispatch('playerRemoved', { player: playerName, index });
    }
  
    // Expose clearPlayers as a method that can be called from parent components
    export function clearPlayers() {
      actions.clearPlayers();
      dispatch('playersCleared');
    }
  
    // Handle Enter key press in the input field
    function handleKeyDown(e) {
      if (e.key === 'Enter' && canAddPlayers) {
        addPlayer();
      }
    }
  </script>
  
  <div class="player-list-component">
    {#if canAddPlayers}
      <div class="form-group">
        <label for="player-name">Player Name:</label>
        <input 
          type="text" 
          id="player-name" 
          placeholder="Enter player name" 
          value={playerNameInput}
          on:input={updatePlayerNameInput}
          on:keydown={handleKeyDown}
        />
      </div>
      
      <button class="add-player-btn" on:click={addPlayer}>Add Player</button>
    {/if}
    
    <div class="players-list">
      {#each players as player, i}
        <div class="player-item">
          {#if showPlayerNumbers}
            <div class="player-number">{i + 1}.</div>
          {/if}
          <span class="player-name">{player}</span>
          {#if showRemoveButtons}
            <button 
              class="remove-btn secondary" 
              on:click={() => removePlayer(i)}
            >
              Remove
            </button>
          {/if}
        </div>
      {/each}
    </div>
    
    <!-- Removed the Clear All button from this component -->
    <!-- It will be handled by the parent component to ensure proper alignment -->
  </div>
  
  <style>
    /* Form styles */
    .form-group {
      margin-bottom: 15px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    
    .form-group input[type="text"] {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 16px;
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
    
    .player-number {
      margin-right: 10px;
      flex-shrink: 0;
    }
    
    .player-name {
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
    
    .remove-btn {
      padding: 5px 10px;
      font-size: 14px;
    }
    
    .player-list-controls {
      display: flex;
      justify-content: flex-end;
      margin-top: 10px;
    }
    
    /* Responsive styles */
    @media (min-width: 768px) {
      button {
        padding: 10px 20px;
        font-size: 16px;
      }
    }
    
    @media (max-width: 480px) {
      button {
        padding: 8px 16px;
        font-size: 14px;
      }
    }
  </style>