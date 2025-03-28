// src/lib/firebase/rooms.js
import { database } from './config.js';
import { ref, set, get, onValue } from 'firebase/database';
import { selectRandomAxes } from '$lib/utils/axisUtils.js';
import { axisOptions } from '$lib/data/axisOptions.js';

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
    
    // Generate initial game state
    const roomData = {
      roomCode,
      createdAt: Date.now(),
      hostName: hostName,
      status: 'waiting', // waiting, playing, completed
      players: {
        [hostName]: {
          isHost: true,
          joinedAt: Date.now()
        }
      },
      settings: {
        axes: selectRandomAxes(axisOptions)
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
    // Check if room exists
    const roomRef = ref(database, `rooms/${roomCode}`);
    const snapshot = await get(roomRef);
    
    if (!snapshot.exists()) {
      return { success: false, error: 'Room not found' };
    }
    
    const roomData = snapshot.val();
    
    // Check if game already started
    if (roomData.status === 'playing') {
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
      joinedAt: Date.now()
    });
    
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
  });
}