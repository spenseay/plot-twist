<script>
    import { createEventDispatcher } from 'svelte';
    import { getContrastYIQ } from '$lib/utils/colorUtils.js';
    import { calculateDistance } from '$lib/utils/mathUtils.js';
    
    // Props
    export let scores = {};
    export let placements = {};
    export let players = [];
    export let axes = { x: { start: '', end: '' }, y: { start: '', end: '' } };
    
    // Event dispatcher
    const dispatch = createEventDispatcher();
    
    // Sorted scores
    $: sortedScores = Object.entries(scores)
      .map(([player, score]) => ({ player, score }))
      .sort((a, b) => b.score - a.score);
    
    // Filter selection
    let selectedFilter = 'all';
    
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
    
    // DOM references
    let graphContainerRef;
    let nextZIndex = 100;
    
    // Set the filter for displaying placements
    function setFilter(filter) {
      selectedFilter = filter;
      // After filter change, re-render pins
      setTimeout(() => {
        renderPins();
      }, 0);
    }
    
    // Render pins based on the selected filter
    function renderPins() {
      if (!graphContainerRef) return;
      
      // Clear existing pins
      const existingPins = graphContainerRef.querySelectorAll('.pin');
      existingPins.forEach(pin => pin.remove());
      
      // Get the filter type
      const isFiltering = (selectedFilter !== 'all');
      const selectedP = isFiltering ? selectedFilter : null;
      
      // Render pins for each player
      const playerNames = players.map(p => p.name);
      playerNames.forEach((person, pIdx) => {
        const personColor = playerColors[pIdx % playerColors.length];
        
        // Skip if filtering and not the selected player
        if (isFiltering && person !== selectedP) {
          // Show dimmed pins
          playerNames.forEach(placer => {
            const playerData = placements[placer];
            if (!playerData) return;
            
            const place = playerData[person];
            if (!place) return;
            
            createPin({
              name: person,
              x: place.x,
              y: place.y,
              color: personColor,
              opacity: 0.2,
              zIndex: 5
            });
          });
          return;
        }
        
        // If not filtering or it's the selected player
        playerNames.forEach(placer => {
          const playerData = placements[placer];
          if (!playerData) return;
          
          const place = playerData[person];
          if (!place) return;
          
          createPin({
            name: isFiltering && person === selectedP ? placer : person,
            x: place.x,
            y: place.y,
            color: personColor,
            isSelf: placer === person,
            scale: placer === person ? 1 : 0.8,
            zIndex: placer === person ? 20 : 10
          });
        });
      });
      
      // If filtering by a player, add player-specific scoreboard
      if (isFiltering && selectedP) {
        addPlayerSpecificScoreboard(selectedP);
      } else {
        // Remove any existing player-specific scoreboards
        const scoreboards = document.querySelectorAll('.player-scoreboard');
        scoreboards.forEach(sb => sb.remove());
      }
    }
    
    // Create a pin element
    function createPin({ name, x, y, color, isSelf = false, scale = 1, opacity = 1, zIndex = 10 }) {
      const pin = document.createElement('div');
      pin.className = 'pin';
      pin.textContent = name;
      
      // Position and style
      pin.style.position = 'absolute';
      pin.style.left = (x * 100) + '%';
      pin.style.top = (y * 100) + '%';
      pin.style.backgroundColor = color;
      pin.style.color = getContrastYIQ(color.replace('#', '')) < 128 ? 'white' : '#4c2c69';
      pin.style.transform = `translate(-50%, -50%) scale(${scale})`;
      pin.style.opacity = opacity;
      pin.style.zIndex = zIndex;
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
      pin.style.boxShadow = isSelf 
        ? '0 0 0 3px white, 2px 2px 5px rgba(0,0,0,0.3)' 
        : '2px 2px 5px rgba(0,0,0,0.2)';
      pin.style.whiteSpace = 'nowrap';
      pin.style.overflow = 'hidden';
      pin.style.textAlign = 'center';
      
      // Add to container
      graphContainerRef.appendChild(pin);
      
      return pin;
    }
    
    // Add player-specific scoreboard
    function addPlayerSpecificScoreboard(selectedPlayer) {
      // Remove any existing player scoreboards
      const existingScoreboards = document.querySelectorAll('.player-scoreboard');
      existingScoreboards.forEach(sb => sb.remove());
      
      // Get self placement
      const spData = placements[selectedPlayer];
      if (!spData || !spData[selectedPlayer]) return;
      
      const selfPlace = spData[selectedPlayer];
      
      // Create scoreboard container
      const container = document.querySelector('.results-container');
      if (!container) return;
      
      const scoreboardContainer = document.createElement('div');
      scoreboardContainer.className = 'player-scoreboard';
      
      const title = document.createElement('h3');
      title.textContent = `Who knows ${selectedPlayer} best?`;
      scoreboardContainer.appendChild(title);
      
      // Calculate individual scores
      const playerScores = [];
      const playerNames = players.map(p => p.name);
      
      playerNames.forEach(player => {
        if (player === selectedPlayer) return;
        
        const playerData = placements[player];
        if (!playerData || !playerData[selectedPlayer]) return;
        
        const placement = playerData[selectedPlayer];
        const dist = calculateDistance(selfPlace, placement);
        const maxDist = Math.sqrt(2);
        const score = Math.max(0, Math.round(100 - (dist / maxDist) * 100));
        
        playerScores.push({ player, score });
      });
      
      // Sort by score
      playerScores.sort((a, b) => b.score - a.score);
      
      // Create table
      const table = document.createElement('table');
      table.className = 'scoreboard-table';
      
      // Create header
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      
      const rankHeader = document.createElement('th');
      rankHeader.textContent = 'Rank';
      headerRow.appendChild(rankHeader);
      
      const playerHeader = document.createElement('th');
      playerHeader.textContent = 'Player';
      headerRow.appendChild(playerHeader);
      
      const scoreHeader = document.createElement('th');
      scoreHeader.textContent = 'Points';
      headerRow.appendChild(scoreHeader);
      
      thead.appendChild(headerRow);
      table.appendChild(thead);
      
      // Create body
      const tbody = document.createElement('tbody');
      
      playerScores.forEach((score, index) => {
        const row = document.createElement('tr');
        if (index === 0) row.className = 'winner';
        
        const rankCell = document.createElement('td');
        rankCell.textContent = index + 1;
        row.appendChild(rankCell);
        
        const playerCell = document.createElement('td');
        playerCell.textContent = score.player;
        row.appendChild(playerCell);
        
        const scoreCell = document.createElement('td');
        scoreCell.textContent = `${score.score} points`;
        row.appendChild(scoreCell);
        
        tbody.appendChild(row);
      });
      
      table.appendChild(tbody);
      scoreboardContainer.appendChild(table);
      
      // Append to container
      container.appendChild(scoreboardContainer);
    }
    
    // Return to the menu
    function backToMenu() {
      dispatch('backToMenu');
    }
    
    // After component is mounted, render pins
    import { onMount } from 'svelte';
    
    onMount(() => {
      if (graphContainerRef) {
        renderPins();
      }
    });
  </script>
  
  <div class="results-container">
    <h2>Final Scores</h2>
    
    <!-- Scoreboard -->
    <div class="scoreboard">
      <table class="scoreboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {#each sortedScores as item, i}
            <tr class={i === 0 ? 'winner' : ''}>
              <td>{i + 1}</td>
              <td>{item.player}</td>
              <td>{item.score} points</td>
            </tr>
          {/each}
        </tbody>
      </table>
      
      {#if sortedScores.length > 0}
        <div class="winner-announcement">
          <strong>{sortedScores[0].player}</strong> knows their friends best with {sortedScores[0].score} points!
        </div>
      {/if}
    </div>
    
    <h3>Everyone's Placements</h3>
    
    <!-- Player filter buttons -->
    <div class="player-filter-container">
      <div class="player-filter-heading">View where people placed:</div>
      <div class="player-filter-buttons">
        <button 
          class="player-filter-button all-button {selectedFilter === 'all' ? 'active' : ''}"
          on:click={() => setFilter('all')}
        >
          All
        </button>
        
        {#each players as player, i}
          <button 
            class="player-filter-button {selectedFilter === player.name ? 'active' : ''}"
            style="background-color: {playerColors[i % playerColors.length]}; 
                   color: {getContrastYIQ(playerColors[i % playerColors.length].replace('#', '')) < 128 ? 'white' : '#4c2c69'};"
            on:click={() => setFilter(player.name)}
          >
            {player.name}
          </button>
        {/each}
      </div>
    </div>
    
    <!-- Placement chart -->
    <div class="chart-container">
      <h3 class="chart-title">Player Placement Map</h3>
      
      <div class="graph-container" bind:this={graphContainerRef}>
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
        <div class="axis-arrow x-axis-arrow">
          <div class="arrow-head arrow-left"></div>
          <div class="arrow-head arrow-right"></div>
        </div>
        
        <!-- Pins will be added here dynamically -->
      </div>
    </div>
    
    <!-- Player-specific scoreboard will be added here dynamically -->
    
    <div class="feedback-section">
      <p>Thanks for playing Plot Twist, please give us some feedback</p>
      <p class="feedback-link">
        <a href="https://forms.gle/P7ZFndmYZTRCye8i9" target="_blank">
          https://forms.gle/YL3cLa2v239HMNGe6
        </a>
      </p>
    </div>
    
    <div class="button-group">
      <button class="menu-button" on:click={backToMenu}>Play Again</button>
    </div>
  </div>
  
  <style>
    .results-container {
      padding: 10px;
    }
    
    h2 {
      color: white;
      font-size: 1.5em;
      margin-bottom: 15px;
      text-align: center;
    }
    
    h3 {
      color: white;
      font-size: 1.2em;
      margin: 20px 0 10px 0;
      text-align: center;
    }
    
    /* Scoreboard */
    .scoreboard {
      margin-bottom: 20px;
    }
    
    .scoreboard-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 14px;
      background-color: white;
      color: #4c2c69;
    }
    
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    
    th {
      background-color: #3891a6;
      color: white;
    }
    
    tr:nth-child(even) {
      background-color: #f2f2f2;
    }
    
    tr.winner {
      background-color: #fdc30f;
      font-weight: bold;
    }
    
    .winner-announcement {
      text-align: center;
      font-size: 16px;
      margin: 15px 0;
      padding: 10px;
      background-color: rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      color: white;
    }
    
    /* Filter buttons */
    .player-filter-container {
      background-color: white;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .player-filter-heading {
      text-align: center;
      margin-bottom: 12px;
      color: #4c2c69;
      font-weight: bold;
      font-size: 16px;
    }
    
    .player-filter-buttons {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
    }
    
    .player-filter-button {
      padding: 6px 10px;
      border-radius: 6px;
      border: 2px solid transparent;
      cursor: pointer;
      font-weight: bold;
      transition: all 0.2s ease;
      min-width: 70px;
      text-align: center;
      font-size: 12px;
    }
    
    .player-filter-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 3px 5px rgba(0,0,0,0.2);
    }
    
    .player-filter-button.active {
      border: 2px solid #4c2c69;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    
    .player-filter-button.all-button {
      background-color: #4c2c69;
      color: white;
    }
    
    .player-filter-button.all-button.active {
      border: 2px solid #fdc30f;
    }
    
    /* Chart container */
    .chart-container {
      background-color: white;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
    }
    
    .chart-title {
      color: #4c2c69 !important;
      margin-bottom: 15px;
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
      background-color: rgba(255, 255, 255, 0.7);
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
    
    .x-axis-arrow {
      top: 50%;
      left: 50px;
      right: 50px;
      height: 2px;
      transform: translateY(-50%);
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
    
    /* Player scoreboard */
    :global(.player-scoreboard) {
      background-color: white;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    
    :global(.player-scoreboard h3) {
      color: #4c2c69 !important;
      margin-top: 0;
      text-align: center;
    }
    
    /* Feedback section */
    .feedback-section {
      text-align: center;
      margin: 20px 0;
      color: white;
    }
    
    .feedback-link a {
      color: white;
      text-decoration: underline;
    }
    
    /* Button group */
    .button-group {
      display: flex;
      justify-content: center;
      margin-top: 20px;
    }
    
    .menu-button {
      background-color: #3891a6;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.3s ease;
    }
    
    .menu-button:hover {
      background-color: #2f758a;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    
    @media (min-width: 768px) {
      .player-filter-button {
        font-size: 13px;
        padding: 6px 12px;
      }
    }
    
    @media (max-width: 480px) {
      .player-filter-button {
        padding: 5px 8px;
        font-size: 11px;
        min-width: 60px;
      }
    }
  </style>