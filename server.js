const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ⚙️ AUTHORIZED DEVICES DATABASE
const authorizedDevices = new Set([
    '9d389cebf6a08dbd',  // Honor Pad X9
    // Add more device IDs as you authorize customers
]);

// Logging
function log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
}

// ==========================================
// API ENDPOINTS
// ==========================================

/**
 * Check if device is authorized
 * GET /api/check-device?device_id=XXXXX
 */
app.get('/api/check-device', (req, res) => {
    const deviceId = req.query.device_id;
    const ip = req.ip || req.connection.remoteAddress;

    if (!deviceId) {
        log(`❌ Check failed: No device ID provided from ${ip}`);
        return res.status(400).json({ error: 'Device ID required' });
    }

    const isAuthorized = authorizedDevices.has(deviceId);

    log(`🔍 Authorization check: ${deviceId} from ${ip} → ${isAuthorized ? '✅ AUTHORIZED' : '❌ DENIED'}`);

    if (isAuthorized) {
        res.status(200).json({
            authorized: true,
            message: 'Device authorized'
        });
    } else {
        res.status(403).json({
            authorized: false,
            message: 'Device not authorized'
        });
    }
});

/**
 * Download APK (only for authorized devices)
 * GET /api/download-app?device_id=XXXXX
 */
app.get('/api/download-app', (req, res) => {
    const deviceId = req.query.device_id;
    const ip = req.ip || req.connection.remoteAddress;

    if (!deviceId) {
        log(`❌ Download failed: No device ID provided from ${ip}`);
        return res.status(400).send('Device ID required');
    }

    // Check authorization
    if (!authorizedDevices.has(deviceId)) {
        log(`❌ Download denied: Unauthorized device ${deviceId} from ${ip}`);
        return res.status(403).send('Device not authorized');
    }

    // Check if APK exists
    const apkPath = path.join(__dirname, 'apks', 'renacleandialyzer.apk');

    if (!fs.existsSync(apkPath)) {
        log(`❌ APK file not found: ${apkPath}`);
        return res.status(404).send('APK not found');
    }

    log(`📥 Download started: ${deviceId} from ${ip}`);

    // Send APK file
    res.download(apkPath, 'renacleandialyzer.apk', (err) => {
        if (err) {
            log(`❌ Download error for ${deviceId}: ${err.message}`);
        } else {
            log(`✅ Download completed: ${deviceId}`);
        }
    });
});

/**
 * Admin endpoint to authorize a device
 * POST /api/authorize-device?device_id=XXXXX&admin_key=SECRET
 */
app.post('/api/authorize-device', (req, res) => {
    const deviceId = req.query.device_id;
    const adminKey = req.query.admin_key;
    const ADMIN_KEY = 'sqm@2026'; // Change this!

    if (adminKey !== ADMIN_KEY) {
        log(`❌ Authorization failed: Invalid admin key`);
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!deviceId) {
        return res.status(400).json({ error: 'Device ID required' });
    }

    authorizedDevices.add(deviceId);
    log(`✅ Device authorized: ${deviceId}`);

    res.json({
        success: true,
        message: `Device ${deviceId} has been authorized`,
        total_devices: authorizedDevices.size
    });
});

/**
 * Admin endpoint to revoke device authorization
 * POST /api/revoke-device?device_id=XXXXX&admin_key=SECRET
 */
app.post('/api/revoke-device', (req, res) => {
    const deviceId = req.query.device_id;
    const adminKey = req.query.admin_key;
    const ADMIN_KEY = 'sqm@2026'; // Change this!

    if (adminKey !== ADMIN_KEY) {
        log(`❌ Revoke failed: Invalid admin key`);
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!deviceId) {
        return res.status(400).json({ error: 'Device ID required' });
    }

    const wasAuthorized = authorizedDevices.has(deviceId);
    authorizedDevices.delete(deviceId);
    
    log(`🚫 Device revoked: ${deviceId} (was authorized: ${wasAuthorized})`);

    res.json({
        success: true,
        message: `Device ${deviceId} authorization revoked`,
        total_devices: authorizedDevices.size
    });
});

/**
 * Get list of authorized devices (admin only)
 * GET /api/list-devices?admin_key=SECRET
 */
app.get('/api/list-devices', (req, res) => {
    const adminKey = req.query.admin_key;
    const ADMIN_KEY = 'sqm@2026'; // Change this!

    if (adminKey !== ADMIN_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    res.json({
        total: authorizedDevices.size,
        devices: Array.from(authorizedDevices)
    });
});

/**
 * Health check
 * GET /
 */
app.get('/', (req, res) => {
    res.send('RenaClean Dialyzer Installation Server - Running ✅');
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, '0.0.0.0', () => {
    log('==============================================');
    log('RenaClean Dialyzer Installation Server');
    log('==============================================');
    log(`Server running on port ${PORT}`);
    log(`Authorized devices: ${authorizedDevices.size}`);
    log('==============================================');
});