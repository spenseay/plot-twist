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
        const result = await createRoom(hostName);
        
        if (result.success) {
          // Save room info to localStorage for persistence
          localStorage.setItem('ptGameHost', JSON.stringify({
            roomCode: result.roomCode,
            playerName: hostName,
            isHost: true
          }));
          
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
      <button class="back-button" on:click={goBack}>← Back</button>
      <h1>Host a Game</h1>
      <div class="spacer"></div>
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
          {isCreating ? 'Creating Room...' : 'Create Room'}
        </button>
      </form>
      
      <div class="info-box">
        <h3>Hosting Information</h3>
        <p>As the host, you'll create a room and share the room code with others. You'll control when the game starts and can see when everyone has joined.</p>
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
    
    .submit-button {
      background-color: #3891a6;
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 6px;
      font-size: 16px;
      cursor: pointer;
      width: 100%;
      margin-top: 10px;
      transition: background-color 0.2s;
      box-shadow: 0 4px 0 #2a6b7d, 0 5px 10px rgba(56, 145, 166, 0.3);
    }
    
    .submit-button:hover:not(:disabled) {
      background-color: #2f758a;
      box-shadow: 0 7px 0 #2a6b7d, 0 8px 15px rgba(56, 145, 166, 0.4);
      transform: translateY(-3px);
    }
    
    .submit-button:active:not(:disabled) {
      transform: translateY(2px);
      box-shadow: 0 2px 0 #2a6b7d, 0 3px 5px rgba(56, 145, 166, 0.3);
    }
    
    .submit-button:disabled {
      background-color: #cccccc;
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
  