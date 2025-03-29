<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { joinRoom } from '$lib/firebase/rooms.js';
  
  let roomCode = '';
  let playerName = '';
  let isJoining = false;
  let error = null;
  
  // Reference for the room code input element
  let roomCodeInput;
  
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
  
  // Set focus on the room code input when the component mounts
  onMount(() => {
    roomCodeInput.focus();
  });
</script>

<div class="container">
<div class="header">
  <h1>Join a Game</h1>
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
        bind:this={roomCodeInput}
        bind:value={roomCode}
        on:input={formatRoomCode}
        placeholder="C-0-D-E"
        maxlength="4"
        required
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
      <div class="button-content">
        <div class="emoji">🔗</div>
        <div class="text-content">
          <span>{isJoining ? 'Joining...' : 'Join Game'}</span>
        </div>
      </div>
    </button>
  </form>
  
  <div class="info-box">
    <h3>Joining Information</h3>
    <p>Enter the 4-character room code provided by the host and your name. After joining, you'll wait in a lobby until the host starts the game.</p>
  </div>
</div>

<!-- Back button at bottom left -->
<div class="back-button-container">
  <button class="back-button" on:click={goBack}>← Back</button>
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
  text-align: center;
  position: relative;
  overflow: hidden;
  border: 2px solid #4c2c69;
  padding-bottom: 70px; /* Make room for the back button */
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

/* Header section */
.header {
  text-align: center;
  margin-bottom: 20px;
  position: relative;
  z-index: 2;
}

h1 {
  font-size: 2.4em;
  color: #4c2c69;
  margin: 0;
}

h3 {
  color: #4c2c69;
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 1.3em;
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

.content {
  padding: 15px;
  position: relative;
  z-index: 2;
  width: 100%;
  box-sizing: border-box;
}

/* Form styles */
.form-group {
  margin-bottom: 25px;
  text-align: left;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #4c2c69;
  font-size: 1.2em;
}

input {
  width: 100%;
  padding: 15px;
  border: 2px solid rgba(76, 44, 105, 0.2);
  border-radius: 8px;
  font-size: 1.2em;
  transition: all 0.3s ease;
  background-color: rgba(255, 255, 255, 0.8);
  box-sizing: border-box;
  max-width: 100%;
}

input:focus {
  border-color: #3891a6;
  outline: none;
  box-shadow: 0 0 0 3px rgba(56, 145, 166, 0.3);
  background-color: white;
}

#roomCode {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-weight: bold;
  text-align: center;
  font-size: 1.5em;
}

.input-help {
  margin-top: 6px;
  font-size: 0.9em;
  color: #666;
  font-style: italic;
}

/* Submit button styles */
.submit-button {
  background-color: #fdc30f;
  color: #4c2c69;
  border: none;
  border-radius: 12px;
  padding: 0;
  width: 100%;
  cursor: pointer;
  transition: all 0.3s;
  overflow: hidden;
  margin-top: 10px;
  box-shadow: 0 4px 0 #d9a40b, 0 5px 10px rgba(253, 195, 15, 0.3);
}

.button-content {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  justify-content: center;
}

.emoji {
  font-size: 1.8em;
  margin-right: 12px;
}

.text-content {
  font-size: 1.3em;
  font-weight: bold;
  color: #4c2c69;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 7px 0 #d9a40b, 0 8px 15px rgba(253, 195, 15, 0.4);
}

.submit-button:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #d9a40b, 0 3px 5px rgba(253, 195, 15, 0.3);
}

.submit-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  opacity: 0.7;
  box-shadow: 0 4px 0 #999999;
}

.submit-button:disabled .text-content {
  color: #666;
}

/* Info box styling */
.info-box {
  background-color: rgba(76, 44, 105, 0.05);
  border-radius: 12px;
  padding: 20px;
  margin-top: 30px;
  position: relative;
  text-align: left;
  border: 1px solid rgba(76, 44, 105, 0.2);
}

.info-box p {
  color: #4c2c69;
  font-size: 1.1em;
  line-height: 1.5;
  margin: 0;
}

/* Error message styling */
.error-message {
  background-color: #fde8e8;
  border-left: 4px solid #e53e3e;
  padding: 12px 15px;
  margin-bottom: 20px;
  border-radius: 8px;
  color: #e53e3e;
  text-align: left;
  font-weight: bold;
}

/* Responsive styles */
@media (min-width: 768px) {
  .container {
    max-width: 700px;
    padding: 30px;
    padding-bottom: 80px;
  }
  
  h1 {
    font-size: 2.8em;
  }
  
  .content {
    padding: 20px;
  }
  
  .back-button {
    font-size: 1.1rem;
    padding: 12px 24px;
  }
}

@media (max-width: 480px) {
  .container {
    margin: 10px auto;
    padding: 20px 12px;
    max-width: 100%;
    width: 95%;
    border-radius: 10px;
    padding-bottom: 70px;
  }
  
  h1 {
    font-size: 2.4em;
  }
  
  .back-button {
    font-size: 0.9rem;
    padding: 8px 16px;
  }
  
  .back-button-container {
    bottom: 15px;
    left: 15px;
  }
  
  label {
    font-size: 1.4em;
  }
  
  input {
    padding: 15px;
    font-size: 1.4em;
    border-radius: 10px;
  }
  
  #roomCode {
    font-size: 1.8em;
    letter-spacing: 0.25em;
  }
  
  .input-help {
    font-size: 1.1em;
    margin-top: 8px;
  }
  
  .button-content {
    padding: 18px 20px;
  }
  
  .emoji {
    font-size: 2.2em;
  }
  
  .text-content {
    font-size: 1.8em;
  }
  
  .info-box {
    padding: 18px;
    margin-top: 25px;
  }
  
  .info-box h3 {
    font-size: 1.6em;
  }
  
  .info-box p {
    font-size: 1.3em;
  }
  
  /* Make decorations less prominent on mobile */
  .decoration {
    opacity: 0.15;
  }
}
</style>