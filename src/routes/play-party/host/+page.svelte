<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { createRoom } from '$lib/firebase/rooms.js';
  
  let hostName = '';
  let isCreating = false;
  let error = null;
  
  // Reference for the host name input element
  let hostNameInput;
  
  // Go back to party mode menu
  function goBack() {
    goto('/play-party');
  }
  
  // Create a new room
  async function hostGame() {
    if (!hostName.trim()) {
      error = "Please enter your name";
      return;
    }
    
    isCreating = true;
    error = null;
    
    try {
      console.log("Creating room with host name:", hostName);
      const result = await createRoom(hostName);
      
      if (result.success) {
        // Save room info to localStorage for persistence
        const sessionData = {
          roomCode: result.roomCode,
          playerName: hostName,
          isHost: true
        };
        
        console.log("Saving session data:", sessionData);
        localStorage.setItem('ptGameHost', JSON.stringify(sessionData));
        
        // Redirect to waiting room
        goto(`/play-party/host/waiting?room=${result.roomCode}`);
      } else {
        error = result.error || "Failed to create room";
      }
    } catch (err) {
      console.error("Error hosting game:", err);
      error = "An unexpected error occurred";
    } finally {
      isCreating = false;
    }
  }
  
  // Set focus on the host name input when the component mounts
  onMount(() => {
    hostNameInput.focus();
  });
</script>

<div class="container">
<div class="header">
  <div class="title-container">
    <h1>Host a Game</h1>
  </div>
  <button class="back-button" on:click={goBack}>← Back</button>
</div>

<div class="content">
  {#if error}
    <div class="error-message">
      <p>{error}</p>
    </div>
  {/if}
  
  <form on:submit|preventDefault={hostGame}>
    <div class="form-group">
      <label for="hostName">Your Name</label>
      <input 
        type="text"
        id="hostName"
        bind:this={hostNameInput}
        bind:value={hostName}
        placeholder="Enter your name"
        maxlength="20"
        required
      />
    </div>
    
    <button 
      type="submit" 
      class="submit-button"
      disabled={isCreating || !hostName}
    >
      <div class="button-content">
        <div class="emoji">🎮</div>
        <div class="text-content">
          <span>{isCreating ? 'Creating Room...' : 'Create Room'}</span>
        </div>
      </div>
    </button>
  </form>
  
  <div class="info-box">
    <h3>Hosting Information</h3>
    <p>As the host, you'll create a room and share the room code with others. You'll control when the game starts and can see when everyone has joined.</p>
  </div>
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
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  position: relative;
  z-index: 2;
}

.title-container {
  flex: 1;
  text-align: center;
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

.back-button {
  position: absolute;
  right: 0;
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

/* Submit button styles */
.submit-button {
  background-color: #3891a6;
  color: white;
  border: none;
  border-radius: 12px;
  padding: 0;
  width: 100%;
  cursor: pointer;
  transition: all 0.3s;
  overflow: hidden;
  margin-top: 10px;
  box-shadow: 0 4px 0 #2a6b7d, 0 5px 10px rgba(56, 145, 166, 0.3);
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
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 7px 0 #2a6b7d, 0 8px 15px rgba(56, 145, 166, 0.4);
}

.submit-button:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #2a6b7d, 0 3px 5px rgba(56, 145, 166, 0.3);
}

.submit-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  opacity: 0.7;
  box-shadow: 0 4px 0 #999999;
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
  }
  
  h1 {
    font-size: 2.8em;
  }
  
  .content {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .container {
    margin: 10px auto;
    padding: 20px 12px;
    max-width: 100%;
    width: 95%;
    border-radius: 10px;
  }
  
  h1 {
    font-size: 2.6em;
  }
  
  .back-button {
    font-size: 1.2rem;
  }
  
  label {
    font-size: 1.4em;
  }
  
  input {
    padding: 15px;
    font-size: 1.4em;
    border-radius: 10px;
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