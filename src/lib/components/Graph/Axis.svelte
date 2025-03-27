<script>
    // Props
    export let type = 'x'; // 'x' or 'y'
    export let start = ''; // Start label text
    export let end = '';   // End label text
    
    // Classes for positioning
    $: startClass = type === 'x' ? 'x-axis-start' : 'y-axis-start';
    $: endClass = type === 'x' ? 'x-axis-end' : 'y-axis-end';
    $: arrowClass = type === 'x' ? 'x-axis-arrow' : 'y-axis-arrow';
    
    // Computed arrow style for positioning
    $: arrowStyle = type === 'x' 
      ? 'top: 50%; left: 50px; right: 50px; height: 2px; transform: translateY(-50%);' 
      : 'left: 50%; width: 2px; transform: translateX(-50%); top: 30px; bottom: 30px;';
    
    // Arrow head classes
    $: arrowHeadClasses = type === 'x' 
      ? ['arrow-head arrow-left', 'arrow-head arrow-right'] 
      : ['arrow-head arrow-top', 'arrow-head arrow-bottom'];
  </script>
  
  <!-- Axis labels -->
  <div class="axis-label {startClass}">{start}</div>
  <div class="axis-label {endClass}">{end}</div>
  
  <!-- Axis arrow line -->
  <div class="axis-arrow {arrowClass}" style={arrowStyle}>
    <div class={arrowHeadClasses[0]}></div>
    <div class={arrowHeadClasses[1]}></div>
  </div>
  
  <style>
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
    
    /* Axis arrow line */
    .axis-arrow {
      position: absolute;
      pointer-events: none;
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