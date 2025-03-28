<script>
    import { createEventDispatcher } from 'svelte';
    
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
      players.forEach((person, pIdx) => {
        const personColor = playerColors[pIdx % playerColors.length];
        
        // Skip if filtering and not the selected player
        if (isFiltering && person.name !== selectedP) {
          // Show dimmed pins
          players.forEach(placer => {
            const playerData = placements[placer.name];
            if (!playerData) return;
            
            const place = playerData[person.name];
            if (!place) return;
            
            createPin({
              name: person.name,
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
        players.forEach(placer => {
          const playerData = placements[placer.name];
          if (!playerData) return;
          
          const place = playerData[person.name];
          if (!place) return;
          
          createPin({
            name: isFiltering && person.name === selectedP ? placer.name : person.name,
            x: place.x,
            y: place.y,
            color: personColor,
            isSelf: placer.name === person.name,
            scale: placer.name === person.name ? 1 : 0.8,
            zIndex: placer.name === person.name ? 20 : 10
          });
        });
      });
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
      pin.style.transform = `translate(-50%, -50%) scale(${scale})`;
      pin.style.opacity = opacity;
      pin.style.zIndex = zIndex;
      
      // For self-placements
      if (isSelf) {
        pin.style.boxShadow = '0 0 0 3px white, 2px 2px 5px rgba(0,0,0,0.3)';
      }
      
      // Add to container
      graphContainerRef.appendChild(pin);
      
      return pin;
    }
    
    // Return to the menu
    function backToMenu() {
      dispatch('backToMenu');
    }
    
    // After component is mounted, render pins
    function afterRender() {
      if (graphContainerRef) {
        renderPins();
        adjustYAxisArrow();
      }
    }
    
    // Adjust the Y-axis arrow
    function adjustYAxisArrow() {
      if (!graphContainerRef) return;
      
      const yAxisEndLabel = graphContainerRef.querySelector('.y-axis-end');
      const yAxisStartLabel = graphContainerRef.querySelector('.y-axis-start');
      const yAxisArrow = graphContainerRef.querySelector('.y-axis-arrow');
      
      if (!yAxisEndLabel || !yAxisStartLabel || !yAxisArrow) return;
      
      const margin = 5;
      const containerRect = graphContainerRef.getBoundingClientRect();
      const endRect = yAxisEndLabel.getBoundingClientRect();
      const startRect = yAxisStartLabel.getBoundingClientRect();
      
      const arrowTop = (endRect.bottom - containerRect.top) + margin;
      const arrowBottom = (containerRect.bottom - startRect.top) + margin;
      
      yAxisArrow.style.top = arrowTop + 'px';
      yAxisArrow.style.bottom = arrowBottom + 'px';
    }
    
    // Make sure to render pins after the component is mounted
    import { onMount } from 'svelte';
    
    onMount(() => {
      afterRender();
    });
  </script>
  
  <div class="results-container">
    <h2>Final Scores</h2>
    
    <!-- Scoreboard -->
    <div class="scoreboard">
      <table>
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
        <div class="axis-arrow x-axis-arrow" style="
          position: absolute; top: 50%; left: 50px; right: 50px;
          height: 2px; transform: translateY(-50%);
          background-color: #4c2c69; pointer-events: none;">
          <div class="arrow-head arrow-left"></div>
          <div class="arrow-head arrow-right"></div>
        </div>
        
        <!-- Pins will be added here dynamically -->
      </div>
    </div>
    
    <!-- Player-specific scoreboard when filtering -->
    {#if selectedFilter !== 'all'}
      <div class="player-scoreboard">
        <h3>Who knows {selectedFilter} best?</h3>
        
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            <!-- We'll calculate individual scores in the next iteration -->
          </tbody>
        </table>
      </div>
    {/if}
    
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
    
    table {
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
    :global(.graph-container .pin) {
      position: absolute;
      min-width: 70px;
      padding: 6px 8px;
      background-color: #fdc30f;
      color: #4c2c69;
      display: flex;
      justify-content: center;
      align-items: center;
      font-weight: bold;
      cursor: pointer;
      transform: translate(-50%, -50%);
      box-shadow: 2px 2px 5px rgba(0,0,0,0.2);
      user-select: none;
      overflow: hidden;
      white-space: nowrap;
      text-align: center;
      font-size: 12px;
      border-radius: 2px;
    }
    
    /* Player scoreboard */
    .player-scoreboard {
      background-color: white;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    
    .player-scoreboard h3 {
      color: #4c2c69 !important;
      margin-top: 0;
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