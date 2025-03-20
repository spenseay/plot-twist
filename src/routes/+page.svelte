<script lang="ts">
  import { onMount } from 'svelte';

  // Type definitions
  interface AxisDef {
    start: string;
    end: string;
  }

  interface Axes {
    x: AxisDef;
    y: AxisDef;
  }

  interface Coordinate {
    x: number;
    y: number;
  }

  interface PlayerPlacements {
    [player: string]: Coordinate;
  }

  interface AllPlacements {
    [placer: string]: PlayerPlacements;
  }

  interface PlayerScore {
    player: string;
    score: number;
  }

  // -- Game State --
  let players: string[] = [];
  let currentTurn: number = 0;
  let placements: AllPlacements = {};
  let selectedFilter: string = 'all';
  let setupSectionVisible: boolean = true;
  let gameSectionVisible: boolean = false;
  let finalScoresSectionVisible: boolean = false;
  let nextZIndex: number = 100;
  let allPinsPlaced: boolean = false;
  let activeDragPin: HTMLElement | null = null;
  let playerNameInput: string = '';
  
  // Graph axis state
  let axes: Axes = {
    x: { start: "", end: "" },
    y: { start: "", end: "" }
  };

  // Color palette
  const playerColors: string[] = [
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

  // Example axis options
  const axisOptions: AxisDef[] = [
    { start: "High Five", end: "Fist Bump" },
    { start: "Couch Potato", end: "Touches Grass" },
    { start: "Lights Candles", end: "Lights Bonfires" },
    { start: "Silent Sneezer", end: "Powerful Sneezer" },
    { start: "Napkin User", end: "Sleeve Wiper" },
    { start: "Shower Singer", end: "Shower Thinker" },
    { start: "Spider Saver", end: "Spider Squisher" },
    { start: "Movie Talker", end: "Shusher" },
    { start: "Sock Shoe Sock Shoe", end: "Sock Sock Shoe Shoe" },
    { start: "Bookworm", end: "Illiterate" },
    { start: "Sells feet pics", end: "Buys feet pics" },
    { start: "Predator", end: "Prey" },
    { start: "Sugar Baby", end: "Sugar Daddy" },
    { start: "Mountains", end: "Beach" },
    { start: "Early Bird", end: "The Worm" },
    { start: "Left on read", end: "Leaving Others On Read" },
    { start: "Toilet Paper Folder", end: "Toilet Paper Crumbler" },
    { start: "Window Seat", end: "Aisle Seat" },
    { start: "One Tab Open", end: "100 Tabs Open" },
    { start: "Instruction Reader", end: "Wings It" },
    { start: "Menu Studier", end: "Panic Orderer" },
    { start: "Punctual", end: "Fashionably Late" },
    { start: "Single Alarm", end: "Snooze Abuser" },
    { start: "Screenager", end: "Digital Detox" },
    { start: "Cereal First", end: "Milk First" },
    { start: "Boundary Setter", end: "Pushover" },
    { start: "Conflict Avoidant", end: "Conflict Causer" },
    { start: "Review Reader", end: "Impulse Buyer" },
    { start: "Full Tank", end: "Rides on Empty" },
    { start: "Matching Sock Seeker", end: "Any Two Will Do" },
    { start: "Hard G in GIF", end: "Soft G in GIF" },
    { start: "Tea Spiller", end: "Tea Drinker" },
    { start: "Slow Eater", end: "Speed Inhaler" },
    { start: "Fork and Knife Pizza", end: "Folded Slice" },
    { start: "Umbrella Owner", end: "Soaked And Unprepared" },
    { start: "Subtitles On", end: "Subtitles Off" },
    { start: "Socks in Bed", end: "Barefoot Sleeper" },
    { start: "Minimalist", end: "Maximalist" },
    { start: "QWERTY Expert", end: "Touch Typer" },
    { start: "Socks in Bed", end: "Barefoot Sleeper" },
    { start: "Four Suitcases", end: "Just A Backpack" },
    { start: "Front Row Sitter", end: "Back Row Hider" },
    { start: "Tailgater", end: "Defensive Driver" },
    { start: "Installs Updates", end: "'Remind Me Later'" },
    { start: "Asks for Directions", end: "Drives in Circles" },
    { start: "Natural Navigator", end: "Makes L with Fingers" },
    { start: "Hairless", end: "Hairy" },
    { start: "Hero", end: "Villain" },
    { start: "Inflexible", end: "Flexible" },
    { start: "Risk Averse", end: "Adrenaline Junkie" },
    { start: "Dog Person", end: "Cat Person" },
    { start: "Mint Chip", end: "Cookie Dough" },
    { start: "Serial Procrastinator", end: "Planner" },
    { start: "Toilet Paper Over", end: "Toilet Paper Under" },
    { start: "Playlist Curator", end: "Just Presses Shuffle" },
    { start: "Movie Crier", end: "Emotional Fortress" },
    { start: "Inbox Zero", end: "10,000 Unread Emails" },
    { start: "Birthday Rememberer", end: "Facebook Birthday Reliant" },
    { start: "Runway Model", end: "Gets Dressed In The Dark" },
    { start: "Washes Pants After 1 Wear", end: "Washes Pants After 4 Wears" },
    { start: "Separates Laundry By Color", end: "Everything In One Load" },
    { start: "Orders Water", end: "Orders Shirley Temple" },
    { start: "Would Fight A Goose", end: "Would Befriend A Goose" },
    { start: "Eats Kiwi With The Skin", end: "Meticulously Peels Kiwi" },
    { start: "Enters Pool Slowly", end: "Dives In The Deep End" },
    { start: "Collects Hotel Soaps", end: "Brings Own Toiletries" },
    { start: "Befriends Neighborhood Squirrels", end: "Has Squirrel Nemesis" },
    { start: "Doomsday Prepper", end: "Lives In The Moment" },
    { start: "Memorized Pi To 100 Digits", end: "Thinks Pi ≈ 3" },
    { start: "Takes Scenic Route", end: "Takes Fastest Route" },
    { start: "Wants To Be Cryogenically Frozen", end: "Wants Natural Burial" },
    { start: "Has A Favorite Font", end: "Uses Arial" },
    { start: "We Live In A Simulation", end: "We Are The Center Of The Universe" },
    { start: "AI Is Overhyped", end: "AI Is The Future" },
    { start: "Amish", end: "Scientologist" },
    { start: "Driver", end: "Passenger Princess" },
    { start: "Warm Hugger", end: "Side Hugger" },
    { start: "Guards Fries", end: "Shares Fries" },
    { start: "Picture Taker", end: "Memory Maker" },
    { start: "Air Drummer", end: "Head Bobber" },
    { start: "Moon Howler", end: "Star Gazer" },
    { start: "Beach Lounger", end: "Ocean Swimmer" },
    { start: "Stealth Fart", end: "Loud And Proud" },
    { start: "Bubble Popper", end: "Bubble Blower" },
    { start: "Jacket In Summer", end: "Shorts In Winter" },
    { start: "Buys Extended Warranty", end: "Lives Dangerously" },
    { start: "Pineapple Pizza Lover", end: "Pizza Purist" },
    { start: "Sushi With Chopsticks", end: "Sushi With Fork" },
    { start: "Sunrise", end: "Sunset" },
    { start: "Karma Believer", end: "Coincidence Observer" },
    { start: "Public Restroom Hoverer", end: "Sits Right Down" },
    { start: "Would Clone Self", end: "Fears Clone Army" },
    { start: "Overshares", end: "Emotionally Unavailable" },
    { start: "Saves For Retirement", end: "Lives For Today" },
    { start: "Actions Reveal Character", end: "Words Define Us" },
    { start: "Money Can't Buy Happiness", end: "Money Can Buy Happiness" },
    { start: "Success Requires Sacrifice", end: "Balance Is Success" },
    { start: "Tells White Lies", end: "Brutal Honesty Always" },
    { start: "Health Is Wealth", end: "Wealth Is Wealth" },
    { start: "Would Choose Knowledge", end: "Would Choose Happiness" },
    { start: "Power Walker", end: "Stroller" }
  ];

  // DOM references
  let graphContainer: HTMLDivElement;
  let pinsContainer: HTMLDivElement;
  let turnIndicatorElement: HTMLDivElement;
  let pinsStatusElement: HTMLDivElement;
  let finalScoresTableElement: HTMLDivElement;
  let playerFilterButtonsElement: HTMLDivElement;
  let collectivePlacementsContainerElement: HTMLDivElement;

  // Reactive declarations
  $: startGameDisabled = players.length < 2;
  $: confirmPlacementDisabled = !allPinsPlaced;
  $: currentPlayer = players[currentTurn] || '';
  $: pinsStatusText = allPinsPlaced 
    ? 'All pins placed! You can now confirm.' 
    : 'Waiting for all pins to be placed on the chart...';
  $: pinsStatusClass = allPinsPlaced ? 'pins-status all-placed' : 'pins-status';
  $: if (gameSectionVisible) {
    // This reactive statement ensures the Y-axis is adjusted whenever game section becomes visible
    setTimeout(() => {
      adjustYAxisArrow();
      // First player turn might need an extra adjustment
      if (currentTurn === 0) {
        setTimeout(adjustYAxisArrow, 100);
      }
    }, 0);
  }

  onMount(() => {
    selectRandomAxes();
  });

  function selectRandomAxes(): Axes {
    // Create a copy of axis options and shuffle it
    let arr = [...axisOptions];
    const shuffled = [...arr].map(() => {
      const j = Math.floor(Math.random() * arr.length);
      return arr.splice(j, 1)[0];
    });
    
    // Pick the first two for X and Y
    const xAxis = shuffled[0];
    const yAxis = shuffled[1] || shuffled[0]; // Fallback if we only have one option
    
    // Set the axes
    axes = {
      x: {
        ...xAxis
      },
      y: {
        ...yAxis
      }
    };
    
    console.log("Axes randomized:", axes);
    return axes;
  }

  function adjustYAxisArrow(): void {
    if (!graphContainer) return;
    
    const yAxisEndLabel = graphContainer.querySelector('.y-axis-end');
    const yAxisStartLabel = graphContainer.querySelector('.y-axis-start');
    const yAxisArrow = graphContainer.querySelector('.y-axis-arrow');
    
    if (!yAxisEndLabel || !yAxisStartLabel || !yAxisArrow) {
      console.log("Missing elements for Y-axis adjustment");
      return;
    }

    const margin = 5; // extra spacing so arrow doesn't overlap text
    const containerRect = graphContainer.getBoundingClientRect();
    const endRect = yAxisEndLabel.getBoundingClientRect();
    const startRect = yAxisStartLabel.getBoundingClientRect();

    // Distance from container's top to bottom of top label
    const arrowTop = (endRect.bottom - containerRect.top) + margin;

    // Distance from container's bottom to top of bottom label
    const arrowBottom = (containerRect.bottom - startRect.top) + margin;

    console.log("Y-Axis adjustment:", { arrowTop, arrowBottom });

    // Set arrow line - cast to HTMLElement to ensure TypeScript knows these properties exist
    (yAxisArrow as HTMLElement).style.top = arrowTop + 'px';
    (yAxisArrow as HTMLElement).style.bottom = arrowBottom + 'px';
  }

  // -- Player Management --
  function addPlayer(): void {
    const playerName = playerNameInput.trim();
    if (!playerName) {
      alert('Please enter a player name.');
      return;
    }
    if (players.includes(playerName)) {
      alert('This player is already added.');
      return;
    }
    players = [...players, playerName];
    playerNameInput = '';
  }

  function removePlayer(index: number): void {
    players = players.filter((_, i) => i !== index);
  }

  function clearPlayers(): void {
    players = [];
  }

  // -- Game Logic --
  function startGame(): void {
    setupSectionVisible = false;
    gameSectionVisible = true;
    finalScoresSectionVisible = false;
    
    // Initialize placements
    placements = {};
    players.forEach(p => { placements[p] = {}; });
    
    selectRandomAxes();
    
    currentTurn = 0;
    startPlayerTurn();
  }

  function startPlayerTurn(): void {
    allPinsPlaced = false;
    nextZIndex = 100;
    
    const currentPlayer = players[currentTurn];
    if (turnIndicatorElement) {
      turnIndicatorElement.textContent = `${currentPlayer}'s Turn`;
    }
    
    // Clear any existing pins from the graph container
    if (graphContainer) {
      const existingPins = graphContainer.querySelectorAll('.pin');
      existingPins.forEach(pin => pin.remove());
    }
    
    // Clear and recreate pins container contents
    if (pinsContainer) {
      pinsContainer.innerHTML = '';
      
      // Create a fresh pin for each player - use the exact same approach for all players
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
        pin.onmousedown = (e) => dragStart(e as MouseEvent, pin);
        pin.ontouchstart = (e) => touchStart(e as TouchEvent, pin);
        pin.onclick = () => bringPinToFront(pin);
        
        // Add to container
        pinsContainer.appendChild(pin);
      });
    }
    
    // Ensure styles are applied and layout is calculated
    setTimeout(() => {
      updatePinStatus();
      adjustYAxisArrow();
    }, 50);
  }

  function updatePinStatus(): void {
    if (!gameSectionVisible) return;
    
    const pinElements = document.querySelectorAll('.pin');
    let placedCount = 0;
    
    pinElements.forEach(pin => {
      if (pin.getAttribute('data-placed') === 'true') {
        placedCount++;
      }
    });
    
    allPinsPlaced = placedCount === players.length;
  }

  function confirmPlacement(): void {
    const placement: PlayerPlacements = {};
    const rect = graphContainer.getBoundingClientRect();
    
    document.querySelectorAll('.pin').forEach(pin => {
      const player = pin.getAttribute('data-player');
      if (!player) return;
      
      const leftStyle = (pin as HTMLElement).style.left;
      const topStyle = (pin as HTMLElement).style.top;
      
      // Convert percentage to decimal if needed
      const leftVal = leftStyle.endsWith('%') 
        ? parseFloat(leftStyle) / 100 
        : parseFloat(leftStyle) / rect.width;
        
      const topVal = topStyle.endsWith('%') 
        ? parseFloat(topStyle) / 100 
        : parseFloat(topStyle) / rect.height;
        
      placement[player] = { x: leftVal, y: topVal };
    });
    
    placements[currentPlayer] = placement;
    currentTurn++;
    
    if (currentTurn < players.length) {
      startPlayerTurn();
    } else {
      showFinalScores();
    }
  }

  function showFinalScores(): void {
    gameSectionVisible = false;
    finalScoresSectionVisible = true;
    selectedFilter = 'all';
    
    setTimeout(() => {
      createCollectivePlacementsChart();
    }, 0);
  }

  function resetGame(): void {
    players = [];
    currentTurn = 0;
    placements = {};
    selectedFilter = 'all';
    nextZIndex = 100;
    allPinsPlaced = false;
    
    setupSectionVisible = true;
    gameSectionVisible = false;
    finalScoresSectionVisible = false;
    
    playerNameInput = '';
    
    selectRandomAxes();
  }

  // -- Drag Functionality --
  function dragStart(e: MouseEvent, pin: HTMLElement): void {
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

  function dragMove(e: MouseEvent): void {
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

  function dragEnd(): void {
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
  function touchStart(e: TouchEvent, pin: HTMLElement): void {
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

  function touchMove(e: TouchEvent): void {
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

  function touchEnd(): void {
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

  function bringPinToFront(pin: HTMLElement): void {
    nextZIndex++;
    pin.style.zIndex = nextZIndex.toString();
  }

  // -- Visualization & Scoring --
  function createPlayerFilterButtons(): void {
    if (!playerFilterButtonsElement) return;
    
    playerFilterButtonsElement.innerHTML = '';
    
    // All button
    const allButton = document.createElement('div');
    allButton.className = 'player-filter-button all-button' + (selectedFilter === 'all' ? ' active' : '');
    allButton.textContent = 'All';
    allButton.onclick = () => {
      selectedFilter = 'all';
      createCollectivePlacementsChart();
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
        selectedFilter = p;
        createCollectivePlacementsChart();
      };
      
      playerFilterButtonsElement.appendChild(btn);
    });
  }

  function createCollectivePlacementsChart(): void {
    if (!collectivePlacementsContainerElement) return;
    
    collectivePlacementsContainerElement.innerHTML = '';
    nextZIndex = 100;
    
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
    yAxisArrow.innerHTML = `
      <div class="arrow-head arrow-top"></div>
      <div class="arrow-head arrow-bottom"></div>
    `;
    chartContainer.appendChild(yAxisArrow);
    
    // X axis arrow
    const xAxisArrow = document.createElement('div');
    xAxisArrow.className = 'axis-arrow x-axis-arrow';
    xAxisArrow.style.position = 'absolute';
    xAxisArrow.style.top = '50%';
    xAxisArrow.style.left = '50px';
    xAxisArrow.style.right = '50px';
    xAxisArrow.style.height = '2px';
    xAxisArrow.style.transform = 'translateY(-50%)';
    xAxisArrow.style.backgroundColor = '#4c2c69';
    xAxisArrow.style.pointerEvents = 'none';
    xAxisArrow.innerHTML = `
      <div class="arrow-head arrow-left"></div>
      <div class="arrow-head arrow-right"></div>
    `;
    chartContainer.appendChild(xAxisArrow);
    
    collectivePlacementsContainerElement.appendChild(chartContainer);
    
    // Show pins
    const isFiltering = (selectedFilter !== 'all');
    const selectedP = isFiltering ? selectedFilter : null;
    
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
          pin.addEventListener('click', () => bringPinToFront(pin as HTMLElement));
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
        pin.style.zIndex = '10';
        
        if (placer === person) {
          pin.style.boxShadow = '0 0 0 3px white, 2px 2px 5px rgba(0,0,0,0.3)';
          pin.style.zIndex = '20';
        } else {
          pin.style.transform = 'translate(-50%, -50%) scale(0.8)';
        }
        
        pin.addEventListener('click', () => bringPinToFront(pin as HTMLElement));
        chartContainer.appendChild(pin);
      });
    });
    
    // Adjust the y-axis arrow
    setTimeout(() => {
      adjustYAxisArrowForChart(chartContainer);
    }, 0);
    
    // If filtering by a specific player, show a scoreboard
    if (isFiltering) {
      const sp = selectedFilter;
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
        
        const playerScores: PlayerScore[] = [];
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
        
        const header = document.createElement('tr');
        const rankH = document.createElement('th');
        rankH.textContent = 'Rank';
        const playerH = document.createElement('th');
        playerH.textContent = 'Player';
        const scoreH = document.createElement('th');
        scoreH.textContent = 'Points';
        header.appendChild(rankH);
        header.appendChild(playerH);
        header.appendChild(scoreH);
        scoreTable.appendChild(header);
        
        playerScores.forEach((s, i) => {
          const row = document.createElement('tr');
          if (i === 0) row.classList.add('winner');
          
          const rankTd = document.createElement('td');
          rankTd.textContent = (i + 1).toString();
          
          const playerTd = document.createElement('td');
          playerTd.textContent = s.player;
          
          const scoreTd = document.createElement('td');
          scoreTd.textContent = s.score + ' points';
          
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

  function adjustYAxisArrowForChart(container: HTMLElement): void {
    const yAxisEndLabel = container.querySelector('.y-axis-end');
    const yAxisStartLabel = container.querySelector('.y-axis-start');
    const yAxisArrow = container.querySelector('.y-axis-arrow');
    
    if (!yAxisEndLabel || !yAxisStartLabel || !yAxisArrow) return;
    
    const margin = 5;
    const containerRect = container.getBoundingClientRect();
    const endRect = yAxisEndLabel.getBoundingClientRect();
    const startRect = yAxisStartLabel.getBoundingClientRect();
    
    const arrowTop = (endRect.bottom - containerRect.top) + margin;
    const arrowBottom = (containerRect.bottom - startRect.top) + margin;
    
    (yAxisArrow as HTMLElement).style.top = arrowTop + 'px';
    (yAxisArrow as HTMLElement).style.bottom = arrowBottom + 'px';
  }

  function calculateFinalScores(): Record<string, number> {
    const scores: Record<string, number> = {};
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

  // -- Helper Functions --
  function calculateDistance(a: Coordinate, b: Coordinate): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function getContrastYIQ(hexcolor: string): number {
    if (hexcolor.charAt(0) === '#') hexcolor = hexcolor.substr(1);
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);
    return ((r * 299) + (g * 587) + (b * 114)) / 1000;
  }

  function handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      addPlayer();
    }
  }
</script>

<style>
  /* Global Styles */
  :global(*) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
  :global(body) {
    background-color: #f9f9f9;
    color: #4c2c69;
    line-height: 1.6;
    padding: 10px;
  }
  :global(h1), :global(h2), :global(h3) {
    margin-bottom: 10px;
    color: #4c2c69;
    font-size: 1.5em;
  }
  :global(h1) {
    font-size: 1.8em;
  }

  /* Container for the game */
  .container {
    max-width: 600px;
    margin: 0 auto;
    padding: 10px;
    background-color: white;
    border-radius: 10px;
    box-shadow: 0 0 15px rgba(0,0,0,0.1);
  }

  /* Section styles */
  .section {
    margin-bottom: 15px;
    padding: 12px;
    border-radius: 8px;
  }

  /* Game setup section */
  .setup-section {
    background-color: #fdc30f;
  }

  /* Game play section */
  .game-section {
    background-color: white;
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
  .final-scores-section :global(table) {
    background-color: white;
    color: #4c2c69;
  }
  .final-scores-section :global(th) {
    background-color: #3891a6;
    color: white;
  }
  .final-scores-section :global(tr:nth-child(odd)) {
    background-color: #f2f2f2;
  }
  .final-scores-section :global(tr:nth-child(even)) {
    background-color: white;
  }
  .final-scores-section :global(.winner) {
    background-color: #fdc30f;
    color: #4c2c69;
    font-weight: bold;
  }

  /* Form styles */
  .form-group {
    margin-bottom: 15px;
  }
  label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  }
  input[type="text"] {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
  }

  /* Player list styles */
  .players-list {
    margin: 20px 0;
  }
  .player-item {
    background-color: #a6d3a0;
    padding: 10px;
    margin-bottom: 10px;
    border-radius: 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .player-item span {
    flex-grow: 1;
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
  button.secondary {
    background-color: #db5461;
  }
  button.secondary:hover {
    background-color: #c14853;
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
  .pin, :global(.pin) {
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
  
  /* Final placement chart pins */
  :global(#collective-placements-container .pin) {
    position: absolute;
    transform: translate(-50%, -50%);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 5;
  }
  
  /* Placed pins in graph container */
  :global(.graph-container .pin) {
    position: absolute;
    transform: translate(-50%,-50%);
    z-index: 10;
    margin: 0;
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

  /* Scoreboard tables */
  :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 15px 0;
    font-size: 14px;
  }
  :global(th), :global(td) {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }
  :global(th) {
    background-color: #3891a6;
    color: white;
  }
  :global(tr:nth-child(even)) {
    background-color: #f2f2f2;
  }
  :global(.winner) {
    background-color: #fdc30f;
    font-weight: bold;
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

  /* Final scoreboard filters */
  :global(.player-filter-container) {
    background-color: white;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 15px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  :global(.player-filter-heading) {
    text-align: center;
    margin-bottom: 12px;
    color: #4c2c69;
    font-weight: bold;
    font-size: 16px;
  }
  :global(.player-filter-buttons) {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }
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

  /* Responsive styles */
  @media (min-width: 768px) {
    .container {
      max-width: 800px;
      padding: 15px;
    }
    .section {
      padding: 15px;
      margin-bottom: 20px;
    }
    :global(.axis-label) {
      font-size: 13px;
      max-width: 90px;
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
    :global(table) {
      font-size: 14px;
    }
    :global(.player-filter-button) {
      font-size: 13px;
      padding: 6px 12px;
    }
  }
  @media (max-width: 480px) {
    .container {
      padding: 8px;
    }
    .section {
      padding: 10px;
      margin-bottom: 15px;
    }
    h1 {
      font-size: 24px;
    }
    h2 {
      font-size: 20px;
    }
    button {
      padding: 8px 16px;
      font-size: 14px;
    }
    :global(.axis-label) {
      font-size: 10px;
      max-width: 80px;
    }
    :global(.x-axis-start) {
      left: 5px;
    }
    :global(.x-axis-end) {
      right: 5px;
    }
  }
</style>

<div class="container">
  <h1>Plot Twist!</h1>

  <!-- Setup Section -->
  {#if setupSectionVisible}
    <div class="section setup-section">
      <h2>Player Setup</h2>
      <div class="instructions">
        <p>Enter the names of all players who will participate.</p>
      </div>
      <div class="form-group">
        <label for="player-name">Player Name:</label>
        <input type="text" id="player-name" placeholder="Enter player name" 
               bind:value={playerNameInput} on:keydown={handleKeyDown} />
      </div>
      <button on:click={addPlayer}>Add Player</button>
      <div class="players-list">
        {#each players as player, i}
          <div class="player-item">
            <div style="margin-right: 10px;">{i + 1}.</div>
            <span>{player}</span>
            <button class="secondary" style="padding: 5px 10px;" on:click={() => removePlayer(i)}>Remove</button>
          </div>
        {/each}
      </div>
      <div class="button-group">
        <button on:click={startGame} disabled={startGameDisabled}>Start Game</button>
        <button on:click={clearPlayers} class="secondary">Clear All</button>
      </div>
    </div>
  {/if}

  <!-- Game Play Section -->
  {#if gameSectionVisible}
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
        <button on:click={confirmPlacement} disabled={confirmPlacementDisabled}>Confirm Placement</button>
      </div>
    </div>
  {/if}

  <!-- Final Scores Section -->
  {#if finalScoresSectionVisible}
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
            <div style="text-align: center; font-size: 18px; margin: 15px 0;">
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
      
      <h3 style="margin-top:30px; color:white;">Everyone's Placements</h3>

      <!-- Player filter buttons -->
      <div class="player-filter-container">
        <div class="player-filter-heading">View where people placed:</div>
        <div class="player-filter-buttons" bind:this={playerFilterButtonsElement}></div>
      </div>

      <div id="collective-placements-container" 
           bind:this={collectivePlacementsContainerElement}
           style="background-color:white; border-radius:8px; padding:12px; margin-bottom:15px;">
      </div>

      <div style="text-align:center; margin-top:15px; margin-bottom:15px;">
        <p style="color:white; font-size:14px; margin-bottom:8px;">
          Thanks for playing Plot Twist, please give us some feedback
        </p>
        <p style="margin-top:8px;">
          <a href="https://forms.gle/P7ZFndmYZTRCye8i9" target="_blank"
             style="color:white; text-decoration:underline;">
            https://forms.gle/YL3cLa2v239HMNGe6
          </a>
        </p>
      </div>

      <div class="button-group" style="justify-content:center;">
        <button on:click={resetGame}>Play Again</button>
      </div>
    </div>
  {/if}
</div> 