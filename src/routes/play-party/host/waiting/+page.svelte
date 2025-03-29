<script>
    import { onMount, onDestroy } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { database } from '$lib/firebase/config.js';
    import { ref, update } from 'firebase/database';
    import { subscribeToRoom, startGame } from '$lib/firebase/rooms.js';
    
    // Room information
    let roomCode = '';
    let playerName = '';
    let isHost = false;
    let roomData = null;
    let players = [];
    let unsubscribe = null;
    let canStart = false;
    let isStarting = false;
    let showCopySuccess = false;
    let error = null;
    
    // Load session from localStorage
    onMount(() => {
      // Get room from URL parameters
      if ($page.url.searchParams.has('room')) {
        roomCode = $page.url.searchParams.get('room');
      }
      
      // Try to load from localStorage as fallback
      if (!roomCode) {
        try {
          const savedSession = localStorage.getItem('ptGameHost');
          if (savedSession) {
            const session = JSON.parse(savedSession);
            roomCode = session.roomCode;
            playerName = session.playerName;
            isHost = session.isHost;
          }
        } catch (err) {
          console.error('Error loading session:', err);
        }
      }
      
      // Redirect if no room code
      if (!roomCode) {
        goto('/play-party/host');
        return;
      }
      
      // Subscribe to room updates
      subscribeToRoomUpdates();
    });
    
    onDestroy(() => {
      // Clean up subscription
      if (unsubscribe) {
        unsubscribe();
      }
    });
    
    // Subscribe to room updates
    function subscribeToRoomUpdates() {
      if (!roomCode) return;
      
      unsubscribe = subscribeToRoom(roomCode, (result) => {
        if (result.exists) {
          roomData = result.data;
          
          // Check if game started
          if (roomData.status === 'playing') {
            goto(`/play-party/game?room=${roomCode}`);
            return;
          }
          
          // Extract and sort players
          if (roomData.players) {
            players = Object.entries(roomData.players).map(([name, data]) => ({
              name,
              isHost: data.isHost,
              joinedAt: data.joinedAt
            })).sort((a, b) => {
              // Host first, then by join time
              if (a.isHost) return -1;
              if (b.isHost) return 1;
              return a.joinedAt - b.joinedAt;
            });
          }
          
          // Check if we can start the game (need at least 2 players)
          canStart = players.length >= 2;
        } else {
          // Room doesn't exist
          error = 'Room no longer exists';
          roomData = null;
          players = [];
        }
      });
    }
    
    // Copy room code to clipboard
    function copyRoomCode() {
      navigator.clipboard.writeText(roomCode)
        .then(() => {
          showCopySuccess = true;
          setTimeout(() => {
            showCopySuccess = false;
          }, 2000);
        })
        .catch(err => {
          console.error('Failed to copy room code:', err);
        });
    }
    
    // Start the game
    async function handleStartGame() {
      if (!canStart || isStarting) return;
      
      isStarting = true;
      
      try {
        const result = await startGame(roomCode);
        
        if (!result.success) {
          error = result.error || 'Failed to start the game';
          isStarting = false;
        }
        // If successful, we'll be redirected by the room subscription
      } catch (err) {
        console.error('Error starting game:', err);
        error = err.message || 'An unexpected error occurred';
        isStarting = false;
      }
    }
    
    // Leave the room
    function leaveRoom() {
      if (unsubscribe) {
        unsubscribe();
      }
      
      // Clear session
      localStorage.removeItem('ptGameHost');
      
      // Redirect to party mode page
      goto('/play-party');
    }
</script>

