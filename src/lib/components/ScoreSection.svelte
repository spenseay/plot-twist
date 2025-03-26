<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import { getContrastYIQ } from '$lib/utils/colorUtils.js';
    import { calculateDistance } from '$lib/utils/mathUtils.js';
    import { adjustYAxisArrowForChart } from '$lib/utils/axisUtils.js';
    import gameStore from '$lib/stores/gameStore.js';
    import { get } from 'svelte/store';
  
    // Set up event dispatcher to communicate with parent
    const dispatch = createEventDispatcher();
    
    // Subscribe to the game store
    $: gameState = $gameStore;
    $: players = gameState?.players || [];
    $: placements = gameState?.placements || {};
    $: selectedFilter = gameState?.selectedFilter || 'all';
    $: axes = gameState?.axes || { x: { start: "", end: "" }, y: { start: "", end: "" } };
    $: nextZIndex = gameState?.nextZIndex || 100;
    
    // DOM references
    let finalScoresTableElement;
    let playerFilterButtonsElement;
    let collectivePlacementsContainerElement;
    
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
    
    onMount(() => {
      // Initialize the chart when the component is mounted
      setTimeout(() => {
        createCollectivePlacementsChart();
      }, 10);
    });
    
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
    
    // Create player filter buttons
    function createPlayerFilterButtons() {
      if (!playerFilterButtonsElement) return;
      
      playerFilterButtonsElement.innerHTML = '';
      
      // All button
      const allButton = document.createElement('div');
      allButton.className = 'player-filter-button all-button' + (selectedFilter === 'all' ? ' active' : '');
      allButton.textContent = 'All';
      allButton.onclick = () => {
        // Update the store
        gameStore.update(state => ({
          ...state,
          selectedFilter: 'all'
        }));
        
        // Use setTimeout to ensure this runs after the store update is processed
        setTimeout(() => {
          // Get the latest state directly from the store
          const currentState = get(gameStore);
          createCollectivePlacementsChart(currentState.selectedFilter);
        }, 0);
      };
      playerFilterButtonsElement.appendChild(allButton);
      
      // Player buttons
      players.forEach((p, i) => {
        const btn = document.createElement('div');
        btn.className = 'player-filter-button' + (selectedFilter === p ? ' active' : '');
        btn.textContent = p;
        const c = playerColors[i % playerColors.length];
        btn.style.backgroundColor = c;
        
        if (getContrastYIQ(c) < 128) {
          btn.style.color = 'white';
        } else {
          btn.style.color = '#4c2c69';
        }
        
        btn.onclick = () => {
          // Update the store
          gameStore.update(state => ({
            ...state,
            selectedFilter: p
          }));
          
          // Use setTimeout to ensure this runs after the store update is processed
          setTimeout(() => {
            // Get the latest state directly from the store
            const currentState = get(gameStore);
            createCollectivePlacementsChart(currentState.selectedFilter);
          }, 0);
        };
        
        playerFilterButtonsElement.appendChild(btn);
      });
    }
    
    // Create the chart showing all player placements
    function createCollectivePlacementsChart(filterOverride = null) {
      if (!collectivePlacementsContainerElement) return;
      
      collectivePlacementsContainerElement.innerHTML = '';
      
      // Use the parameter if provided, otherwise fall back to the reactive variable
      const filterToUse = filterOverride !== null ? filterOverride : selectedFilter;
      
      // Update the store
      gameStore.update(state => ({
        ...state,
        nextZIndex: 100
      }));
      
      createPlayerFilterButtons();
      
      const chartTitle = document.createElement('h3');
      chartTitle.textContent = 'Player Placement Map';
      chartTitle.style.textAlign = 'center';
      chartTitle.style.marginBottom = '15px';
      chartTitle.style.color = '#4c2c69';
      collectivePlacementsContainerElement.appendChild(chartTitle);
      
      // Create chart container
      const chartContainer = document.createElement('div');
      chartContainer.style.position = 'relative';
      chartContainer.style.width = '100%';
      chartContainer.style.maxWidth = '350px';
      chartContainer.style.aspectRatio = '1 / 1';
      chartContainer.style.margin = '0 auto';
      chartContainer.style.border = '2px solid #4c2c69';
      chartContainer.style.borderRadius = '4px';
      chartContainer.style.backgroundColor = 'white';
      
      // X axis labels
      const xAxisStart = document.createElement('div');
      xAxisStart.className = 'axis-label x-axis-start';
      xAxisStart.style.left = '10px';
      xAxisStart.style.bottom = 'calc(50% + 15px)';
      xAxisStart.textContent = axes.x.start;
      chartContainer.appendChild(xAxisStart);
      
      const xAxisEnd = document.createElement('div');
      xAxisEnd.className = 'axis-label x-axis-end';
      xAxisEnd.style.right = '10px';
      xAxisEnd.style.bottom = 'calc(50% + 15px)';
      xAxisEnd.textContent = axes.x.end;
      chartContainer.appendChild(xAxisEnd);
      
      // Y axis labels
      const yAxisStart = document.createElement('div');
      yAxisStart.className = 'axis-label y-axis-start';
      yAxisStart.style.bottom = '10px';
      yAxisStart.style.left = '50%';
      yAxisStart.style.transform = 'translateX(-50%)';
      yAxisStart.textContent = axes.y.start;
      chartContainer.appendChild(yAxisStart);
      
      const yAxisEnd = document.createElement('div');
      yAxisEnd.className = 'axis-label y-axis-end';
      yAxisEnd.style.top = '10px';
      yAxisEnd.style.left = '50%';
      yAxisEnd.style.transform = 'translateX(-50%)';
      yAxisEnd.textContent = axes.y.end;
      chartContainer.appendChild(yAxisEnd);
      
      // Y axis arrow
      const yAxisArrow = document.createElement('div');
      yAxisArrow.className = 'axis-arrow y-axis-arrow';
      yAxisArrow.style.position = 'absolute';
      yAxisArrow.style.pointerEvents = 'none';
      yAxisArrow.style.left = '50%';
      yAxisArrow.style.width = '2px';
      yAxisArrow.style.transform = 'translateX(-50%)';
      yAxisArrow.style.backgroundColor = '#4c2c69';
      yAxisArrow.style.top = '30px';
      yAxisArrow.style.bottom = '30px';
      yAxisArrow.innerHTML = `
        <div class="arrow-head arrow-top"></div>
        <div class="arrow-head arrow-bottom"></div>
      `;
      chartContainer.appendChild(yAxisArrow);
      
      // X axis arrow
      const xAxisArrow = document.createElement('div');
      xAxisArrow.className = 'axis-arrow x-axis-arrow';
      xAxisArrow.style.position = 'absolute';
      xAxisArrow.style.pointerEvents = 'none';
      xAxisArrow.style.top = '50%';
      xAxisArrow.style.left = '50px';
      xAxisArrow.style.right = '50px';
      xAxisArrow.style.height = '2px';
      xAxisArrow.style.transform = 'translateY(-50%)';
      xAxisArrow.style.backgroundColor = '#4c2c69';
      xAxisArrow.innerHTML = `
        <div class="arrow-head arrow-left"></div>
        <div class="arrow-head arrow-right"></div>
      `;
      chartContainer.appendChild(xAxisArrow);
      
      collectivePlacementsContainerElement.appendChild(chartContainer);
      
      // Show pins
      // Use filterToUse instead of selectedFilter
      const isFiltering = (filterToUse !== 'all');
      const selectedP = isFiltering ? filterToUse : null;
      
      players.forEach((person, pIdx) => {
        const personColor = playerColors[pIdx % playerColors.length];
        
        if (isFiltering && person !== selectedP) {
          // Dim pins
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
            chartContainer.appendChild(pin);
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
          chartContainer.appendChild(pin);
        });
      });
      
      // Adjust the y-axis arrow
      setTimeout(() => {
        adjustYAxisArrowForChart(chartContainer);
      }, 0);
      
      // If filtering by a specific player, show a scoreboard
      if (isFiltering) {
        const sp = filterToUse; // Use filterToUse instead of selectedFilter
        const spData = placements[sp];
        if (!spData) return;
        
        const selfPlace = spData[sp];
        
        if (selfPlace) {
          const scoreboardContainer = document.createElement('div');
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
          scoreTable.style.fontSize = '14px';
          
          const header = document.createElement('tr');
          const rankH = document.createElement('th');
          rankH.textContent = 'Rank';
          rankH.style.backgroundColor = '#3891a6';
          rankH.style.color = 'white';
          rankH.style.padding = '8px';
          rankH.style.textAlign = 'left';
          rankH.style.border = '1px solid #ddd';
          
          const playerH = document.createElement('th');
          playerH.textContent = 'Player';
          playerH.style.backgroundColor = '#3891a6';
          playerH.style.color = 'white';
          playerH.style.padding = '8px';
          playerH.style.textAlign = 'left';
          playerH.style.border = '1px solid #ddd';
          
          const scoreH = document.createElement('th');
          scoreH.textContent = 'Points';
          scoreH.style.backgroundColor = '#3891a6';
          scoreH.style.color = 'white';
          scoreH.style.padding = '8px';
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
            rankTd.style.padding = '8px';
            rankTd.style.textAlign = 'left';
            
            const playerTd = document.createElement('td');
            playerTd.textContent = s.player;
            playerTd.style.border = '1px solid #ddd';
            playerTd.style.padding = '8px';
            playerTd.style.textAlign = 'left';
            
            const scoreTd = document.createElement('td');
            scoreTd.textContent = s.score + ' points';
            scoreTd.style.border = '1px solid #ddd';
            scoreTd.style.padding = '8px';
            scoreTd.style.textAlign = 'left';
            
            row.appendChild(rankTd);
            row.appendChild(playerTd);
            row.appendChild(scoreTd);
            scoreTable.appendChild(row);
          });
          
          scoreboardContainer.appendChild(scoreTable);
          collectivePlacementsContainerElement.appendChild(scoreboardContainer);
        }
      }
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
    <div bind:this={finalScoresTableElement}>
      {#if Object.keys(placements).length > 0}
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {#each Object.entries(calculateFinalScores())
                   .map(([player, score]) => ({ player, score }))
                   .sort((a, b) => b.score - a.score) as item, i}
              <tr class={i === 0 ? 'winner' : ''}>
                <td>{i + 1}</td>
                <td>{item.player}</td>
                <td>{item.score} points</td>
              </tr>
            {/each}
          </tbody>
        </table>
        {#if Object.entries(calculateFinalScores()).length > 0}
          <div class="winner-announcement">
            <strong>{Object.entries(calculateFinalScores())
                      .map(([player, score]) => ({ player, score }))
                      .sort((a, b) => b.score - a.score)[0]?.player}</strong> 
            knows their friends best with 
            {Object.entries(calculateFinalScores())
              .map(([player, score]) => ({ player, score }))
              .sort((a, b) => b.score - a.score)[0]?.score} points!
          </div>
        {/if}
      {/if}
    </div>
    
    <h3>Everyone's Placements</h3>
  
    <!-- Player filter buttons -->
    <div class="player-filter-container">
      <div class="player-filter-heading">View where people placed:</div>
      <div class="player-filter-buttons" bind:this={playerFilterButtonsElement}></div>
    </div>
  
    <div id="collective-placements-container" 
         bind:this={collectivePlacementsContainerElement}
         class="collective-placements-container">
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
    
    .final-scores-section h3 {
      font-size: 1.3em;
      margin-top: 20px;
      margin-bottom: 10px;
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
    
    /* Table styles */
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
    
    tr:nth-child(odd) {
      background-color: white;
    }
    
    .winner {
      background-color: #fdc30f;
      color: #4c2c69;
      font-weight: bold;
    }
    
    /* Winner announcement */
    .winner-announcement {
      text-align: center;
      font-size: 18px;
      margin: 15px 0;
      color: white;
      background-color: rgba(0, 0, 0, 0.1);
      padding: 10px;
      border-radius: 8px;
    }
    
    /* Filter buttons container */
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
    
    /* Player filter button styles */
    :global(.player-filter-button) {
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
    
    :global(.player-filter-button:hover) {
      transform: translateY(-2px);
      box-shadow: 0 3px 5px rgba(0,0,0,0.2);
    }
    
    :global(.player-filter-button.active) {
      border: 2px solid #4c2c69;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    
    :global(.player-filter-button.all-button) {
      background-color: #4c2c69;
      color: white;
    }
    
    :global(.player-filter-button.all-button.active) {
      border: 2px solid #fdc30f;
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
    
    /* Responsive styles */
    @media (min-width: 768px) {
      .section {
        padding: 15px;
        margin-bottom: 20px;
      }
      
      table {
        font-size: 14px;
      }
      
      :global(.player-filter-button) {
        font-size: 13px;
        padding: 6px 12px;
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