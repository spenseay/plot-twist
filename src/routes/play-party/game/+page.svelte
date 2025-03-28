<script>
    import { onMount, onDestroy } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { database } from '$lib/firebase/config.js';
    import { ref, onValue, update, get } from 'firebase/database';
    import { getContrastYIQ } from '$lib/utils/colorUtils.js';
    import { calculateDistance } from '$lib/utils/mathUtils.js';
    
    // Game state
    let roomCode = '';
    let playerName = '';
    let roomData = null;
    let players = [];
    let axes = { x: { start: '', end: '' }, y: { start: '', end: '' } };
    let placementsSubmitted = false;
    let allPlayersSubmitted = false;
    let error = null;
    let unsubscribe = null;
    let pinsToDrag = [];
    let nextZIndex = 100;
    let activeDragPin = null;
    
    // DOM references
    let graphContainer;
    let pinsContainer;
    
    // Color palette for pins (same as original game)
    const playerColors = [
      '#db5461',
      '#3891a6',
      '#fdc30f',
      '#a6d3a0',
      '#4c2c69',
      '#e898a0',
      '#65b1c2',
      '#feec7f',
      '#c0e2bc'
    ];
    
    onMount(() => {
      // Get room from URL parameters
      if ($page.url.searchParams.has('room')) {
        roomCode = $page.url.searchParams.get('room');
        
        // Load player data from localStorage
        try {
          const hostData = localStorage.getItem('ptGameHost');
          const playerData = localStorage.getItem('ptGamePlayer');
          
          if (hostData) {
            const data = JSON.parse(hostData);
            playerName = data.playerName;
          } else if (playerData) {
            const data = JSON.parse(playerData);
            playerName = data.playerName;
          }
        } catch (err) {
          console.error('Error loading player data:', err);
        }
        
        // Subscribe to room updates
        subscribeToRoom();
      } else {
        // No room code, redirect to party mode menu
        goto('/play-party');
      }
    });
    
    onDestroy(() => {
      if (unsubscribe) {
        unsubscribe();
      }
    });
    
    // Subscribe to room data updates
    function subscribeToRoom() {
      const roomRef = ref(database, `rooms/${roomCode}`);
      
      unsubscribe = onValue(roomRef, (snapshot) => {
        if (snapshot.exists()) {
          roomData = snapshot.val();
          
          // Get players
          if (roomData.players) {
            players = Object.entries(roomData.players).map(([name, data]) => ({
              name,
              isHost: data.isHost,
              hasSubmitted: data.hasSubmitted || false,
              joinedAt: data.joinedAt
            })).sort((a, b) => {
              // Host first, then by join time
              if (a.isHost) return -1;
              if (b.isHost) return 1;
              return a.joinedAt - b.joinedAt;
            });
          }
          
          // Get axes
          if (roomData.settings && roomData.settings.axes) {
            axes = roomData.settings.axes;
          }
          
          // Check if current player has submitted
          if (roomData.players && roomData.players[playerName]) {
            placementsSubmitted = roomData.players[playerName].hasSubmitted || false;
          }
          
          // Check if everyone has submitted
          allPlayersSubmitted = players.every(p => p.hasSubmitted);
          
          // If all have submitted, load results
          if (allPlayersSubmitted && roomData.status === 'completed') {
            // Show results
          } else if (!placementsSubmitted) {
            // If we haven't submitted yet, initialize game pins
            setupPins();
          }
        } else {
          error = 'Room no longer exists';
          roomData = null;
        }
      });
    }
    
    // Set up pins for placement
    function setupPins() {
      if (placementsSubmitted || !players || !pinsContainer) return;
      
      // Clear existing pins
      pinsContainer.innerHTML = '';
      
      // Create pins for all players except current player
      pinsToDrag = players
        .filter(p => p.name !== playerName)
        .map((player, index) => {
          return {
            name: player.name,
            placed: false,
            color: playerColors[index % playerColors.length]
          };
        });
      
      // Create pin elements
      pinsToDrag.forEach(pin => {
        createPinElement(pin);
      });
    }
    
    // Create a pin element
    function createPinElement(pin) {
      const pinElement = document.createElement('div');
      pinElement.className = 'pin';
      pinElement.textContent = pin.name;
      pinElement.setAttribute('data-player', pin.name);
      pinElement.setAttribute('data-placed', 'false');
      
      // Styling
      pinElement.style.backgroundColor = pin.color;
      pinElement.style.color = getContrastYIQ(pin.color.replace('#', '')) < 128 ? 'white' : '#4c2c69';
      
      // Event listeners
      pinElement.onmousedown = (e) => dragStart(e, pinElement);
      pinElement.ontouchstart = (e) => touchStart(e, pinElement);
      
      // Add to container
      pinsContainer.appendChild(pinElement);
    }
    
    // Drag functionality
    function dragStart(e, pin) {
      e.preventDefault();
      activeDragPin = pin;
      bringPinToFront(pin);
      
      // If not placed, move to graph container
      if (pin.getAttribute('data-placed') === 'false') {
        const pinStyle = window.getComputedStyle(pin);
        const w = pinStyle.width;
        const h = pinStyle.height;
        
        pin.parentNode.removeChild(pin);
        graphContainer.appendChild(pin);
        
        const rect = graphContainer.getBoundingClientRect();
        const pinX = e.clientX - rect.left;
        const pinY = e.clientY - rect.top;
        
        pin.style.position = 'absolute';
        pin.style.left = pinX + 'px';
        pin.style.top = pinY + 'px';
        pin.style.transform = 'translate(-50%, -50%)';
        pin.style.width = w;
        pin.style.height = h;
        pin.style.margin = '0';
      }
      
      document.addEventListener('mousemove', dragMove);
      document.addEventListener('mouseup', dragEnd);
    }
    
    function dragMove(e) {
      if (!activeDragPin) return;
      
      const rect = graphContainer.getBoundingClientRect();
      let newX = e.clientX - rect.left;
      let newY = e.clientY - rect.top;
      
      if (activeDragPin.getAttribute('data-placed') === 'true') {
        newX = Math.max(0, Math.min(newX, rect.width));
        newY = Math.max(0, Math.min(newY, rect.height));
      } else {
        if (newX >= 0 && newX <= rect.width && newY >= 0 && newY <= rect.height) {
          activeDragPin.setAttribute('data-placed', 'true');
          updatePinStatus();
        }
      }
      
      activeDragPin.style.left = newX + 'px';
      activeDragPin.style.top = newY + 'px';
    }
    
    function dragEnd() {
      if (!activeDragPin) return;
      
      const rect = graphContainer.getBoundingClientRect();
      const pinLeft = parseFloat(activeDragPin.style.left);
      const pinTop = parseFloat(activeDragPin.style.top);
      const outside = (pinLeft < 0 || pinLeft > rect.width || pinTop < 0 || pinTop > rect.height);
      
      if (outside && activeDragPin.getAttribute('data-placed') === 'false') {
        graphContainer.removeChild(activeDragPin);
        activeDragPin.style.position = '';
        activeDragPin.style.left = '';
        activeDragPin.style.top = '';
        activeDragPin.style.transform = '';
        activeDragPin.style.margin = '3px';
        pinsContainer.appendChild(activeDragPin);
      }
      
      activeDragPin = null;
      document.removeEventListener('mousemove', dragMove);
      document.removeEventListener('mouseup', dragEnd);
    }
    
    // Touch events for mobile
    function touchStart(e, pin) {
      if (e.touches.length !== 1) return;
      e.preventDefault();
      
      activeDragPin = pin;
      bringPinToFront(pin);
      
      if (pin.getAttribute('data-placed') === 'false') {
        const pinStyle = window.getComputedStyle(pin);
        const w = pinStyle.width;
        const h = pinStyle.height;
        
        pin.parentNode.removeChild(pin);
        graphContainer.appendChild(pin);
        
        const rect = graphContainer.getBoundingClientRect();
        const pinX = e.touches[0].clientX - rect.left;
        const pinY = e.touches[0].clientY - rect.top;
        
        pin.style.position = 'absolute';
        pin.style.left = pinX + 'px';
        pin.style.top = pinY + 'px';
        pin.style.transform = 'translate(-50%, -50%)';
        pin.style.width = w;
        pin.style.height = h;
        pin.style.margin = '0';
      }
      
      document.addEventListener('touchmove', touchMove, { passive: false });
      document.addEventListener('touchend', touchEnd);
    }
    
    function touchMove(e) {
      e.preventDefault();
      if (!activeDragPin || e.touches.length !== 1) return;
      
      const rect = graphContainer.getBoundingClientRect();
      let newX = e.touches[0].clientX - rect.left;
      let newY = e.touches[0].clientY - rect.top;
      
      if (activeDragPin.getAttribute('data-placed') === 'true') {
        newX = Math.max(0, Math.min(newX, rect.width));
        newY = Math.max(0, Math.min(newY, rect.height));
      } else {
        if (newX >= 0 && newX <= rect.width && newY >= 0 && newY <= rect.height) {
          activeDragPin.setAttribute('data-placed', 'true');
          updatePinStatus();
        }
      }
      
      activeDragPin.style.left = newX + 'px';
      activeDragPin.style.top = newY + 'px';
    }
    
    function touchEnd() {
      if (!activeDragPin) return;
      
      const rect = graphContainer.getBoundingClientRect();
      const pinLeft = parseFloat(activeDragPin.style.left);
      const pinTop = parseFloat(activeDragPin.style.top);
      const outside = (pinLeft < 0 || pinLeft > rect.width || pinTop < 0 || pinTop > rect.height);
      
      if (outside && activeDragPin.getAttribute('data-placed') === 'false') {
        graphContainer.removeChild(activeDragPin);
        activeDragPin.style.position = '';
        activeDragPin.style.left = '';
        activeDragPin.style.top = '';
        activeDragPin.style.transform = '';
        activeDragPin.style.margin = '3px';
        pinsContainer.appendChild(activeDragPin);
      }
      
      activeDragPin = null;
      document.removeEventListener('touchmove', touchMove);
      document.removeEventListener('touchend', touchEnd);
    }
    
    // Bring a pin to the front
    function bringPinToFront(pin) {
      nextZIndex++;
      pin.style.zIndex = nextZIndex;
    }
    
    // Update pin status (all placed check)
    function updatePinStatus() {
      if (placementsSubmitted) return;
      
      const pins = document.querySelectorAll('.pin');
      let allPlaced = true;
      let placedCount = 0;
      
      pins.forEach(pin => {
        if (pin.getAttribute('data-placed') === 'false') {
          allPlaced = false;
        } else {
          placedCount++;
        }
      });
      
      // Update UI based on pin status
      const confirmButton = document.getElementById('confirm-placement');
      if (confirmButton) {
        confirmButton.disabled = !allPlaced;
      }
      
      const pinsStatus = document.getElementById('pins-status');
      if (pinsStatus) {
        if (allPlaced) {
          pinsStatus.textContent = 'All pins placed! You can now confirm.';
          pinsStatus.className = 'pins-status all-placed';
        } else {
          pinsStatus.textContent = `Placed ${placedCount} of ${pins.length} pins. Please place all pins on the chart.`;
          pinsStatus.className = 'pins-status';
        }
      }
    }
    
    // Submit placements
    async function submitPlacements() {
      if (placementsSubmitted) return;
      
      // Extract pin placements
      const placements = {};
      const rect = graphContainer.getBoundingClientRect();
      
      document.querySelectorAll('.pin').forEach(pin => {
        const playerName = pin.getAttribute('data-player');
        const x = parseFloat(pin.style.left) / rect.width;
        const y = parseFloat(pin.style.top) / rect.height;
        placements[playerName] = { x, y };
      });
      
      // Add current player
      placements[playerName] = {
        x: 0.5, // Self placement at center for now
        y: 0.5  // Could be customized later
      };
      
      try {
        // Update placements in Firebase
        const playerRef = ref(database, `rooms/${roomCode}/players/${playerName}`);
        const placementsRef = ref(database, `rooms/${roomCode}/placements/${playerName}`);
        
        await update(playerRef, { hasSubmitted: true });
        await update(placementsRef, placements);
        
        // Check if all players have submitted
        const roomRef = ref(database, `rooms/${roomCode}`);
        const snapshot = await get(roomRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          const allSubmitted = Object.values(data.players).every(p => p.hasSubmitted);
          
          if (allSubmitted) {
            // Mark room as completed
            await update(roomRef, { status: 'completed' });
          }
        }
        
        // Locally mark as submitted
        placementsSubmitted = true;
      } catch (err) {
        console.error('Error submitting placements:', err);
        error = err.message || 'Failed to submit placements';
      }
    }
    
    // Return to menu
    function leaveGame() {
      if (unsubscribe) {
        unsubscribe();
      }
      
      goto('/play-party');
    }
  </script>
  
  <div class="container">
    <div class="header">
      <button class="back-button" on:click={leaveGame}>← Menu</button>
      <h1>Plot Twist! Party Mode</h1>
      <div class="spacer"></div>
    </div>
    
    <div class="content">
      {#if error}
        <div class="error-message">
          <p>{error}</p>
          <button class="try-again" on:click={leaveGame}>
            Back to Menu
          </button>
        </div>
      {:else if roomData && allPlayersSubmitted}
        <!-- Results View -->
        {:else if roomData && allPlayersSubmitted}
  <!-- Results View -->
  <div class="results-section">
    <h2>All Players Have Submitted!</h2>
    
    <!-- Import the Results component -->
    <script>
      import Results from '$lib/components/party/Results.svelte';
      import { getContrastYIQ } from '$lib/utils/colorUtils.js';
      
      // Function to get results
      async function getResults() {
        // Placeholder logic - we'll get real results from Firebase
        const placementsData = roomData.placements || {};
        
        // Calculate scores
        const scores = {};
        players.forEach(p => scores[p.name] = 0);
        
        players.forEach(person => {
          const personData = placementsData[person.name];
          if (!personData || !personData[person.name]) return;
          
          const selfPlacement = personData[person.name];
          
          players.forEach(player => {
            if (player.name === person.name) return;
            
            const playerData = placementsData[player.name];
            if (!playerData || !playerData[person.name]) return;
            
            const placement = playerData[person.name];
            
            // Calculate distance and score
            const dx = selfPlacement.x - placement.x;
            const dy = selfPlacement.y - placement.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const maxDist = Math.sqrt(2);
            const sc = Math.max(0, Math.round(100 - (dist/maxDist)*100));
            
            // Add to player's score
            scores[player.name] += sc;
          });
        });
        
        return { scores, placements: placementsData };
      }
    </script>
    
    {#await getResults()}
      <p class="results-message">Loading results...</p>
    {:then results}
      <Results 
        scores={results.scores} 
        placements={results.placements}
        players={players}
        axes={axes}
        on:backToMenu={leaveGame}
      />
    {:catch error}
      <p class="error-message">Error loading results: {error.message}</p>
      <button class="menu-button" on:click={leaveGame}>Return to Menu</button>
    {/await}
  </div>
      {:else if roomData && placementsSubmitted}
        <!-- Waiting for others -->
        <div class="waiting-section">
          <h2>Waiting for Others</h2>
          <p class="waiting-text">You've submitted your placements! Waiting for other players to finish...</p>
          
          <div class="players-status">
            <h3>Player Status</h3>
            <div class="players-list">
              {#each players as player}
                <div class="player-item" class:submitted={player.hasSubmitted}>
                  <span class="player-name">{player.name}</span>
                  <span class="status-badge">{player.hasSubmitted ? 'Submitted' : 'Placing...'}</span>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {:else if roomData}
        <!-- Placement View -->
        <div class="game-section">
          <div class="turn-indicator">
            <h2>Your Turn</h2>
            <p>Place each player on the graph where you think they belong</p>
          </div>
          
          <div id="pins-container" class="pins-container" bind:this={pinsContainer}>
            <!-- Pins will be added here dynamically -->
          </div>
          
          <div id="pins-status" class="pins-status">
            Waiting for all pins to be placed on the chart...
          </div>
          
          <div class="graph-container" bind:this={graphContainer}>
            <!-- X-axis labels -->
            <div class="axis-label x-axis-start">{axes.x.start}</div>
            <div class="axis-label x-axis-end">{axes.x.end}</div>
            
            <!-- Y-axis labels -->
            <div class="axis-label y-axis-start">{axes.y.start}</div>
            <div class="axis-label y-axis-end">{axes.y.end}</div>
            
            <!-- Y-axis arrow -->
            <div class="axis-arrow y-axis-arrow">
              <div class="arrow-head arrow-top"></div>
              <div class="arrow-head arrow-bottom"></div>
            </div>
            
            <!-- X-axis arrow -->
            <div class="axis-arrow x-axis-arrow" style="
              position: absolute; top: 50%; left: 50px; right: 50px;
              height: 2px; transform: translateY(-50%);
              background-color: #4c2c69; pointer-events: none;">
              <div class="arrow-head arrow-left"></div>
              <div class="arrow-head arrow-right"></div>
            </div>
          </div>
          
          <div class="button-group">
            <button id="confirm-placement" on:click={submitPlacements} disabled={true}>
              Confirm Placement
            </button>
          </div>
        </div>
      {:else}
        <div class="loading">
          <p>Loading game data...</p>
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
      font-size: 1.5em;
      color: #4c2c69;
      margin: 0;
    }
    
    h2 {
      font-size: 1.3em;
      color: #4c2c69;
      margin-bottom: 10px;
    }
    
    h3 {
      font-size: 1.1em;
      color: #4c2c69;
      margin-bottom: 8px;
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
    
    /* Game section styles */
    .game-section {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    
    .turn-indicator {
      text-align: center;
      margin-bottom: 10px;
    }
    
    .pins-container {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: flex-start;
      gap: 8px;
      margin: 15px 0;
      padding: 8px;
      height: auto;
      min-height: 50px;
      background-color: #f0f0f0;
      border-radius: 8px;
    }
    
    .pins-status {
      margin: 8px 0;
      padding: 8px;
      background-color: #f2f2f2;
      border-radius: 4px;
      text-align: center;
      transition: all 0.3s ease;
      font-size: 13px;
    }
    
    .pins-status.all-placed {
      background-color: #a6d3a0;
      color: #2a6b34;
    }
    
    .graph-container {
      position: relative;
      width: 100%;
      max-width: 350px;
      aspect-ratio: 1 / 1;
      margin: 0 auto;
      border: 2px solid #4c2c69;
      border-radius: 4px;
      background-color: white;
    }
    
    /* Axis labels */
    .axis-label {
      position: absolute;
      font-weight: bold;
      color: #4c2c69;
      z-index: 5;
      font-size: 12px;
      padding: 3px;
      background-color: rgba(255,255,255,0.7);
      border-radius: 3px;
      text-align: center;
      max-width: 100px;
    }
    
    .x-axis-start {
      left: 10px;
      bottom: calc(50% + 15px);
    }
    
    .x-axis-end {
      right: 10px;
      bottom: calc(50% + 15px);
    }
    
    .y-axis-start {
      left: 50%;
      bottom: 10px;
      transform: translateX(-50%);
    }
    
    .y-axis-end {
      left: 50%;
      top: 10px;
      transform: translateX(-50%);
    }
    
    /* Axis arrow */
    .axis-arrow {
      position: absolute;
      pointer-events: none;
      background-color: #4c2c69;
    }
    
    .y-axis-arrow {
      left: 50%;
      width: 2px;
      transform: translateX(-50%);
      top: 30px;
      bottom: 30px;
    }
    
    /* Arrow heads */
    .arrow-head {
      position: absolute;
      width: 0;
      height: 0;
      border-style: solid;
    }
    
    .arrow-top {
      top: -6px;
      left: -4px;
      border-width: 0 5px 8px 5px;
      border-color: transparent transparent #4c2c69 transparent;
    }
    
    .arrow-bottom {
      bottom: -6px;
      left: -4px;
      border-width: 8px 5px 0 5px;
      border-color: #4c2c69 transparent transparent transparent;
    }
    
    .arrow-left {
      left: -6px;
      top: -4px;
      border-width: 5px 8px 5px 0;
      border-color: transparent #4c2c69 transparent transparent;
    }
    
    .arrow-right {
      right: -6px;
      top: -4px;
      border-width: 5px 0 5px 8px;
      border-color: transparent transparent transparent #4c2c69;
    }
    
    /* Pin styles */
    :global(.pin) {
      box-sizing: border-box;
      position: relative;
      min-width: 70px;
      padding: 6px 8px;
      background-color: #fdc30f;
      color: #4c2c69;
      display: flex;
      justify-content: center;
      align-items: center;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 2px 2px 5px rgba(0,0,0,0.2);
      user-select: none;
      transition: opacity 0.3s, box-shadow 0.2s, transform 0.2s;
      overflow: hidden;
      white-space: nowrap;
      text-align: center;
      font-size: 12px;
      border-radius: 2px;
    }
    
    :global(.pins-container .pin) {
      position: relative;
      transform: none;
      margin: 3px;
      display: inline-block;
      height: 34px;
      flex-grow: 0;
    }
    
    :global(.pin[data-placed="false"]) {
      box-shadow: 0 0 0 2px #db5461, 2px 2px 5px rgba(0,0,0,0.3);
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% { box-shadow: 0 0 0 2px #db5461; }
      50% { box-shadow: 0 0 0 4px #db5461; }
      100% { box-shadow: 0 0 0 2px #db5461; }
    }
    
    :global(.pin:active), :global(.pin.dragging) {
      cursor: grabbing;
      box-shadow: 3px 3px 8px rgba(0,0,0,0.3);
      z-index: 1000;
    }
    
    /* Button styles */
    .button-group {
      display: flex;
      justify-content: center;
      margin-top: 15px;
    }
    
    button {
      background-color: #3891a6;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      transition: background-color 0.3s;
    }
    
    button:hover:not(:disabled) {
      background-color: #2f758a;
    }
    
    button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
      opacity: 0.7;
    }
    
    /* Waiting section styles */
    .waiting-section {
      text-align: center;
    }
    
    .waiting-text {
      background-color: #fdc30f;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-weight: bold;
      color: #4c2c69;
    }
    
    .players-status {
      margin-top: 20px;
    }
    
    .players-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .player-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 15px;
      background-color: #f0f0f0;
      border-radius: 6px;
    }
    
    .player-item.submitted {
      background-color: #a6d3a0;
    }
    
    .status-badge {
      padding: 3px 8px;
      border-radius: 10px;
      font-size: 0.85em;
      background-color: #f2f2f2;
    }
    
    .player-item.submitted .status-badge {
      background-color: #2a6b34;
      color: white;
    }
    
    /* Results section styles */
    .results-section {
      text-align: center;
    }
    
    .results-message {
      background-color: #fdc30f;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    
    .menu-button {
      margin-top: 20px;
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
      
      h1 {
        font-size: 1.8em;
      }
    }
    
    @media (max-width: 480px) {
      .container {
        padding: 12px;
      }
      
      h1 {
        font-size: 1.3em;
      }
      
      button {
        padding: 8px 16px;
        font-size: 14px;
      }
    }
  </style>