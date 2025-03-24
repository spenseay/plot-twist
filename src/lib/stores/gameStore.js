// src/lib/stores/gameStore.js
import { writable } from 'svelte/store';
import { selectRandomAxes } from '$lib/utils/axisUtils.js';
import { axisOptions } from '$lib/data/axisOptions.js';

// Initial state
const initialState = {
  players: [],
  currentTurn: 0,
  placements: {},
  selectedFilter: 'all',
  setupSectionVisible: true,
  gameSectionVisible: false,
  finalScoresSectionVisible: false,
  nextZIndex: 100,
  allPinsPlaced: false,
  playerNameInput: '',
  axes: {
    x: { start: "", end: "" },
    y: { start: "", end: "" }
  }
};

// Create the writable store with initial state
const gameStore = writable(initialState);

// Actions
export const actions = {
  addPlayer: (playerName) => {
    gameStore.update(state => {
      if (!playerName.trim()) return state;
      if (state.players.includes(playerName)) return state;
      
      return {
        ...state,
        players: [...state.players, playerName],
        playerNameInput: ''
      };
    });
  },
  
  removePlayer: (index) => {
    gameStore.update(state => ({
      ...state,
      players: state.players.filter((_, i) => i !== index)
    }));
  },
  
  clearPlayers: () => {
    gameStore.update(state => ({
      ...state,
      players: []
    }));
  },
  
  startGame: () => {
    gameStore.update(state => {
      const newPlacements = {};
      state.players.forEach(p => { newPlacements[p] = {}; });
      
      return {
        ...state,
        setupSectionVisible: false,  // Explicitly set to false
        gameSectionVisible: true,    // Explicitly set to true
        finalScoresSectionVisible: false,
        placements: newPlacements,
        currentTurn: 0,
        axes: selectRandomAxes(axisOptions)
      };
    });
    
    // This would be called externally after the update
    // startPlayerTurn();
  },
  
  resetGame: () => {
    gameStore.update(state => ({
      ...state,
      players: [],
      currentTurn: 0,
      placements: {},
      selectedFilter: 'all',
      nextZIndex: 100,
      allPinsPlaced: false,
      setupSectionVisible: true,
      gameSectionVisible: false,
      finalScoresSectionVisible: false,
      playerNameInput: '',
      axes: selectRandomAxes(axisOptions)
    }));
  },

};

export default gameStore;