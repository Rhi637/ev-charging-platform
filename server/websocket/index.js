import { generateId } from '../utils/helpers.js';
import db from '../config/database.js';

// Store connected clients
const clients = new Map();

// Simulation intervals
let simulationInterval = null;

function setupWebSocket(io) {
  io.on('connection', (socket) => {
    console.log('客户端已连接:', socket.id);

    // Register client with role
    socket.on('register', (data) => {
      clients.set(socket.id, { role: data.role, userId: data.userId });
      console.log(`客户端 ${socket.id} 注册为 ${data.role}`);
    });

    // Join station room for real-time updates
    socket.on('join-station', (stationId) => {
      socket.join(`station:${stationId}`);
    });

    // Leave station room
    socket.on('leave-station', (stationId) => {
      socket.leave(`station:${stationId}`);
    });

    // Remote control: start charging
    socket.on('remote-start', (data) => {
      // Broadcast to station room
      io.to(`station:${data.stationId}`).emit('charging-started', {
        stationId: data.stationId,
        plugId: data.plugId,
        timestamp: new Date().toISOString(),
      });
    });

    // Remote control: stop charging
    socket.on('remote-stop', (data) => {
      io.to(`station:${data.stationId}`).emit('charging-stopped', {
        stationId: data.stationId,
        plugId: data.plugId,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      clients.delete(socket.id);
      console.log('客户端断开连接:', socket.id);
    });
  });

  // Start simulation
  startSimulation(io);
}

function startSimulation(io) {
  // Every 5 seconds, simulate station data updates
  simulationInterval = setInterval(() => {
    try {
      const stations = db.prepare('SELECT id, status, current_power, temperature FROM stations WHERE status = ?').all('online');

      stations.forEach(station => {
        // Simulate power fluctuation
        const powerDelta = (Math.random() - 0.5) * 10;
        const newPower = Math.max(0, Math.min(station.current_power + powerDelta, 120));
        const newTemp = Math.max(20, Math.min(station.temperature + (Math.random() - 0.5) * 2, 45));

        db.prepare('UPDATE stations SET current_power = ?, temperature = ? WHERE id = ?').run(
          Math.round(newPower * 10) / 10,
          Math.round(newTemp * 10) / 10,
          station.id
        );

        // Emit update to all admin clients
        io.emit('station-update', {
          stationId: station.id,
          currentPower: Math.round(newPower * 10) / 10,
          temperature: Math.round(newTemp * 10) / 10,
          timestamp: new Date().toISOString(),
        });
      });

      // Simulate active charging session progress
      const activeSessions = db.prepare(`
        SELECT cs.id, cs.user_id, cs.station_id, cs.start_time, cs.energy_kwh, s.price_per_kwh
        FROM charging_sessions cs
        JOIN stations s ON cs.station_id = s.id
        WHERE cs.status = 'charging'
      `).all();

      activeSessions.forEach(session => {
        const elapsed = (Date.now() - new Date(session.start_time).getTime()) / 1000;
        const energy = session.energy_kwh + Math.random() * 0.5;
        const cost = energy * session.price_per_kwh * 1.1; // with service fee

        db.prepare('UPDATE charging_sessions SET energy_kwh = ? WHERE id = ?').run(
          Math.round(energy * 100) / 100,
          session.id
        );

        io.emit('session-progress', {
          sessionId: session.id,
          userId: session.user_id,
          stationId: session.station_id,
          energyKwh: Math.round(energy * 100) / 100,
          cost: Math.round(cost * 100) / 100,
          elapsedSeconds: Math.round(elapsed),
          timestamp: new Date().toISOString(),
        });
      });
    } catch (err) {
      // Silently handle simulation errors
    }
  }, 5000);
}

function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
}

export { setupWebSocket, stopSimulation };
