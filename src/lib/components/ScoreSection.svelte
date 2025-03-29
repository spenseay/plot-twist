<script>
  import { createEventDispatcher, onMount, tick } from 'svelte';
  import { getContrastYIQ } from '$lib/utils/colorUtils.js';
  import { calculateDistance } from '$lib/utils/mathUtils.js';
  import { adjustYAxisArrowForChart } from '$lib/utils/axisUtils.js';
  import gameStore from '$lib/stores/gameStore.js';
  import { get } from 'svelte/store';
  import GraphContainer from '$lib/components/Graph/GraphContainer.svelte';
  import FilterButtons from '$lib/components/UI/FilterButtons.svelte';
  import Scoreboard from '$lib/components/UI/Scoreboard.svelte';

  // Set up event dispatcher to communicate with parent
  const dispatch = createEventDispatcher();
  
  // Subscribe to the game store
  $: gameState = $gameStore;
  $: players = gameState?.players || [];
  $: placements = gameState?.placements || {};
  $: selectedFilter = gameState?.selectedFilter || 'all';
  $: axes = gameState?.axes || { x: { start: "", end: "" }, y: { start: "", end: "" } };
  $: nextZIndex = gameState?.nextZIndex || 100;
  
  // Processed scores for the Scoreboard component
  $: scoreData = Object.entries(calculateFinalScores())
                       .map(([player, score]) => ({ player, score }));
  
  // DOM references
  let collectivePlacementsContainerElement;
  let graphContainerRef = null; // This will hold the actual container DOM element
  
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
  
  // Track if chart is created
  let isInitialized = false;
  
  // When the filter changes, update the chart
  $: if (selectedFilter && isInitialized) {
    renderPins();
    addPlayerSpecificScoreboard();
  }
  
  onMount(async () => {
  // Add a delay to ensure all data is properly loaded from the store
  setTimeout(async () => {
    // Wait for next tick to ensure container is rendered
    await tick();
    
    // Now render pins
    if (graphContainerRef) {
      renderPins();
      addPlayerSpecificScoreboard();
      isInitialized = true;
    }
  }, 200); // 200ms delay should be enough
});

