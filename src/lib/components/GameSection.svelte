<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import { getContrastYIQ } from '$lib/utils/colorUtils.js';
    import { adjustYAxisArrow } from '$lib/utils/axisUtils.js';
    import gameStore from '$lib/stores/gameStore.js';
  
    // Set up event dispatcher to communicate with parent
    const dispatch = createEventDispatcher();
    
    // Subscribe to the game store
    $: gameState = $gameStore;
    $: players = gameState?.players || [];
    $: currentTurn = gameState?.currentTurn || 0;
    $: allPinsPlaced = gameState?.allPinsPlaced || false;
    $: currentPlayer = players[currentTurn] || '';
    $: axes = gameState?.axes || { x: { start: "", end: "" }, y: { start: "", end: "" } };
    $: nextZIndex = gameState?.nextZIndex || 100;
    
    // Reactive status text
    $: pinsStatusText = allPinsPlaced 
      ? 'All pins placed! You can now confirm.' 
      : 'Waiting for all pins to be placed on the chart...';
    $: pinsStatusClass = allPinsPlaced ? 'pins-status all-placed' : 'pins-status';
    
    // DOM references
    let graphContainer;
    let pinsContainer;
    let turnIndicatorElement;
    let pinsStatusElement;
    
    // Active drag pin is managed locally
    let activeDragPin = null;
    
    // Color palette for pins
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
    
    // Initialize component when mounted and whenever the current turn changes
    $: if (currentTurn !== undefined) {
      startPlayerTurn();
    }
    
    onMount(() => {
      // Adjust axis arrows on mount
      setTimeout(() => {
        adjustYAxisArrow(graphContainer);
      }, 0);
    });
  
    function startPlayerTurn() {
      // Wait until DOM elements are available
      if (!pinsContainer || !graphContainer || !turnIndicatorElement) return;
      
      // Update store state
      gameStore.update(state => ({
        ...state,
        allPinsPlaced: false,
        nextZIndex: 100
      }));
      
      // Update turn indicator
      if (turnIndicatorElement) {
        turnIndicatorElement.textContent = `${currentPlayer}'s Turn`;
      }
      
      // Clear any existing pins from the graph container
      const existingPins = graphContainer.querySelectorAll('.pin');
      existingPins.forEach(pin => pin.remove());
      
      // Clear and recreate pins container contents
      pinsContainer.innerHTML = '';
      
      // Create a fresh pin for each player
      players.forEach((player, index) => {
        // Create base element
        const pin = document.createElement('div');
        pin.className = 'pin';
        pin.textContent = player;
        pin.setAttribute('data-player', player);
        pin.setAttribute('data-placed', 'false');
        
        // Apply base styles that are common to all pins
        const color = playerColors[index % playerColors.length];
        pin.style.backgroundColor = color;
        pin.style.color = getContrastYIQ(color) < 128 ? 'white' : '#4c2c69';
        
        // Explicitly set important dimensions to ensure consistency
        pin.style.height = '34px';
        pin.style.minWidth = '70px';
        pin.style.width = 'auto';
        pin.style.maxWidth = '120px';
        pin.style.display = 'flex';
        pin.style.justifyContent = 'center';
        pin.style.alignItems = 'center';
        
        // Setup drag events - using direct property assignment
        pin.onmousedown = (e) => dragStart(e, pin);
        pin.ontouchstart = (e) => touchStart(e, pin);
        pin.onclick = () => bringPinToFront(pin);
        
        // Add to container
        pinsContainer.appendChild(pin);
      });
      
      // Ensure styles are applied and layout is calculated
      setTimeout(() => {
        updatePinStatus();
        adjustYAxisArrow(graphContainer);
      }, 50);
    }
  
    function updatePinStatus() {
      const pinElements = document.querySelectorAll('.pin');
      let placedCount = 0;
      
      pinElements.forEach(pin => {
        if (pin.getAttribute('data-placed') === 'true') {
          placedCount++;
        }
      });
      
      // Update the store
      gameStore.update(state => ({
        ...state,
        allPinsPlaced: placedCount === players.length
      }));
    }
  
    function confirmPlacement() {
      const placement = {};
      const rect = graphContainer.getBoundingClientRect();
      
      document.querySelectorAll('.pin').forEach(pin => {
        const player = pin.getAttribute('data-player');
        if (!player) return;
        
        const leftStyle = pin.style.left;
        const topStyle = pin.style.top;
        
        // Convert percentage to decimal if needed
        const leftVal = leftStyle.endsWith('%') 
          ? parseFloat(leftStyle) / 100 
          : parseFloat(leftStyle) / rect.width;
          
        const topVal = topStyle.endsWith('%') 
          ? parseFloat(topStyle) / 100 
          : parseFloat(topStyle) / rect.height;
          
        placement[player] = { x: leftVal, y: topVal };
      });
      
      // Let the parent component know the placement is confirmed
      dispatch('confirmPlacement', { 
        placement,
        player: currentPlayer
      });
    }
  
    // -- Drag Functionality --
    function dragStart(e, pin) {
      e.preventDefault();
      activeDragPin = pin;
      bringPinToFront(pin);
      
      // If not placed, move from pins container -> graph container
      if (pin.getAttribute('data-placed') === 'false') {
        const pinStyle = window.getComputedStyle(pin);
        const w = pinStyle.width;
        const h = pinStyle.height;
        
        pin.parentNode?.removeChild(pin);
        graphContainer.appendChild(pin);
        
        const rect = graphContainer.getBoundingClientRect();
        const pinX = e.clientX - rect.left;
        const pinY = e.clientY - rect.top;
        
        pin.style.position = 'absolute';
        pin.style.left = pinX + 'px';
        pin.style.top = pinY + 'px';
        pin.style.transform = 'translate(-50%,-50%)';
        pin.style.width = w;
        pin.style.height = h;
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
        pinsContainer.appendChild(activeDragPin);
      }
      
      activeDragPin = null;
      document.removeEventListener('mousemove', dragMove);
      document.removeEventListener('mouseup', dragEnd);
    }
  
    // Touch handlers
    function touchStart(e, pin) {
      if (e.touches.length !== 1) return;
      e.preventDefault();
      activeDragPin = pin;
      bringPinToFront(pin);
      
      if (pin.getAttribute('data-placed') === 'false') {
        const pinStyle = window.getComputedStyle(pin);
        const w = pinStyle.width;
        const h = pinStyle.height;
        
        pin.parentNode?.removeChild(pin);
        graphContainer.appendChild(pin);
        
        const rect = graphContainer.getBoundingClientRect();
        const pinX = e.touches[0].clientX - rect.left;
        const pinY = e.touches[0].clientY - rect.top;
        
        pin.style.position = 'absolute';
        pin.style.left = pinX + 'px';
        pin.style.top = pinY + 'px';
        pin.style.transform = 'translate(-50%,-50%)';
        pin.style.width = w;
        pin.style.height = h;
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
        pinsContainer.appendChild(activeDragPin);
      }
      
      activeDragPin = null;
      document.removeEventListener('touchmove', touchMove);
      document.removeEventListener('touchend', touchEnd);
    }
  
    function bringPinToFront(pin) {
      // Update the nextZIndex in the store
      gameStore.update(state => ({
        ...state,
        nextZIndex: state.nextZIndex + 1
      }));
      
      // Use the updated value to set the pin's z-index
      pin.style.zIndex = (nextZIndex + 1).toString();
    }
  </script>
  
  <div class="section game-section">
    <div class="turn-indicator" bind:this={turnIndicatorElement}>{currentPlayer}'s Turn</div>
    <div class="instructions">
      <p>Drag each sticky note from below and place it where you think that person belongs on the graph.</p>
    </div>
    <div id="pins-container" class="pins-container" bind:this={pinsContainer}>
      {#each players as player, i}
        <button class="pin" 
             type="button"
             aria-label={`Pin for ${player}`}
             data-player={player}
             data-placed="false"
             style="background-color: {playerColors[i % playerColors.length]}; 
                    color: {getContrastYIQ(playerColors[i % playerColors.length]) < 128 ? 'white' : '#4c2c69'};"
             on:mousedown={(e) => dragStart(e, e.currentTarget)}
             on:touchstart={(e) => touchStart(e, e.currentTarget)}
             on:click={(e) => bringPinToFront(e.currentTarget)}
             on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') bringPinToFront(e.currentTarget); }}>
          {player}
        </button>
      {/each}
    </div>
    <div class="pins-status {pinsStatusClass}" bind:this={pinsStatusElement}>
      {pinsStatusText}
    </div>
    <div class="graph-container" bind:this={graphContainer}>
      <!-- Axis labels -->
      <div class="axis-label x-axis-start">{axes.x.start}</div>
      <div class="axis-label x-axis-end">{axes.x.end}</div>
      <div class="axis-label y-axis-start">{axes.y.start}</div>
      <div class="axis-label y-axis-end">{axes.y.end}</div>
  
      <!-- The Y axis arrow -->
      <div class="axis-arrow y-axis-arrow">
        <div class="arrow-head arrow-top"></div>
        <div class="arrow-head arrow-bottom"></div>
      </div>
      
      <!-- X axis arrow -->
      <div class="axis-arrow x-axis-arrow" style="
        position:absolute; top:50%; left:50px; right:50px;
        height:2px; transform:translateY(-50%);
        background-color:#4c2c69; pointer-events:none;">
        <div class="arrow-head arrow-left"></div>
        <div class="arrow-head arrow-right"></div>
      </div>
    </div>
    <div class="button-group" style="justify-content:center;">
      <button on:click={confirmPlacement} disabled={!allPinsPlaced}>Confirm Placement</button>
    </div>
  </div>
  
  <style>
    /* Section styles */
    .section {
      margin-bottom: 15px;
      padding: 12px;
      border-radius: 8px;
    }
  
    /* Game play section */
    .game-section {
      background-color: white;
    }
  
    /* Graph container */
    .graph-container {
      position: relative;
      width: 100%;
      max-width: 350px;
      aspect-ratio: 1 / 1;
      margin: 0 auto;
      border: 2px solid #4c2c69;
      border-radius: 4px;
    }
  
    /* Pins container */
    .pins-container {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: flex-start;
      gap: 8px;
      margin: 15px 0;
      padding: 8px;
      height: auto;
    }
    
    /* Basic pin styling - applies to all pins */
    .pin {
      box-sizing: border-box;
      min-width: 70px;
      width: auto;
      max-width: 120px;
      height: 34px;
      padding: 6px 8px;
      background-color: #fdc30f;
      color: #4c2c69;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 2px 2px 5px rgba(0,0,0,0.2);
      user-select: none;
      overflow: hidden;
      white-space: nowrap;
      text-align: center;
      font-size: 12px;
      border-radius: 2px;
      line-height: 1.2;
      border: none;
      flex-shrink: 0;
      flex-grow: 0;
    }
  
    /* Turn indicator */
    .turn-indicator {
      text-align: center;
      margin-bottom: 10px;
      font-size: 18px;
      font-weight: bold;
      color: #4c2c69;
    }
  
    /* Instructions */
    .instructions {
      margin-bottom: 10px;
      padding: 10px;
      background-color: #fdc30f;
      border-radius: 4px;
      font-size: 13px;
    }
  
    /* Pins status indicator */
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
  
    /* Button styles */
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
    button:hover {
      background-color: #2f758a;
    }
    
    button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
      opacity: 0.7;
    }
    .button-group {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }
    
    /* Responsive styles */
    @media (min-width: 768px) {
      .section {
        padding: 15px;
        margin-bottom: 20px;
      }
      .pin {
        font-size: 13px;
        min-width: 75px;
        padding: 7px 10px;
        height: 36px;
        margin: 4px;
      }
      .turn-indicator {
        font-size: 20px;
      }
      .instructions {
        font-size: 14px;
      }
    }
    @media (max-width: 480px) {
      .section {
        padding: 10px;
        margin-bottom: 15px;
      }
      button {
        padding: 8px 16px;
        font-size: 14px;
      }
    }
  </style>