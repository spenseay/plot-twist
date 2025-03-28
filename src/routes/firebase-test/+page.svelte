<script>
    import { onMount } from 'svelte';
    import { database } from '$lib/firebase/config.js';
    import { ref, onValue } from 'firebase/database';
    
    let testValue = 'Loading...';
    let isConnected = false;
    
    onMount(() => {
      // Create a simple test value in Firebase
      const testRef = ref(database, 'test');
      
      // Try to read the value
      const unsubscribe = onValue(testRef, (snapshot) => {
        if (snapshot.exists()) {
          testValue = JSON.stringify(snapshot.val());
          isConnected = true;
        } else {
          testValue = 'No test data found - connection works but no data exists';
          isConnected = true;
        }
      }, (error) => {
        console.error('Database error:', error);
        testValue = 'Error connecting to database: ' + error.message;
      });
      
      return unsubscribe;
    });
  </script>
  
  <div class="container">
    <h1>Firebase Connection Test</h1>
    
    <div class="status-box">
      <h2>Connection Status:</h2>
      <div class="status {isConnected ? 'connected' : 'disconnected'}">
        {isConnected ? '✅ Connected to Firebase' : '❌ Not connected'}
      </div>
    </div>
    
    <div class="data-box">
      <h2>Test Value from Database:</h2>
      <div class="value">{testValue}</div>
    </div>
    
    <p class="note">
      If you see "Connected to Firebase" above, your connection is working!
    </p>
  </div>
  
  <style>
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background: linear-gradient(135deg, #f9f9f9 0%, #e8f2f5 100%);
      border-radius: 10px;
      box-shadow: 0 0 15px rgba(0,0,0,0.1);
      border: 2px solid #4c2c69;
    }
    
    h1 {
      color: #4c2c69;
      margin-bottom: 20px;
    }
    
    h2 {
      color: #3891a6;
      font-size: 1.2em;
      margin-bottom: 10px;
    }
    
    .status-box, .data-box {
      margin-bottom: 20px;
      padding: 15px;
      border-radius: 8px;
      background-color: #f5f5f5;
    }
    
    .status {
      font-size: 1.2em;
      padding: 10px;
      border-radius: 5px;
    }
    
    .connected {
      background-color: #a6d3a0;
      color: #2a6b34;
    }
    
    .disconnected {
      background-color: #db5461;
      color: white;
    }
    
    .value {
      font-size: 1.2em;
      padding: 10px;
      background-color: #f9f9f9;
      border-radius: 5px;
      border-left: 4px solid #3891a6;
      word-break: break-all;
    }
    
    .note {
      font-style: italic;
      color: #666;
    }
  </style>