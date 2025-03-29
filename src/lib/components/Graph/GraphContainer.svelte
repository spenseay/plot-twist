<!-- src/lib/components/Graph/GraphContainer.svelte -->
<script>
  import { onMount } from 'svelte';
  import { adjustYAxisArrowForChart } from '$lib/utils/axisUtils.js';
  import Axis from './Axis.svelte';
  
  // Props
  export let axes = { x: { start: "", end: "" }, y: { start: "", end: "" } };
  export let containerRef = null; // Reference to be bound to the container element
  export let forScoreSection = false; // Whether this is used in the score section or game section
  export let maxWidth = "350px"; // Maximum width of the graph container
  
  onMount(() => {
    // After rendering, adjust the y-axis arrow position based on label positions
    setTimeout(() => {
      if (containerRef) {
        adjustYAxisArrowForChart(containerRef);
      }
    }, 10);
  });
</script>

<div 
class="graph-container" 
class:score-section={forScoreSection}
bind:this={containerRef}
style="max-width: {maxWidth}">

<!-- Use the Axis component for X and Y axes -->
<Axis 
  type="x" 
  start={axes.x.start} 
  end={axes.x.end} />

<Axis 
  type="y" 
  start={axes.y.start} 
  end={axes.y.end} />

<!-- Slot for pins or other content -->
<slot></slot>
</div>

<style>
/* Graph container */
.graph-container {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  margin: 0 auto;
  border: 2px solid #4c2c69;
  border-radius: 8px; /* Increased from 4px for more rounded corners */
  background-color: white;
  box-shadow: 0 4px 8px rgba(76, 44, 105, 0.15); /* Added subtle shadow for depth */
}

/* Score section specific styling */
.score-section {
  box-shadow: 0 4px 12px rgba(76, 44, 105, 0.2); /* Enhanced shadow for score section */
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .graph-container {
    max-width: 100%;
    border-width: 2px;
    box-shadow: 0 3px 6px rgba(76, 44, 105, 0.2);
  }
}
</style>