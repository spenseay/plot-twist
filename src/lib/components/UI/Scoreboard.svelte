<script>
  import { createEventDispatcher } from 'svelte';

  // Props
  export let scores = []; // Array of {player, score} objects
  export let showWinnerAnnouncement = true;
  export let showRank = true;
  export let sortScores = true; // Whether to sort scores by highest first
  export let customClasses = ''; // Additional classes for the table
  export let headerLabels = { // Customizable header labels
    rank: 'Rank',
    player: 'Player',
    score: 'Score'
  };
  export let pointsLabel = 'points'; // Label appended to scores
  export let winnerAnnouncementTemplate = (winner) => 
    `${winner.player} knows their friends best with ${winner.score} ${pointsLabel}!`;
  export let disableRowClick = false; // NEW: Option to disable row click events

  // Event dispatcher
  const dispatch = createEventDispatcher();
  
  // Sort scores if needed
  $: sortedScores = sortScores 
    ? [...scores].sort((a, b) => b.score - a.score) 
    : scores;
    
  // Winner is the first player in sorted scores (or null if no scores)
  $: winner = sortedScores.length > 0 ? sortedScores[0] : null;
  
  // Handle row click event
  function handleRowClick(player, index) {
    if (!disableRowClick) {
      dispatch('rowClick', { player, index });
    }
  }
</script>

<div class="scoreboard-component">
  {#if sortedScores.length > 0}
    <table class="scoreboard-table {customClasses}">
      <thead>
        <tr>
          {#if showRank}
            <th class="first-th">{headerLabels.rank}</th>
          {:else}
            <th class="first-th">{headerLabels.player}</th>
          {/if}
          {#if showRank}
            <th>{headerLabels.player}</th>
          {/if}
          <th class="last-th">{headerLabels.score}</th>
        </tr>
      </thead>
      <tbody>
        {#each sortedScores as item, i}
          <tr 
            class={i === 0 ? 'winner' : ''}
            class:clickable={!disableRowClick}
            on:click={() => handleRowClick(item.player, i)}
          >
            {#if showRank}
              <td>{i + 1}</td>
            {/if}
            <td>{item.player}</td>
            <td>{item.score} {pointsLabel}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    
    {#if showWinnerAnnouncement && winner}
      <div class="winner-announcement">
        <strong>{winnerAnnouncementTemplate(winner)}</strong>
      </div>
    {/if}
  {:else}
    <div class="no-scores">
      <p>No scores available yet</p>
    </div>
  {/if}
</div>

<style>
  /* Scoreboard styles */
  .scoreboard-table {
    width: 100%;
    border-collapse: collapse;
    margin: 15px 0;
    font-size: 16px; /* INCREASED from 14px */
    background-color: white;
    color: #4c2c69;
    border-radius: 8px; /* ADDED rounded corners */
    overflow: hidden; /* NEEDED for border-radius to work */
  }
  
  .scoreboard-table th, 
  .scoreboard-table td {
    border: 1px solid #ddd;
    padding: 10px; /* INCREASED from 8px */
    text-align: left;
  }
  
  /* Fix for rounded corners on header row */
  .scoreboard-table th.first-th {
    border-top-left-radius: 9px;
  }
  
  .scoreboard-table th.last-th {
    border-top-right-radius: 9px;
  }
  
  .scoreboard-table th {
    background-color: #3891a6;
    color: white;
  }
  
  .scoreboard-table tr:nth-child(even) {
    background-color: #f2f2f2;
  }
  
  .scoreboard-table tr:nth-child(odd) {
    background-color: white;
  }
  
  .scoreboard-table tr.winner {
    background-color: #fdc30f;
    color: #4c2c69;
    font-weight: bold;
  }
  
  /* Add a hover effect for rows only if clickable */
  .scoreboard-table tr.clickable:hover:not(thead tr) {
    background-color: #e6e6e6;
    cursor: pointer;
  }
  
  /* Winner announcement */
  .winner-announcement {
    text-align: center;
    font-size: 18px;
    margin: 15px 0;
    background-color: #fdc30f; /* MATCHING YELLOW COLOR */
    color: #4c2c69;
    padding: 10px;
    border-radius: 8px;
    font-weight: bold;
  }
  
  /* No scores message */
  .no-scores {
    text-align: center;
    padding: 20px;
    background-color: #f2f2f2;
    border-radius: 8px;
    margin: 15px 0;
  }
  
  /* Responsive styles */
  @media (max-width: 480px) {
    .scoreboard-table {
      font-size: 14px;
    }
    
    .scoreboard-table th, 
    .scoreboard-table td {
      padding: 8px;
    }
    
    .winner-announcement {
      font-size: 16px;
      padding: 8px;
    }
  }
</style>