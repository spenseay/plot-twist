// src/lib/utils/axisUtils.js

/**
 * Adjust the Y-axis arrow based on label positions
 * @param {HTMLElement} container - The graph container element
 */
export function adjustYAxisArrow(container) {
    if (!container) return;
    
    const yAxisEndLabel = container.querySelector('.y-axis-end');
    const yAxisStartLabel = container.querySelector('.y-axis-start');
    const yAxisArrow = container.querySelector('.y-axis-arrow');
    
    if (!yAxisEndLabel || !yAxisStartLabel || !yAxisArrow) {
      console.log("Missing elements for Y-axis adjustment");
      return;
    }
  
    const margin = 5; // extra spacing so arrow doesn't overlap text
    const containerRect = container.getBoundingClientRect();
    const endRect = yAxisEndLabel.getBoundingClientRect();
    const startRect = yAxisStartLabel.getBoundingClientRect();
  
    // Distance from container's top to bottom of top label
    const arrowTop = (endRect.bottom - containerRect.top) + margin;
  
    // Distance from container's bottom to top of bottom label
    const arrowBottom = (containerRect.bottom - startRect.top) + margin;
  
    console.log("Y-Axis adjustment:", { arrowTop, arrowBottom });
  
    // Cast to HTMLElement before accessing style
    /** @type {HTMLElement} */ (yAxisArrow).style.top = arrowTop + 'px';
    /** @type {HTMLElement} */ (yAxisArrow).style.bottom = arrowBottom + 'px';
  }
  
  /**
   * Adjust the Y-axis arrow for the final scores chart
   * @param {HTMLElement} container - The chart container element
   */
  export function adjustYAxisArrowForChart(container) {
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
    
    // Cast to HTMLElement before accessing style
    /** @type {HTMLElement} */ (yAxisArrow).style.top = arrowTop + 'px';
    /** @type {HTMLElement} */ (yAxisArrow).style.bottom = arrowBottom + 'px';
  }
  
  /**
   * Select random axes from the given options
   * @param {Array<{start: string, end: string}>} axisOptions - Array of axis options
   * @returns {{x: {start: string, end: string}, y: {start: string, end: string}}} - Selected x and y axes
   */
  export function selectRandomAxes(axisOptions) {
    // Create a copy of axis options and shuffle it
    let arr = [...axisOptions];
    const shuffled = [...arr].map(() => {
      const j = Math.floor(Math.random() * arr.length);
      return arr.splice(j, 1)[0];
    });
    
    // Pick the first two for X and Y
    const xAxis = shuffled[0];
    const yAxis = shuffled[1] || shuffled[0]; // Fallback if we only have one option
    
    // Return the axes object
    const axes = {
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