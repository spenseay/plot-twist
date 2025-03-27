<script>
    import { onMount } from 'svelte';
    import { adjustYAxisArrowForChart } from '$lib/utils/axisUtils.js';
    
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
    
    <!-- X axis labels -->
    <div class="axis-label x-axis-start">{axes.x.start}</div>
    <div class="axis-label x-axis-end">{axes.x.end}</div>
    
    <!-- Y axis labels -->
    <div class="axis-label y-axis-start">{axes.y.start}</div>
    <div class="axis-label y-axis-end">{axes.y.end}</div>
    
    <!-- Y axis arrow -->
    <div class="axis-arrow y-axis-arrow">
      <div class="arrow-head arrow-top"></div>
      <div class="arrow-head arrow-bottom"></div>
    </div>
    
    <!-- X axis arrow -->
    <div class="axis-arrow x-axis-arrow">
      <div class="arrow-head arrow-left"></div>
      <div class="arrow-head arrow-right"></div>
    </div>
    
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
    
    /* X axis labels */
    .x-axis-start {
      left: 10px;
      bottom: calc(50% + 15px);
    }
    
    .x-axis-end {
      right: 10px;
      bottom: calc(50% + 15px);
    }
    
    /* Y axis labels */
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
    
    /* Y axis arrow */
    .y-axis-arrow {
      position: absolute;
      pointer-events: none;
      left: 50%;
      width: 2px;
      transform: translateX(-50%);
      background-color: #4c2c69;
      top: 30px;
      bottom: 30px;
    }
    
    /* X axis arrow */
    .x-axis-arrow {
      position: absolute;
      pointer-events: none;
      top: 50%;
      left: 50px;
      right: 50px;
      height: 2px;
      transform: translateY(-50%);
      background-color: #4c2c69;
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
    
    /* Responsive styles */
    @media (min-width: 768px) {
      .axis-label {
        font-size: 13px;
      }
    }
    
    @media (max-width: 480px) {
      .axis-label {
        font-size: 10px;
        max-width: 80px;
      }
      
      .x-axis-start {
        left: 5px;
      }
      
      .x-axis-end {
        right: 5px;
      }
    }
  </style>