<div class="container">
  <div class="header">
    <button class="back-button" on:click={leaveRoom}>← Leave</button>
    <h1>Waiting Room</h1>
    <div class="spacer"></div>
  </div>
  
  <div class="content">
    {#if error}
      <div class="error-message">
        <p>{error}</p>
        <button class="try-again" on:click={() => goto('/play-party')}>
          Back to Menu
        </button>
      </div>
    {:else if roomData}
      <div class="room-info">
        <div class="room-code-container">
          <div class="room-code-label">Room Code</div>
          <div class="room-code">
            {roomCode}
            <button class="copy-button" on:click={copyRoomCode}>
              Copy
            </button>
            {#if showCopySuccess}
              <div class="copy-success">Copied!</div>
            {/if}
          </div>
          <div class="room-code-help">Share this code with your friends so they can join!</div>
        </div>
        
        <div class="players-container">
          <h2>Players ({players.length})</h2>
          
          {#if players.length === 0}
            <div class="no-players">
              Waiting for players to join...
            </div>
          {:else}
            <div class="players-list">
              {#each players as player}
                <div class="player-item" class:host={player.isHost}>
                  <div class="player-name">
                    {player.name}
                    {#if player.isHost}
                      <span class="host-badge">Host</span>
                    {/if}
                  </div>
                  <div class="player-status">
                    <span class="status ready">Ready</span>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
        
        <div class="host-controls">
          <button 
            class="start-button"
            disabled={!canStart || isStarting}
            on:click={handleStartGame}
          >
            {#if isStarting}
              Starting Game...
            {:else if !canStart}
              Need at least 2 players
            {:else}
              Start Game
            {/if}
          </button>
        </div>
      </div>
    {:else}
      <div class="loading">
        <p>Loading room data...</p>
      </div>
    {/if}
  </div>
  
  <!-- Decorative elements -->
  <div class="decoration top-left"></div>
  <div class="decoration top-right"></div>
  <div class="decoration bottom-left"></div>
  <div class="decoration bottom-right"></div>
</div>

<style>
  /* Container with background gradient */
  .container {
    max-width: 600px;
    margin: 30px auto;
    padding: 25px;
    background: linear-gradient(135deg, #f9f9f9 0%, #e8f2f5 100%);
    border-radius: 15px;
    box-shadow: 0 8px 25px rgba(76, 44, 105, 0.15);
    position: relative;
    overflow: hidden;
    border: 2px solid #4c2c69;
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
  
  /* Header styles */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    position: relative;
    z-index: 2;
  }
  
  h1 {
    font-size: 2.4em;
    color: #4c2c69;
    margin: 0;
  }
  
  h2 {
    font-size: 1.6em;
    color: #4c2c69;
    margin-top: 15px;
    margin-bottom: 10px;
  }
  
  .back-button {
    background: none;
    border: none;
    color: #3891a6;
    font-size: 1.1rem;
    cursor: pointer;
    padding: 5px 10px;
    border-radius: 4px;
    transition: all 0.2s;
  }
  
  .back-button:hover {
    background-color: rgba(56, 145, 166, 0.1);
    transform: translateX(-2px);
  }
  
  .spacer {
    width: 70px;
  }
  
  .content {
    position: relative;
    z-index: 2;
  }
  
  .loading {
    text-align: center;
    padding: 20px;
    font-style: italic;
    color: #666;
    font-size: 1.2em;
  }
  
  /* Room code display */
  .room-code-container {
    background-color: #4c2c69;
    padding: 20px;
    border-radius: 12px;
    text-align: center;
    margin-bottom: 25px;
    color: white;
    box-shadow: 0 4px 0 #3a1f51, 0 5px 15px rgba(76, 44, 105, 0.3);
  }
  
  .room-code-label {
    font-size: 1.1em;
    margin-bottom: 5px;
    text-transform: uppercase;
    letter-spacing: 1px;
    opacity: 0.9;
  }
  
  .room-code {
    font-size: 2.8em;
    font-weight: bold;
    letter-spacing: 0.1em;
    margin: 10px 0;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .copy-button {
    background-color: #3891a6;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 5px 10px;
    font-size: 0.4em;
    cursor: pointer;
    margin-left: 15px;
    transition: all 0.2s;
  }
  
  .copy-button:hover {
    background-color: #2f758a;
    transform: translateY(-2px);
  }
  
  .copy-success {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background-color: #fdc30f;
    color: #4c2c69;
    font-size: 0.4em;
    font-weight: normal;
    padding: 3px 10px;
    border-radius: 4px;
    animation: fadeIn 0.3s;
  }
  
  @keyframes fadeIn {
    0% { opacity: 0; transform: translate(-50%, 5px); }
    100% { opacity: 1; transform: translate(-50%, 0); }
  }
  
  .room-code-help {
    font-size: 1.1em;
    opacity: 0.9;
    margin-top: 10px;
  }
  
  /* Players list */
  .players-container {
    margin-bottom: 25px;
  }
  
  .no-players {
    background-color: rgba(255, 255, 255, 0.7);
    padding: 15px;
    border-radius: 8px;
    text-align: center;
    color: #666;
    font-style: italic;
    font-size: 1.1em;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0% { opacity: 0.7; }
    50% { opacity: 1; }
    100% { opacity: 0.7; }
  }
  
  .players-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .player-item {
    background-color: white;
    padding: 15px;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s;
  }
  
  .player-item:hover {
    transform: translateX(3px);
  }
  
  .player-item.host {
    background-color: #fdc30f;
    box-shadow: 0 2px 4px rgba(253, 195, 15, 0.3);
  }
  
  .player-name {
    font-weight: bold;
    color: #4c2c69;
    display: flex;
    align-items: center;
    font-size: 1.2em;
  }
  
  .host-badge {
    background-color: #4c2c69;
    color: white;
    font-size: 0.7em;
    padding: 3px 8px;
    border-radius: 10px;
    margin-left: 10px;
    font-weight: normal;
  }
  
  .player-status {
    font-size: 0.9em;
  }
  
  .status {
    padding: 5px 10px;
    border-radius: 20px;
    font-size: 0.9em;
    font-weight: bold;
  }
  
  .status.ready {
    background-color: #a6d3a0;
    color: #2a6b34;
  }
  
  /* Host controls */
  .host-controls {
    margin-top: 20px;
  }
  
  .start-button {
    background-color: #4c2c69;
    color: white;
    border: none;
    width: 100%;
    padding: 15px;
    border-radius: 8px;
    font-size: 1.3em;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 4px 0 #3a1f51, 0 5px 15px rgba(76, 44, 105, 0.3);
  }
  
  .start-button:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 7px 0 #3a1f51, 0 8px 15px rgba(76, 44, 105, 0.4);
  }
  
  .start-button:active:not(:disabled) {
    transform: translateY(2px);
    box-shadow: 0 2px 0 #3a1f51, 0 3px 5px rgba(76, 44, 105, 0.3);
  }
  
  .start-button:disabled {
    background-color: #a8a8a8;
    cursor: not-allowed;
    box-shadow: 0 4px 0 #858585;
    opacity: 0.8;
  }
  
  /* Error message */
  .error-message {
    background-color: #fde8e8;
    border-left: 4px solid #e53e3e;
    padding: 15px;
    margin-bottom: 20px;
    border-radius: 8px;
    color: #e53e3e;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  .try-again {
    align-self: center;
    background-color: #e53e3e;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 1.1em;
  }
  
  .try-again:hover {
    background-color: #c53030;
    transform: translateY(-2px);
  }
  
  /* Responsive styles */
  @media (min-width: 768px) {
    .container {
      max-width: 700px;
      padding: 30px;
    }
    
    h1 {
      font-size: 2.8em;
    }
  }
  
  @media (max-width: 480px) {
    .container {
      margin: 10px auto;
      padding: 20px 15px;
      max-width: 100%;
    }
    
    h1 {
      font-size: 2.6em;
    }
    
    h2 {
      font-size: 1.8em;
    }
    
    .back-button {
      font-size: 1.2rem;
    }
    
    .room-code {
      font-size: 3.2em;
    }
    
    .room-code-label {
      font-size: 1.3em;
    }
    
    .room-code-help {
      font-size: 1.3em;
    }
    
    .copy-button {
      padding: 8px 12px;
      font-size: 0.35em;
      border-radius: 6px;
    }
    
    .player-item {
      padding: 15px;
    }
    
    .player-name {
      font-size: 1.6em;
    }
    
    .host-badge {
      font-size: 0.6em;
      padding: 4px 10px;
    }
    
    .status {
      font-size: 1em;
      padding: 6px 12px;
    }
    
    .start-button {
      padding: 18px;
      font-size: 1.6em;
      border-radius: 10px;
    }
    
    .decoration {
      opacity: 0.15;
    }
    
    .no-players {
      font-size: 1.3em;
      padding: 20px;
    }
  }
</style>