// Also add a reactive statement to recalculate scores when placements change
$: {
  if (Object.keys(placements).length > 0 && players.length > 0) {
    // Force score recalculation when placements data is available
    scoreData = Object.entries(calculateFinalScores())
                     .map(([player, score]) => ({ player, score }));
  }
}
  
  // Handle filter change event from FilterButtons component
  function handleFilterChanged(event) {
    console.log('Filter changed to:', event.detail.filter);
    // No need to update the store here since it's done inside the FilterButtons component
  }
  
  // Calculate final scores based on player placements
  function calculateFinalScores() {
    const scores = {};
    players.forEach(p => scores[p] = 0);
    
    players.forEach(person => {
      const personData = placements[person];
      if (!personData) return;
      
      const selfPlacement = personData[person];
      if (!selfPlacement) return;
      
      players.forEach(player => {
        if (player === person) return;
        
        const playerData = placements[player];
        if (!playerData) return;
        
        const placement = playerData[person];
        if (!placement) return;
        
        const dist = calculateDistance(selfPlacement, placement);
        const maxDist = Math.sqrt(2);
        const sc = Math.max(0, Math.round(100 - (dist / maxDist) * 100));
        scores[player] += sc;
      });
    });
    
    return scores;
  }
  
  // Render pins on the graph
  function renderPins() {
    if (!graphContainerRef) return;
    
    // Clear existing pins
    const existingPins = graphContainerRef.querySelectorAll('.pin');
    existingPins.forEach(pin => pin.remove());
    
    // Reset z-index counter
    gameStore.update(state => ({
      ...state,
      nextZIndex: 100
    }));
    
    // Determine if we're filtering
    const isFiltering = (selectedFilter !== 'all');
    const selectedP = isFiltering ? selectedFilter : null;
    
    players.forEach((person, pIdx) => {
      const personColor = playerColors[pIdx % playerColors.length];
      
      if (isFiltering && person !== selectedP) {
        // Dim pins for non-selected players when filtering
        players.forEach(placer => {
          const placerData = placements[placer];
          if (!placerData) return;
          
          const place = placerData[person];
          if (!place) return;
          
          const pin = document.createElement('div');
          pin.className = 'pin';
          pin.textContent = person;
          pin.style.backgroundColor = personColor;
          pin.style.opacity = '0.2';
          pin.style.left = (place.x * 100) + '%';
          pin.style.top = (place.y * 100) + '%';
          pin.style.position = 'absolute';
          pin.style.transform = 'translate(-50%, -50%)';
          pin.style.minWidth = '70px';
          pin.style.maxWidth = '100px';
          pin.style.width = 'auto';
          pin.style.height = '34px';
          pin.style.padding = '6px 8px';
          pin.style.display = 'flex';
          pin.style.justifyContent = 'center';
          pin.style.alignItems = 'center';
          pin.style.margin = '0';
          pin.style.fontFamily = 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
          pin.style.fontSize = '12px';
          pin.style.fontWeight = 'bold';
          pin.style.borderRadius = '2px';
          pin.style.boxShadow = '2px 2px 5px rgba(0,0,0,0.2)';
          pin.style.whiteSpace = 'nowrap';
          pin.style.overflow = 'hidden';
          pin.style.textAlign = 'center';
          pin.addEventListener('click', () => bringPinToFront(pin));
          graphContainerRef.appendChild(pin);
        });
        return;
      }
      
      // If not filtering or it's the selected player
      players.forEach(placer => {
        const placerData = placements[placer];
        if (!placerData) return;
        
        const place = placerData[person];
        if (!place) return;
        
        const pin = document.createElement('div');
        pin.className = 'pin';
        
        if (isFiltering && person === selectedP) {
          pin.textContent = placer; // show who placed them
        } else {
          pin.textContent = person; // show the person
        }
        
        pin.style.backgroundColor = personColor;
        pin.style.color = getContrastYIQ(personColor) < 128 ? 'white' : '#4c2c69';
        pin.style.position = 'absolute';
        pin.style.left = (place.x * 100) + '%';
        pin.style.top = (place.y * 100) + '%';
        pin.style.transform = placer === person 
          ? 'translate(-50%, -50%)' 
          : 'translate(-50%, -50%) scale(0.8)';
        pin.style.minWidth = '70px';
        pin.style.maxWidth = '100px';
        pin.style.width = 'auto';
        pin.style.height = '34px';
        pin.style.padding = '6px 8px';
        pin.style.display = 'flex';
        pin.style.justifyContent = 'center';
        pin.style.alignItems = 'center';
        pin.style.margin = '0';
        pin.style.fontFamily = 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif';
        pin.style.fontSize = '12px';
        pin.style.fontWeight = 'bold';
        pin.style.borderRadius = '2px';
        pin.style.boxShadow = placer === person 
          ? '0 0 0 3px white, 2px 2px 5px rgba(0,0,0,0.3)' 
          : '2px 2px 5px rgba(0,0,0,0.2)';
        pin.style.whiteSpace = 'nowrap';
        pin.style.overflow = 'hidden';
        pin.style.textAlign = 'center';
        pin.style.zIndex = placer === person ? '20' : '10';
        
        pin.addEventListener('click', () => bringPinToFront(pin));
        graphContainerRef.appendChild(pin);
      });
    });
  }
  
  // Add player-specific scoreboard when filtering by player
  function addPlayerSpecificScoreboard() {
    // First clear any existing scoreboards
    const existingScoreboards = collectivePlacementsContainerElement.querySelectorAll('.player-scoreboard');
    existingScoreboards.forEach(sb => sb.remove());
    
    // If not filtering, return early
    if (selectedFilter === 'all') return;
    
    const sp = selectedFilter;
    const spData = placements[sp];
    if (!spData) return;
    
    const selfPlace = spData[sp];
    if (!selfPlace) return;
    
    const scoreboardContainer = document.createElement('div');
    scoreboardContainer.className = 'player-scoreboard';
    scoreboardContainer.style.marginTop = '20px';
    scoreboardContainer.style.backgroundColor = '#f9f9f9';
    scoreboardContainer.style.padding = '12px';
    scoreboardContainer.style.borderRadius = '8px';
    scoreboardContainer.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    
    const scoreboardTitle = document.createElement('h4');
    scoreboardTitle.textContent = `Who knows ${sp} best?`;
    scoreboardTitle.style.textAlign = 'center';
    scoreboardTitle.style.marginBottom = '12px';
    scoreboardTitle.style.color = '#4c2c69';
    scoreboardContainer.appendChild(scoreboardTitle);
    
    const playerScores = [];
    players.forEach(pl => {
      if (pl === sp) return;
      
      const plData = placements[pl];
      if (!plData) return;
      
      const place = plData[sp];
      if (!place) return;
      
      const dist = calculateDistance(selfPlace, place);
      const maxDist = Math.sqrt(2);
      const sc = Math.max(0, Math.round(100 - (dist / maxDist) * 100));
      playerScores.push({ player: pl, score: sc });
    });
    
    playerScores.sort((a, b) => b.score - a.score);
    
    const scoreTable = document.createElement('table');
    scoreTable.style.width = '100%';
    scoreTable.style.borderCollapse = 'collapse';
    scoreTable.style.marginTop = '15px';
    scoreTable.style.fontSize = '16px'; // INCREASED FONT SIZE
    scoreTable.style.borderRadius = '8px'; // ADDED ROUNDED CORNERS
    scoreTable.style.overflow = 'hidden'; // NEEDED FOR BORDER RADIUS TO WORK
    
    const header = document.createElement('tr');
    const rankH = document.createElement('th');
    rankH.textContent = 'Rank';
    rankH.style.backgroundColor = '#3891a6';
    rankH.style.color = 'white';
    rankH.style.padding = '10px'; // INCREASED PADDING
    rankH.style.textAlign = 'left';
    rankH.style.border = '1px solid #ddd';
    
    const playerH = document.createElement('th');
    playerH.textContent = 'Player';
    playerH.style.backgroundColor = '#3891a6';
    playerH.style.color = 'white';
    playerH.style.padding = '10px'; // INCREASED PADDING
    playerH.style.textAlign = 'left';
    playerH.style.border = '1px solid #ddd';
    
    const scoreH = document.createElement('th');
    scoreH.textContent = 'Points';
    scoreH.style.backgroundColor = '#3891a6';
    scoreH.style.color = 'white';
    scoreH.style.padding = '10px'; // INCREASED PADDING
    scoreH.style.textAlign = 'left';
    scoreH.style.border = '1px solid #ddd';
    
    header.appendChild(rankH);
    header.appendChild(playerH);
    header.appendChild(scoreH);
    scoreTable.appendChild(header);
    
    playerScores.forEach((s, i) => {
      const row = document.createElement('tr');
      if (i === 0) {
        row.style.backgroundColor = '#fdc30f';
        row.style.color = '#4c2c69';
        row.style.fontWeight = 'bold';
      } else {
        row.style.backgroundColor = i % 2 === 0 ? 'white' : '#f2f2f2';
        row.style.color = '#4c2c69';
      }
      
      const rankTd = document.createElement('td');
      rankTd.textContent = (i + 1).toString();
      rankTd.style.border = '1px solid #ddd';
      rankTd.style.padding = '10px'; // INCREASED PADDING
      rankTd.style.textAlign = 'left';
      
      const playerTd = document.createElement('td');
      playerTd.textContent = s.player;
      playerTd.style.border = '1px solid #ddd';
      playerTd.style.padding = '10px'; // INCREASED PADDING
      playerTd.style.textAlign = 'left';
      
      const scoreTd = document.createElement('td');
      scoreTd.textContent = s.score + ' points';
      scoreTd.style.border = '1px solid #ddd';
      scoreTd.style.padding = '10px'; // INCREASED PADDING
      scoreTd.style.textAlign = 'left';
      
      row.appendChild(rankTd);
      row.appendChild(playerTd);
      row.appendChild(scoreTd);
      scoreTable.appendChild(row);
    });
    
    scoreboardContainer.appendChild(scoreTable);
    collectivePlacementsContainerElement.appendChild(scoreboardContainer);
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
  
  // Event handler for the "Play Again" button
  function resetGame() {
    dispatch('resetGame');
  }
</script>

<div class="section final-scores-section">
  <h2>Final Scores</h2>
  
  <!-- Using our new Scoreboard component with disableRowClick set to true -->
  <Scoreboard 
    scores={scoreData}
    disableRowClick={true}
    customClasses="final-scores-table"
  />

  <!-- Player filter buttons using FilterButtons component -->
  <div class="player-filter-container">
    <div class="player-filter-heading">View where people placed:</div>
    <FilterButtons 
      buttonColors={playerColors}
      on:filterChanged={handleFilterChanged}
    />
  </div>

  <div id="collective-placements-container" 
       bind:this={collectivePlacementsContainerElement}
       class="collective-placements-container">
    
    
    
    <!-- Here's where we use our GraphContainer component -->
    <div class="chart-wrapper">
      <GraphContainer 
        {axes} 
        forScoreSection={true} 
        bind:containerRef={graphContainerRef} />
    </div>
  </div>

  <div class="feedback-section">
    <p>Thanks for playing Plot Twist, please give us some feedback</p>
    <p class="feedback-link">
      <a href="https://forms.gle/P7ZFndmYZTRCye8i9" target="_blank">
        https://forms.gle/YL3cLa2v239HMNGe6
      </a>
    </p>
  </div>

  <div class="button-group">
    <button on:click={resetGame}>Play Again</button>
  </div>
</div>

<style>
  /* Section styles */
  .section {
    margin-bottom: 15px;
    padding: 12px;
    border-radius: 8px;
  }

  /* Final scores section */
  .final-scores-section {
    background-color: #4c2c69;
    color: white;
    padding: 15px;
    border-radius: 8px;
  }
  
  .final-scores-section h2 {
    color: white;
    font-size: 1.5em;
    margin-bottom: 10px;
  }
  
  /* Add specific styles for the scoreboard within this component */
  :global(.final-scores-table) {
    margin-top: 10px;
    border-radius: 8px;
    overflow: hidden;
  }
  
  :global(.final-scores-section .winner-announcement) {
    color: white;
    margin: 10; /* this doesn't seem to be doing anything */
    background-color: #a6d3a0; 
    padding: 12px;
    border-radius: 8px;
    color: #4c2c69; 
    font-weight: bold;
  }
  
  .chart-wrapper {
    width: 100%;
    max-width: 350px;
    margin: 0 auto;
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
  
  .button-group {
    display: flex;
    gap: 10px;
    margin-top: 20px;
    justify-content: center;
  }
  
  /* Filter buttons container */
  .player-filter-container {
    background-color: white;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 15px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin-top: 0; /* REMOVED GAP COMPLETELY */
  }
  
  .player-filter-heading {
    text-align: center;
    margin-bottom: 12px;
    color: #4c2c69;
    font-weight: bold;
    font-size: 16px;
  }
  
  /* Placements container */
  .collective-placements-container {
    background-color: white;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 15px;
  }
  
  /* Feedback section */
  .feedback-section {
    text-align: center;
    margin-top: 15px;
    margin-bottom: 15px;
  }
  
  .feedback-section p {
    color: white;
    font-size: 14px;
    margin-bottom: 8px;
  }
  
  .feedback-link a {
    color: white;
    text-decoration: underline;
  }
  
  /* Responsive styles */
  @media (min-width: 768px) {
    .section {
      padding: 15px;
      margin-bottom: 20px;
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