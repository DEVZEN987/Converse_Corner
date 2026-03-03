import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

socket.on('connect', () => {
  console.log('✅ Socket connected:', socket.id);
  
  // Register the user when socket connects
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (user._id) {
    socket.emit('register', user._id);
    console.log('📌 Socket registered with userId:', user._id);
  }
});

// ✅ Listen for kick event - User gets kicked out
socket.on('kicked', (data) => {
  console.log('🔴 KICKED FROM SERVER:', data);
  alert(data.message);
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  window.location.href = '/login';
});

socket.on('disconnect', (reason) => {
  console.log('🔴 Socket disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.error('❌ Socket error:', error);
});

export default socket;