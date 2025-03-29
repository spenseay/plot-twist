<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { getContrastYIQ } from '$lib/utils/colorUtils.js';
  import { adjustYAxisArrow } from '$lib/utils/axisUtils.js';
  import gameStore from '$lib/stores/gameStore.js';
  import GraphContainer from '$lib/components/Graph/GraphContainer.svelte';

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
    // No need to adjust the arrow here anymore as GraphContainer handles it
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
  
  <!-- Use the new GraphContainer component -->
  <GraphContainer bind:containerRef={graphContainer} {axes}>
    <!-- Pins will be added dynamically to the graph container -->
  </GraphContainer>
  
  <div class="button-group" style="justify-content:center;">
    <button on:click={confirmPlacement} disabled={!allPinsPlaced}>Confirm Placement</button>
  </div>
</div>

<style>
  /* Section styles */
  .section {
    margin-bottom: 15px;
    padding: 15px;
    border-radius: 10px;
    box-shadow: 0 3px 10px rgba(0,0,0,0.05);
  }

  /* Game play section */
  .game-section {
    background-color: white;
    border: 1px solid rgba(76, 44, 105, 0.1);
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
    border-radius: 4px;
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
    font-size: 14px; /* Slightly larger font for better readability */
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
    font-size: 14px; /* Slightly larger font for better readability */
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
    margin-bottom: 15px;
    font-size: 22px;
    font-weight: bold;
    color: #4c2c69;
  }

  /* Instructions */
  .instructions {
    margin-bottom: 15px;
    padding: 12px;
    background-color: #fdc30f;
    border-radius: 8px;
    font-size: 16px;
    color: #4c2c69;
    box-shadow: 0 3px 0 #d9a40b, 0 4px 8px rgba(253, 195, 15, 0.2);
  }

  /* Pins status indicator */
  .pins-status {
    margin: 12px 0;
    padding: 10px;
    background-color: #f2f2f2;
    border-radius: 8px;
    text-align: center;
    transition: all 0.3s ease;
    font-size: 16px;
  }
  
  .pins-status.all-placed {
    background-color: #a6d3a0;
    color: #2a6b34;
    font-weight: bold;
    box-shadow: 0 2px 5px rgba(166, 211, 160, 0.4);
  }

  /* Button styles */
  button {
    background-color: #3891a6;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 18px;
    font-weight: bold;
    transition: all 0.3s;
    box-shadow: 0 3px 0 #2a6b7d, 0 4px 8px rgba(56, 145, 166, 0.3);
  }
  
  button:hover {
    background-color: #2f758a;
    transform: translateY(-2px);
    box-shadow: 0 5px 0 #2a6b7d, 0 6px 10px rgba(56, 145, 166, 0.4);
  }
  
  button:active {
    transform: translateY(1px);
    box-shadow: 0 2px 0 #2a6b7d, 0 3px 5px rgba(56, 145, 166, 0.3);
  }
  
  button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
    opacity: 0.7;
    transform: none;
    box-shadow: 0 3px 0 #999999;
  }
  
  .button-group {
    display: flex;
    gap: 10px;
    margin-top: 20px;
  }
  
  /* Responsive styles */
  @media (min-width: 768px) {
    .section {
      padding: 20px;
      margin-bottom: 25px;
    }
    
    .turn-indicator {
      font-size: 24px;
    }
    
    .instructions {
      font-size: 16px;
      padding: 15px;
    }
    
    .pins-status {
      font-size: 16px;
    }
    
    :global(.pins-container .pin),
    :global(.graph-container .pin) {
      font-size: 14px;
    }
  }
  
  @media (max-width: 480px) {
    .section {
      padding: 12px;
      margin-bottom: 15px;
      border-radius: 8px;
    }
    
    .turn-indicator {
      font-size: 20px;
      margin-bottom: 12px;
    }
    
    .instructions {
      font-size: 15px;
      padding: 10px;
      margin-bottom: 12px;
    }
    
    button {
      padding: 10px 20px;
      font-size: 16px;
      border-radius: 6px;
    }
    
    .pins-status {
      font-size: 14px;
      padding: 8px;
      margin: 10px 0;
    }
    
    :global(.pins-container .pin),
    :global(.graph-container .pin) {
      font-size: 13px; 
      min-width: 65px;
      height: 32px;
    }
  }
</style>