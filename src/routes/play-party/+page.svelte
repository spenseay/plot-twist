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

<div class="options">
  <button class="option-button host" on:click={hostGame}>
    <div class="button-content">
      <div class="emoji">🎯</div>
      <div class="text-content">
        <span class="button-text">Host a Game</span>
        <span class="button-description">Create a new room for friends to join</span>
      </div>
    </div>
  </button>
  
  <button class="option-button join" on:click={joinGame}>
    <div class="button-content">
      <div class="emoji">🔗</div>
      <div class="text-content">
        <span class="button-text">Join a Game</span>
        <span class="button-description">Enter a room code to join friends</span>
      </div>
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

/* Options section */
.options {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 25px 0;
}

.option-button {
  position: relative;
  border: none;
  border-radius: 12px;
  padding: 0;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  overflow: hidden;
}

.button-content {
  display: flex;
  align-items: center;
  padding: 20px;
}

.emoji {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.6em;
  margin-right: 18px;
  width: 60px;
  height: 60px;
  flex-shrink: 0;
}

.text-content {
  display: flex;
  flex-direction: column;
}

.button-text {
  font-size: 1.5em;
  font-weight: bold;
  margin-bottom: 5px;
}

.button-description {
  font-size: 1em;
  opacity: 0.9;
}

/* Host button */
.host {
  background-color: #3891a6;
  box-shadow: 0 4px 0 #2a6b7d, 0 5px 10px rgba(56, 145, 166, 0.3);
}

.host .button-text, 
.host .button-description {
  color: white;
}

.host:hover {
  transform: translateY(-3px);
  box-shadow: 0 7px 0 #2a6b7d, 0 8px 15px rgba(56, 145, 166, 0.4);
}

.host:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #2a6b7d, 0 3px 5px rgba(56, 145, 166, 0.3);
}

/* Join button */
.join {
  background-color: #fdc30f;
  box-shadow: 0 4px 0 #d9a40b, 0 5px 10px rgba(253, 195, 15, 0.3);
}

.join .button-text, 
.join .button-description {
  color: #4c2c69;
}

.join:hover {
  transform: translateY(-3px);
  box-shadow: 0 7px 0 #d9a40b, 0 8px 15px rgba(253, 195, 15, 0.4);
}

.join:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #d9a40b, 0 3px 5px rgba(253, 195, 15, 0.3);
}

/* Info box styling */
.info-box {
  background-color: rgba(76, 44, 105, 0.05);
  border-radius: 10px;
  padding: 18px;
  margin-top: 15px;
  position: relative;
  z-index: 2;
  border: 1px solid rgba(76, 44, 105, 0.2);
}

.info-box h3 {
  color: #4c2c69;
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 1.3em;
}

.info-box ol {
  margin: 0;
  padding-left: 25px;
  text-align: left;
  line-height: 1.5;
  color: #4c2c69;
}

.info-box li {
  margin-bottom: 8px;
  padding-left: 5px;
}

.info-box li:last-child {
  margin-bottom: 0;
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
  
  .button-text {
    font-size: 1.7em;
  }
  
  .button-description {
    font-size: 1.1em;
  }
  
  .info-box h3 {
    font-size: 1.5em;
  }
  
  .info-box ol {
    font-size: 1.1em;
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
  
  .back-button {
    font-size: 1rem;
  }
  
  .options {
    gap: 15px;
  }
  
  /* Larger text for mobile */
  .button-text {
    font-size: 2.2em;
    line-height: 1.1;
  }
  
  .button-description {
    font-size: 1.5em;
    line-height: 1.2;
  }
  
  .emoji {
    font-size: 3.2em;
    width: 65px;
    height: 65px;
  }
  
  .option-button {
    min-height: 110px;
  }
  
  .button-content {
    padding: 15px;
  }
  
  .info-box {
    margin-top: 20px;
    padding: 15px;
  }
  
  .info-box h3 {
    font-size: 1.7em;
    margin-bottom: 10px;
  }
  
  .info-box ol {
    padding-left: 20px;
    font-size: 1.3em;
  }
  
  .info-box li {
    margin-bottom: 10px;
  }
  
  /* Make decorations less prominent on mobile */
  .decoration {
    opacity: 0.15;
  }
}
</style>