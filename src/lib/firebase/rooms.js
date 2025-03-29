// src/lib/firebase/rooms.js
import { database } from './config.js';
import { ref, set, get, update, onValue } from 'firebase/database';
import { selectRandomAxes } from '$lib/utils/axisUtils.js';
import { axisOptions } from '$lib/data/axisOptions.js';
import { calculateDistance } from '$lib/utils/mathUtils.js';

// Generate a random room code (4 uppercase letters/numbers)
export function generateRoomCode() {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded similar-looking characters
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

// Create a new game room
export async function createRoom(hostName) {
  try {
    // Generate a room code
    let roomCode = generateRoomCode();
    let attempts = 0;
    const maxAttempts = 5;
    
    // Check if room code already exists
    while (attempts < maxAttempts) {
      const existingRoom = await get(ref(database, `rooms/${roomCode}`));
      if (!existingRoom.exists()) {
        break;
      }
      roomCode = generateRoomCode();
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      return { success: false, error: 'Failed to generate a unique room code' };
    }
    
    // Generate random axes
    const randomAxes = selectRandomAxes(axisOptions);
    
    // Generate initial game state
    const roomData = {
      roomCode,
      createdAt: Date.now(),
      hostName: hostName,
      status: 'waiting', // waiting, playing, completed
      players: {
        [hostName]: {
          isHost: true,
          joinedAt: Date.now(),
          hasSubmitted: false
        }
      },
      settings: {
        axes: randomAxes
      },
      placements: {
        [hostName]: {} // Initialize empty placements for host
      }
    };
    
    // Create the room
    const roomRef = ref(database, `rooms/${roomCode}`);
    await set(roomRef, roomData);
    
    return { roomCode, success: true };
  } catch (error) {
    console.error('Error creating room:', error);
    return { success: false, error: error.message };
  }
}

// Join an existing room
export async function joinRoom(roomCode, playerName) {
  try {
    // Format room code to uppercase
    roomCode = roomCode.toUpperCase();
    
    // Check if room exists
    const roomRef = ref(database, `rooms/${roomCode}`);
    const snapshot = await get(roomRef);
    
    if (!snapshot.exists()) {
      return { success: false, error: 'Room not found' };
    }
    
    const roomData = snapshot.val();
    
    // Check if game already started
    if (roomData.status === 'playing' || roomData.status === 'completed') {
      return { success: false, error: 'Game already in progress' };
    }
    
    // Check if player name is taken
    if (roomData.players && roomData.players[playerName]) {
      return { success: false, error: 'That name is already taken' };
    }
    
    // Add player to room
    const playerRef = ref(database, `rooms/${roomCode}/players/${playerName}`);
    await set(playerRef, {
      isHost: false,
      joinedAt: Date.now(),
      hasSubmitted: false
    });
    
    // Add empty placements object for this player
    const placementsRef = ref(database, `rooms/${roomCode}/placements/${playerName}`);
    await set(placementsRef, {});
    
    return { roomCode, success: true };
  } catch (error) {
    console.error('Error joining room:', error);
    return { success: false, error: error.message };
  }
}

// Subscribe to room updates
export function subscribeToRoom(roomCode, callback) {
  const roomRef = ref(database, `rooms/${roomCode}`);
  return onValue(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ exists: true, data: snapshot.val() });
    } else {
      callback({ exists: false });
    }
  }, (error) => {
    console.error('Error subscribing to room:', error);
    callback({ exists: false, error: error.message });
  });
}

// Start game
export async function startGame(roomCode) {
  try {
    const roomRef = ref(database, `rooms/${roomCode}`);
    await update(roomRef, {
      status: 'playing',
      startedAt: Date.now()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error starting game:', error);
    return { success: false, error: error.message };
  }
}