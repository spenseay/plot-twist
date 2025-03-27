<script>
    import { createEventDispatcher } from 'svelte';
    import { getContrastYIQ } from '$lib/utils/colorUtils.js';
    import gameStore from '$lib/stores/gameStore.js';
  
    // Props
    export let showAllButton = true;
    export let allButtonText = 'All';
    export let buttonColors = []; // Optional array of colors to override default colors
    export let containerClass = ''; // Additional class for the container
  
    // Event dispatcher
    const dispatch = createEventDispatcher();
  
    // Game store data
    $: players = $gameStore?.players || [];
    $: selectedFilter = $gameStore?.selectedFilter || 'all';
  
    // Default player colors if not provided via props
    const defaultColors = [
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
  
    // Get color for a player
    function getPlayerColor(index) {
      if (buttonColors && buttonColors.length > 0) {
        return buttonColors[index % buttonColors.length];
      }
      return defaultColors[index % defaultColors.length];
    }
  
    // Handle filter button click
    function setFilter(filter) {
      // Update the store
      gameStore.update(state => ({
        ...state,
        selectedFilter: filter
      }));
      
      // Dispatch event to notify parent component
      dispatch('filterChanged', { filter });
    }
  </script>
  
  <div class="filter-buttons-container {containerClass}">
    {#if showAllButton}
      <button 
        class="filter-button all-button {selectedFilter === 'all' ? 'active' : ''}"
        on:click={() => setFilter('all')}
      >
        {allButtonText}
      </button>
    {/if}
    
    {#each players as player, i}
      <button 
        class="filter-button {selectedFilter === player ? 'active' : ''}"
        style="background-color: {getPlayerColor(i)}; 
               color: {getContrastYIQ(getPlayerColor(i).replace('#', '')) < 128 ? 'white' : '#4c2c69'};"
        on:click={() => setFilter(player)}
      >
        {player}
      </button>
    {/each}
  </div>
  
  <style>
    .filter-buttons-container {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
      margin: 10px 0;
    }
    
    .filter-button {
      padding: 6px 10px;
      border-radius: 6px;
      border: 2px solid transparent;
      cursor: pointer;
      font-weight: bold;
      transition: all 0.2s ease;
      min-width: 70px;
      text-align: center;
      font-size: 12px;
      background-color: #f0f0f0;
      color: #4c2c69;
    }
    
    .filter-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 3px 5px rgba(0,0,0,0.2);
    }
    
    .filter-button.active {
      border: 2px solid #4c2c69;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    
    .all-button {
      background-color: #4c2c69;
      color: white;
    }
    
    .all-button.active {
      border: 2px solid #fdc30f;
    }
    
    /* Responsive styles */
    @media (min-width: 768px) {
      .filter-button {
        font-size: 13px;
        padding: 6px 12px;
      }
    }
    
    @media (max-width: 480px) {
      .filter-button {
        padding: 5px 8px;
        font-size: 11px;
        min-width: 60px;
      }
    }
  </style>