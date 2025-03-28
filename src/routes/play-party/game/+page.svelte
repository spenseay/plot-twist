<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    
    let roomCode = '';
    
    onMount(() => {
      if ($page.url.searchParams.has('room')) {
        roomCode = $page.url.searchParams.get('room');
      } else {
        goto('/play-party');
      }
    });
    
    function goBack() {
      goto('/play-party');
    }
  </script>
  
  <div class="container">
    <div class="header">
      <button class="back-button" on:click={goBack}>← Menu</button>
      <h1>Party Game</h1>
      <div class="spacer"></div>
    </div>
    
    <div class="content">
      <div class="placeholder">
        <h2>Game Started!</h2>
        <p>Room Code: {roomCode}</p>
        <p class="note">This is a placeholder for the actual game interface.</p>
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
    
    .placeholder {
      background-color: #fdc30f;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    
    h2 {
      color: #4c2c69;
      margin-bottom: 15px;
    }
    
    .note {
      font-style: italic;
      margin-top: 20px;
      color: #666;
    }
  </style>