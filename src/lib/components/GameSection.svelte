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
    
    // FIX: Add reactive statement for when currentTurn changes
    $: if (currentTurn !== undefined && graphContainer && pinsContainer) {
      startPlayerTurn();
    }
    
    onMount(() => {
      // Adjust the axes arrows on mount
      setTimeout(() => {
        adjustYAxisArrow(graphContainer);
      }, 50);
    });
  
    function startPlayerTurn() {
      if (!pinsContainer || !graphContainer) return;
      
      // Update store state
      gameStore.update(state => ({
        ...state,
        allPinsPlaced: false,
        nextZIndex: 100
      }));
      
      // Update turn indicator with current player's name
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
        pin.style.position = 'relative';
        pin.style.height = '34px';
        pin.style.minWidth = '70px';
        pin.style.width = 'auto';
        pin.style.maxWidth = '120px';
        pin.style.display = 'flex';
        pin.style.justifyContent = 'center';
        pin.style.alignItems = 'center';
        pin.style.fontFamily = 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
        pin.style.fontSize = '12px';
        pin.style.fontWeight = 'bold';
        pin.style.borderRadius = '4px';
        pin.style.margin = '3px';
        pin.style.padding = '6px 8px';
        pin.style.cursor = 'pointer';
        pin.style.userSelect = 'none';
        pin.style.boxShadow = '0 0 0 2px #db5461, 2px 2px 5px rgba(0,0,0,0.3)';
        pin.style.transform = 'none';
        pin.style.lineHeight = '1.2';
        pin.style.border = 'none';
        pin.style.textAlign = 'center';
        pin.style.whiteSpace = 'nowrap';
        pin.style.overflow = 'hidden';
        
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
        pin.style.margin = '0';
        pin.style.zIndex = '10';
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
        activeDragPin.style.boxShadow = '0 0 0 2px #db5461, 2px 2px 5px rgba(0,0,0,0.3)';
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
      <!-- Pins will be created dynamically in JavaScript -->
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
      <div class="axis-arrow x-axis-arrow">
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
    :global(.pin) {
      box-sizing: border-box;
      position: relative;
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
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    /* Pins in the container */
    :global(.pins-container .pin) {
      position: relative;
      margin: 3px;
      display: flex;
      justify-content: center;
      align-items: center;
      transform: none;
      border-radius: 4px;
    }
    
    /* Pins on the graph */
    :global(.graph-container .pin) {
      position: absolute;
      transform: translate(-50%, -50%);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10;
      margin: 0;
    }
    
    /* Pins that haven't been placed yet */
    :global(.pin[data-placed="false"]) {
      box-shadow: 0 0 0 2px #db5461, 2px 2px 5px rgba(0,0,0,0.3);
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% { box-shadow: 0 0 0 2px #db5461; }
      50% { box-shadow: 0 0 0 4px #db5461; }
      100% { box-shadow: 0 0 0 2px #db5461; }
    }
    
    /* Active pins during dragging */
    :global(.pin.dragging) {
      cursor: grabbing;
      box-shadow: 3px 3px 8px rgba(0,0,0,0.3);
      z-index: 1000;
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
  
    /* Axis labels */
    :global(.axis-label) {
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
    
    /* X axis labels */
    :global(.x-axis-start) {
      left: 10px;
      bottom: calc(50% + 15px);
    }
    
    :global(.x-axis-end) {
      right: 10px;
      bottom: calc(50% + 15px);
    }
  
    /* Y axis labels */
    :global(.y-axis-start) {
      left: 50%;
      bottom: 10px;
      transform: translateX(-50%);
    }
    
    :global(.y-axis-end) {
      left: 50%;
      top: 10px;
      transform: translateX(-50%);
    }
  
    /* The arrow line itself */
    :global(.y-axis-arrow) {
      position: absolute;
      pointer-events: none;
      left: 50%;
      width: 2px;
      transform: translateX(-50%);
      background-color: #4c2c69;
      top: 30px;
      bottom: 30px;
    }
  
    /* X axis arrow */
    :global(.x-axis-arrow) {
      position: absolute;
      pointer-events: none;
      top: 50%;
      left: 50px;
      right: 50px;
      height: 2px;
      transform: translateY(-50%);
      background-color: #4c2c69;
    }
  
    /* Arrow heads */
    :global(.arrow-head) {
      position: absolute;
      width: 0;
      height: 0;
      border-style: solid;
    }
    
    :global(.arrow-top) {
      top: -6px;
      left: -4px;
      border-width: 0 5px 8px 5px;
      border-color: transparent transparent #4c2c69 transparent;
    }
    
    :global(.arrow-bottom) {
      bottom: -6px;
      left: -4px;
      border-width: 8px 5px 0 5px;
      border-color: #4c2c69 transparent transparent transparent;
    }
    
    :global(.arrow-left) {
      left: -6px;
      top: -4px;
      border-width: 5px 8px 5px 0;
      border-color: transparent #4c2c69 transparent transparent;
    }
    
    :global(.arrow-right) {
      right: -6px;
      top: -4px;
      border-width: 5px 0 5px 8px;
      border-color: transparent transparent transparent #4c2c69;
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