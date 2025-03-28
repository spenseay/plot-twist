<script>
    import { onMount, onDestroy } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { subscribeToRoom } from '$lib/firebase/rooms.js';
    
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
      // Get room from URL parameters (alternative approach)
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
    
    // Start the game (host only)
    async function startGame() {
      if (!canStart || isStarting) return;
      
      isStarting = true;
      
      try {
        // Update room status to 'playing'
        const response = await fetch(`/api/rooms/${roomCode}/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ hostName: playerName })
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to start game');
        }
        
        // We'll be redirected when the room status changes
      } catch (err) {
        console.error('Error starting game:', err);
        error = err.message || 'Error starting game';
        isStarting = false;
      }
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
            <div class="room-code-label">Room Code:</div>
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
              on:click={startGame}
            >
              {#if !canStart}
                Need at least 2 players
              {:else if isStarting}
                Starting...
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
  </div>
  
  <style>
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 15px;
      background: linear-gradient(135deg, #f9f9f9 0%, #e8f2f5 100%);
      border-radius: 10px;
      box-shadow: 0 0 15px rgba(0,0,0,0.1);
      border: 2px solid #4c2c69;
    }
    
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    
    h1 {
      font-size: 1.8em;
      color: #4c2c69;
      margin: 0;
    }
    
    h2 {
      font-size: 1.4em;
      color: #4c2c69;
      margin-top: 15px;
      margin-bottom: 10px;
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
    
    /* Room code display */
    .room-code-container {
      background-color: #f9f9f9;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      margin-bottom: 20px;
      border: 1px solid #ddd;
    }
    
    .room-code-label {
      font-size: 0.9em;
      color: #666;
      margin-bottom: 5px;
    }
    
    .room-code {
      font-size: 2.5em;
      font-weight: bold;
      letter-spacing: 0.1em;
      color: #4c2c69;
      margin-bottom: 5px;
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
      font-size: 0.35em;
      cursor: pointer;
      margin-left: 10px;
      transition: background-color 0.2s;
    }
    
    .copy-button:hover {
      background-color: #2f758a;
    }
    
    .copy-success {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      color: #4c2c69;
      font-size: 0.4em;
      font-weight: normal;
      background-color: #fdc30f;
      padding: 3px 8px;
      border-radius: 4px;
    }
    
    .room-code-help {
      font-size: 0.9em;
      color: #666;
    }
    
    /* Players list */
    .players-container {
      margin-bottom: 20px;
    }
    
    .no-players {
      background-color: #f0f0f0;
      padding: 15px;
      border-radius: 6px;
      text-align: center;
      color: #666;
      font-style: italic;
    }
    
    .players-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .player-item {
      background-color: #f0f0f0;
      padding: 12px 15px;
      border-radius: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .player-item.host {
      background-color: #fdc30f;
    }
    
    .player-name {
      font-weight: bold;
      color: #4c2c69;
      display: flex;
      align-items: center;
    }
    
    .host-badge {
      background-color: #4c2c69;
      color: white;
      font-size: 0.7em;
      padding: 2px 6px;
      border-radius: 10px;
      margin-left: 8px;
      font-weight: normal;
    }
    
    .player-status {
      font-size: 0.9em;
    }
    
    .status {
      padding: 3px 8px;
      border-radius: 10px;
      font-size: 0.85em;
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
      padding: 12px;
      border-radius: 6px;
      font-size: 1.1em;
      cursor: pointer;
      transition: background-color 0.2s;
      box-shadow: 0 4px 0 #3a2050, 0 5px 10px rgba(76, 44, 105, 0.3);
    }
    
    .start-button:hover:not(:disabled) {
      background-color: #3a1f51;
      box-shadow: 0 7px 0 #3a2050, 0 8px 15px rgba(76, 44, 105, 0.4);
      transform: translateY(-3px);
    }
    
    .start-button:active:not(:disabled) {
      transform: translateY(2px);
      box-shadow: 0 2px 0 #3a2050, 0 3px 5px rgba(76, 44, 105, 0.3);
    }
    
    .start-button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
      opacity: 0.7;
      box-shadow: none;
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
    
    @media (min-width: 768px) {
      .container {
        max-width: 700px;
        padding: 20px;
      }
    }
    
    @media (max-width: 480px) {
      .container {
        padding: 12px;
      }
      
      h1 {
        font-size: 1.5em;
      }
      
      .back-button {
        font-size: 0.9rem;
      }
      
      .room-code {
        font-size: 2em;
      }
    }
  </style>