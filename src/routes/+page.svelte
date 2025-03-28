<script>
  import { goto } from '$app/navigation';
  
  function navigateTo(route) {
    goto(route);
  }
</script>

<div class="container">
  <div class="header">
    <h1>Plot Twist!</h1>
    <div class="subtitle">Where do your friends really stand?</div>
  </div>
  
  <div class="menu-options">
    <button class="menu-button play-local" on:click={() => navigateTo('/play-local')}>
      <div class="button-content">
        <div class="emoji">🎮</div>
        <div class="text-content">
          <span class="button-text">Pass &amp; Play</span>
          <span class="button-description">Play together on one device</span>
        </div>
      </div>
    </button>
    
    <button class="menu-button party-mode disabled">
      <div class="button-content">
        <div class="emoji">🎉</div>
        <div class="text-content">
          <span class="button-text">Party Mode</span>
          <span class="button-description">Coming soon - Play on separate devices</span>
        </div>
      </div>
    </button>
    
    <button class="menu-button daily-mode disabled">
      <div class="button-content">
        <div class="emoji">📅</div>
        <div class="text-content">
          <span class="button-text">Daily Challenge</span>
          <span class="button-description">Coming soon!</span>
        </div>
      </div>
    </button>
  </div>
  
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
    position: relative;
    z-index: 2;
    margin-bottom: 30px;
  }
  
  h1 {
    font-size: 3em;
    color: #4c2c69;
    margin-bottom: 5px;
  }
  
  .subtitle {
    color: #3891a6;
    font-size: 1.2em;
    font-style: normal;
  }
  
  /* Menu options */
  .menu-options {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin: 30px 0 15px 0;
  }
  
  .menu-button {
    position: relative;
    border: none;
    border-radius: 12px;
    padding: 0;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: left;
    overflow: hidden;
  }
  
  .menu-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 100%);
    pointer-events: none;
  }
  
  .button-content {
    display: flex;
    align-items: center;
    padding: 16px 20px;
  }
  
  .emoji {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.2em;
    margin-right: 15px;
    width: 50px;
    height: 50px;
  }
  
  .text-content {
    display: flex;
    flex-direction: column;
  }
  
  .button-text {
    font-size: 1.3em;
    font-weight: bold;
    margin-bottom: 3px;
  }
  
  .button-description {
    font-size: 0.9em;
    opacity: 0.9;
  }
  
  /* Button styles for each mode */
  .play-local {
    background-color: #3891a6;
    box-shadow: 0 4px 0 #2a6b7d, 0 5px 10px rgba(56, 145, 166, 0.3);
  }
  
  .play-local .button-text, 
  .play-local .button-description {
    color: white;
  }
  
  .play-local:hover {
    transform: translateY(-3px);
    box-shadow: 0 7px 0 #2a6b7d, 0 8px 15px rgba(56, 145, 166, 0.4);
  }
  
  .play-local:active {
    transform: translateY(2px);
    box-shadow: 0 2px 0 #2a6b7d, 0 3px 5px rgba(56, 145, 166, 0.3);
  }
  
  .party-mode {
    background-color: #fdc30f;
    box-shadow: 0 4px 0 #d9a40b, 0 5px 10px rgba(253, 195, 15, 0.3);
  }
  
  .party-mode .button-text, 
  .party-mode .button-description {
    color: #4c2c69;
  }
  
  .daily-mode {
    background-color: #a6d3a0;
    box-shadow: 0 4px 0 #85b57e, 0 5px 10px rgba(166, 211, 160, 0.3);
  }
  
  .daily-mode .button-text, 
  .daily-mode .button-description {
    color: #4c2c69;
  }
  
  /* Disabled button state */
  .disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
  
  .disabled::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: repeating-linear-gradient(
      45deg,
      rgba(0, 0, 0, 0.1),
      rgba(0, 0, 0, 0.1) 10px,
      rgba(0, 0, 0, 0.05) 10px,
      rgba(0, 0, 0, 0.05) 20px
    );
    pointer-events: none;
  }
  
  /* Responsive styles */
  @media (min-width: 768px) {
    .container {
      max-width: 700px;
      padding: 30px;
    }
  }
  
  @media (max-width: 480px) {
    .container {
      margin: 15px auto;
      padding: 20px 15px;
    }
    
    h1 {
      font-size: 2.2em;
    }
    
    .subtitle {
      font-size: 1em;
    }
    
    .button-content {
      padding: 12px 15px;
    }
    
    .emoji {
      font-size: 1.8em;
      margin-right: 10px;
      width: 40px;
      height: 40px;
    }
    
    .button-text {
      font-size: 1.1em;
    }
    
    .button-description {
      font-size: 0.8em;
    }
    
    .decoration {
      width: 70px;
      height: 70px;
    }
  }
</style>