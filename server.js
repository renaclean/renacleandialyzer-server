const express = require('express');

const app = express();
const PORT = process.env.PORT || 10000;

// ⚙️ CONFIGURATION - Replace with YOUR actual GitHub Release URL
// Format: https://github.com/USERNAME/REPO-NAME/releases/download/TAG/renacleandialyzer.apk
const APK_DOWNLOAD_URL = 'https://github.com/renaclean/renacleandialyzer-server/releases/download/v1.0/renacleandialyzer.apk';

// ⚙️ AUTHORIZED DEVICES DATABASE
const authorizedDevices = new Set([
    '9d389cebf6a08dbd', //honor
    '459e6d0b4391170f', //oneplus(signed apk)
]);

// Logging
function log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
}

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

app.get('/api/download-app', (req, res) => {
    const deviceId = req.query.device_id;
    const ip = req.ip || req.connection.remoteAddress;

    if (!deviceId) {
        log(`❌ Download failed: No device ID provided from ${ip}`);
        return res.status(400).send('Device ID required');
    }

    if (!authorizedDevices.has(deviceId)) {
        log(`❌ Download denied: Unauthorized device ${deviceId} from ${ip}`);
        return res.status(403).send('Device not authorized');
    }

    log(`📥 Download request: ${deviceId} from ${ip}`);
    log(`🔄 Redirecting to: ${APK_DOWNLOAD_URL}`);

    // Redirect to GitHub Release
    res.redirect(APK_DOWNLOAD_URL);
    
    log(`✅ Redirect sent for: ${deviceId}`);
});

app.post('/api/authorize-device', (req, res) => {
    const deviceId = req.query.device_id;
    const adminKey = req.query.admin_key;
    const ADMIN_KEY = process.env.ADMIN_KEY || 'your-secret-admin-key-12345';

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

app.post('/api/revoke-device', (req, res) => {
    const deviceId = req.query.device_id;
    const adminKey = req.query.admin_key;
    const ADMIN_KEY = process.env.ADMIN_KEY || 'your-secret-admin-key-12345';

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

app.get('/api/list-devices', (req, res) => {
    const adminKey = req.query.admin_key;
    const ADMIN_KEY = process.env.ADMIN_KEY || 'your-secret-admin-key-12345';

    if (adminKey !== ADMIN_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    res.json({
        total: authorizedDevices.size,
        devices: Array.from(authorizedDevices)
    });
});

app.get('/', (req, res) => {
    res.send('RenaClean Dialyzer Installation Server - Running ✅');
});

app.listen(PORT, '0.0.0.0', () => {
    log('==============================================');
    log('RenaClean Dialyzer Installation Server');
    log('==============================================');
    log(`Server running on port ${PORT}`);
    log(`APK URL: ${APK_DOWNLOAD_URL}`);
    log(`Authorized devices: ${authorizedDevices.size}`);
    log('==============================================');
});



