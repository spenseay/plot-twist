<script>
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { joinRoom } from '$lib/firebase/rooms.js';
    
    let roomCode = '';
    let playerName = '';
    let isJoining = false;
    let error = null;
    
    // Format room code to uppercase
    function formatRoomCode() {
      roomCode = roomCode.toUpperCase();
    }
    
    // Go back to party mode menu
    function goBack() {
      goto('/play-party');
    }
    
    // Join a room
    async function joinGame() {
      if (!roomCode.trim() || !playerName.trim()) {
        error = "Please fill out all fields";
        return;
      }
      
      isJoining = true;
      error = null;
      
      try {
        const result = await joinRoom(roomCode, playerName);
        
        if (result.success) {
          // Save room info to localStorage for persistence
          localStorage.setItem('ptGamePlayer', JSON.stringify({
            roomCode: result.roomCode,
            playerName: playerName,
            isHost: false
          }));
          
          // Redirect to waiting room
          goto(`/play-party/join/waiting?room=${result.roomCode}`);
        } else {
          error = result.error || "Failed to join room";
        }
      } catch (err) {
        console.error("Error joining game:", err);
        error = "An unexpected error occurred";
      } finally {
        isJoining = false;
      }
    }
  </script>
  
  <div class="container">
    <div class="header">
      <button class="back-button" on:click={goBack}>← Back</button>
      <h1>Join a Game</h1>
      <div class="spacer"></div>
    </div>
    
    <div class="content">
      {#if error}
        <div class="error-message">
          <p>{error}</p>
        </div>
      {/if}
      
      <form on:submit|preventDefault={joinGame}>
        <div class="form-group">
          <label for="roomCode">Room Code</label>
          <input 
            type="text"
            id="roomCode"
            bind:value={roomCode}
            on:input={formatRoomCode}
            placeholder="Enter 4-letter code"
            maxlength="4"
            required
            autofocus
          />
          <div class="input-help">Ask the host for the room code</div>
        </div>
        
        <div class="form-group">
          <label for="playerName">Your Name</label>
          <input 
            type="text"
            id="playerName"
            bind:value={playerName}
            placeholder="Enter your name"
            maxlength="20"
            required
          />
        </div>
        
        <button 
          type="submit" 
          class="submit-button"
          disabled={isJoining || !roomCode || !playerName}
        >
          {isJoining ? 'Joining...' : 'Join Game'}
        </button>
      </form>
      
      <div class="info-box">
        <h3>Joining Information</h3>
        <p>Enter the 4-character room code provided by the host and your name. After joining, you'll wait in a lobby until the host starts the game.</p>
      </div>
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
    
    h3 {
      color: #4c2c69;
      margin-top: 0;
      margin-bottom: 10px;
      font-size: 1.2em;
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
    
    .form-group {
      margin-bottom: 20px;
    }
    
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
      color: #4c2c69;
    }
    
    input {
      width: 100%;
      padding: 12px;
      border: 2px solid #ddd;
      border-radius: 6px;
      font-size: 16px;
      transition: border-color 0.2s;
    }
    
    input:focus {
      border-color: #3891a6;
      outline: none;
    }
    
    #roomCode {
      text-transform: uppercase;
      letter-spacing: 0.2em;
      font-weight: bold;
      text-align: center;
      font-size: 20px;
    }
    
    .input-help {
      margin-top: 5px;
      font-size: 0.8em;
      color: #666;
    }
    
    .submit-button {
      background-color: #fdc30f;
      color: #4c2c69;
      font-weight: bold;
      border: none;
      padding: 12px 20px;
      border-radius: 6px;
      font-size: 16px;
      cursor: pointer;
      width: 100%;
      margin-top: 10px;
      transition: background-color 0.2s;
      box-shadow: 0 4px 0 #d9a40b, 0 5px 10px rgba(253, 195, 15, 0.3);
    }
    
    .submit-button:hover:not(:disabled) {
      background-color: #e6b30e;
      box-shadow: 0 7px 0 #d9a40b, 0 8px 15px rgba(253, 195, 15, 0.4);
      transform: translateY(-3px);
    }
    
    .submit-button:active:not(:disabled) {
      transform: translateY(2px);
      box-shadow: 0 2px 0 #d9a40b, 0 3px 5px rgba(253, 195, 15, 0.3);
    }
    
    .submit-button:disabled {
      background-color: #cccccc;
      color: #666;
      cursor: not-allowed;
      opacity: 0.7;
      box-shadow: none;
    }
    
    .info-box {
      background-color: #f9f9f9;
      border-radius: 8px;
      padding: 15px;
      margin-top: 25px;
      border: 1px solid #ddd;
    }
    
    .error-message {
      background-color: #fde8e8;
      border-left: 4px solid #e53e3e;
      padding: 10px 15px;
      margin-bottom: 20px;
      border-radius: 4px;
      color: #e53e3e;
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
    }
  </style>