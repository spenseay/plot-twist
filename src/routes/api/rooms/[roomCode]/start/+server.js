export async function POST({ params, request }) {
    const { roomCode } = params;
    
    try {
      const body = await request.json();
      const { hostName } = body;
      
      // Verify room exists
      const roomRef = ref(database, `rooms/${roomCode}`);
      const snapshot = await get(roomRef);
      
      if (!snapshot.exists()) {
        return json({ error: 'Room not found' }, { status: 404 });
      }
      
      const roomData = snapshot.val();
      
      // Check if requester is the host by looking in the players object
      if (!roomData.players || 
          !roomData.players[hostName] || 
          !roomData.players[hostName].isHost) {
        return json({ error: 'Only the host can start the game' }, { status: 403 });
      }
      
      // Start the game
      await update(roomRef, {
        status: 'playing',
        startedAt: Date.now()
      });
      
      return json({ success: true });
    } catch (error) {
      console.error('Error starting game:', error);
      return json({ error: 'Server error' }, { status: 500 });
    }
  }