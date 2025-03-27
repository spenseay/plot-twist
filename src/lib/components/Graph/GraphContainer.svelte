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
    
    <!-- Use the new Axis component for X and Y axes -->
    <Axis 
      type="x" 
      start={axes.x.start} 
      end={axes.x.end} 
      {containerRef} />
    
    <Axis 
      type="y" 
      start={axes.y.start} 
      end={axes.y.end} 
      {containerRef} />
    
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
      border-radius: 4px;
      background-color: white;
    }
  </style>