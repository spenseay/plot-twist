<script>
    import { goto } from '$app/navigation';
    
    function hostGame() {
      goto('/play-party/host');
    }
    
    function joinGame() {
      goto('/play-party/join');
    }
    
    function goToMainMenu() {
      goto('/');
    }
  </script>
  
  <div class="container">
    <div class="header">
      <button class="back-button" on:click={goToMainMenu}>← Menu</button>
      <h1>Party Mode</h1>
      <div class="spacer"></div>
    </div>
    
    <div class="content">
      <p class="description">
        Play with friends on separate devices! One person creates a room, then 
        everyone joins using the room code.
      </p>
      
      <div class="options">
        <button class="option-button host" on:click={hostGame}>
          <span class="emoji">🎯</span>
          <div class="button-text">
            <span class="title">Host a Game</span>
            <span class="subtitle">Create a new room for friends to join</span>
          </div>
        </button>
        
        <button class="option-button join" on:click={joinGame}>
          <span class="emoji">🔗</span>
          <div class="button-text">
            <span class="title">Join a Game</span>
            <span class="subtitle">Enter a room code to join friends</span>
          </div>
        </button>
      </div>
      
      <div class="info-box">
        <h3>How Party Mode Works</h3>
        <ol>
          <li>One person hosts and creates a room</li>
          <li>Everyone joins using the room code</li>
          <li>The host starts the game when everyone's ready</li>
          <li>Each player uses their own device to place pins</li>
          <li>Results are shown to everyone when finished</li>
        </ol>
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
    
    .description {
      text-align: center;
      margin-bottom: 25px;
      font-size: 1.1em;
      color: #555;
    }
    
    .options {
      display: flex;
      flex-direction: column;
      gap: 15px;
      margin-bottom: 30px;
    }
    
    .option-button {
      display: flex;
      align-items: center;
      padding: 16px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      text-align: left;
    }
    
    .option-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0,0,0,0.1);
    }
    
    .host {
      background-color: #3891a6;
      color: white;
      box-shadow: 0 4px 0 #2a6b7d, 0 5px 10px rgba(56, 145, 166, 0.3);
    }
    
    .host:hover {
      box-shadow: 0 7px 0 #2a6b7d, 0 8px 15px rgba(56, 145, 166, 0.4);
    }
    
    .join {
      background-color: #fdc30f;
      color: #4c2c69;
      box-shadow: 0 4px 0 #d9a40b, 0 5px 10px rgba(253, 195, 15, 0.3);
    }
    
    .join:hover {
      box-shadow: 0 7px 0 #d9a40b, 0 8px 15px rgba(253, 195, 15, 0.4);
    }
    
    .emoji {
      font-size: 2em;
      margin-right: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 50px;
    }
    
    .button-text {
      display: flex;
      flex-direction: column;
    }
    
    .title {
      font-size: 1.2em;
      font-weight: bold;
      margin-bottom: 4px;
    }
    
    .subtitle {
      font-size: 0.9em;
      opacity: 0.9;
    }
    
    .info-box {
      background-color: #f9f9f9;
      border-radius: 8px;
      padding: 15px;
      margin-top: 10px;
      border: 1px solid #ddd;
    }
    
    .info-box h3 {
      color: #4c2c69;
      margin-top: 0;
      margin-bottom: 10px;
      font-size: 1.2em;
    }
    
    .info-box ol {
      margin: 0;
      padding-left: 25px;
      line-height: 1.6;
      color: #444;
    }
    
    .info-box li {
      margin-bottom: 8px;
    }
    
    .info-box li:last-child {
      margin-bottom: 0;
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
      
      .option-button {
        padding: 12px;
      }
      
      .emoji {
        font-size: 1.6em;
        margin-right: 10px;
      }
      
      .title {
        font-size: 1.1em;
      }
      
      .subtitle {
        font-size: 0.8em;
      }
    }
  </style>