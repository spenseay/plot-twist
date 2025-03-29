<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import SetupSection from '$lib/components/SetupSection.svelte';
  import GameSection from '$lib/components/GameSection.svelte';
  import ScoreSection from '$lib/components/ScoreSection.svelte';
  import { axisOptions } from '$lib/data/axisOptions.js';
  import { selectRandomAxes } from '$lib/utils/axisUtils.js';
  import gameStore, { actions } from '$lib/stores/gameStore.js';

  // Navigate back to main menu
  function goToMainMenu() {
    goto('/');
  }

  // Use the $ syntax for auto-subscription
  $: gameState = $gameStore;
  $: setupSectionVisible = gameState?.setupSectionVisible ?? true;
  $: gameSectionVisible = gameState?.gameSectionVisible ?? false;
  $: finalScoresSectionVisible = gameState?.finalScoresSectionVisible ?? false;
  $: currentTurn = gameState?.currentTurn || 0;
  $: players = gameState?.players || [];

  onMount(() => {
    // Reset the game when component mounts to ensure clean state
    actions.resetGame();
    
    gameStore.update(state => ({
      ...state,
      axes: selectRandomAxes(axisOptions)
    }));
  });

  // -- Game Logic --
  function startGame() {
    actions.startGame();
  }

  function handleConfirmPlacement(event) {
    const { placement, player } = event.detail;
    
    // Determine if this is the last turn BEFORE updating the store
    const isLastTurn = currentTurn + 1 >= players.length;
    
    // Update the store with new placement
    gameStore.update(state => {
      const newPlacements = { ...state.placements };
      newPlacements[player] = placement;
      return {
        ...state,
        placements: newPlacements,
        currentTurn: state.currentTurn + 1
      };
    });
    
    // Use the pre-determined flag to decide what to do next
    if (isLastTurn) {
      showFinalScores();
    }
  }

  function showFinalScores() {
    // Update the store
    gameStore.update(state => ({
      ...state,
      gameSectionVisible: false,
      finalScoresSectionVisible: true,
      selectedFilter: 'all'
    }));
  }

  function resetGame() {
    actions.resetGame();
  }
</script>

<div class="container">
  <div class="header">
    <button class="back-button" on:click={goToMainMenu}>← Menu</button>
    <h1>Plot Twist!</h1>
    <div class="spacer"></div> <!-- For centered title -->
  </div>

  <!-- Setup Section -->
  {#if setupSectionVisible}
    <SetupSection on:startGame={startGame} />
  {/if}

  <!-- Game Play Section -->
  {#if gameSectionVisible}
    <GameSection on:confirmPlacement={handleConfirmPlacement} />
  {/if}

  <!-- Final Scores Section -->
  {#if finalScoresSectionVisible}
    <ScoreSection on:resetGame={resetGame} />
  {/if}
</div>

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
  
  /* Header with back button */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 15px;
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
    width: 70px; /* Approximate width to match back button */
  }

  /* Responsive styles */
  @media (min-width: 768px) {
    .container {
      max-width: 800px;
      padding: 15px;
    }
  }
  
  @media (max-width: 480px) {
    .container {
      padding: 8px;
    }
    
    h1 {
      font-size: 24px;
    }
    /*
    h2 {
      font-size: 20px;
    }
      */
    
    .back-button {
      font-size: 0.9rem;
    }
    
    .spacer {
      width: 60px;
    }
  }
</style>