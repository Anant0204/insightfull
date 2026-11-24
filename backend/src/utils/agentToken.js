const crypto = require('crypto');
const { JWT_SECRET } = require('../config/env');

const TOKEN_MARKER = 'INSIGHTFUL';

const sign = (payload) => crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');

/**
 * Generate a tamper-proof agent token: base64(employeeId:deviceId:INSIGHTFUL).<HMAC-SHA256 hex>
 */
const generateAgentToken = (employeeId, deviceId) => {
    const payload = `${employeeId}:${deviceId}:${TOKEN_MARKER}`;
    return `${Buffer.from(payload).toString('base64')}.${sign(payload)}`;
};

/**
 * Verify an agent token. Returns { employeeId, deviceId } or null.
 * Optionally enforces that the token belongs to the expected employee/device.
 */
const verifyAgentToken = (token, expectedEmployeeId, expectedDeviceId) => {
    if (typeof token !== 'string') return null;

    const dotIndex = token.indexOf('.');
    if (dotIndex <= 0 || dotIndex !== token.lastIndexOf('.')) return null;

    const encoded = token.slice(0, dotIndex);
    const signature = token.slice(dotIndex + 1);

    let payload;
    try {
        const decodedBuffer = Buffer.from(encoded, 'base64');
        // Strict canonical base64 — reject padded/whitespace variants
        if (decodedBuffer.toString('base64') !== encoded) return null;
        payload = decodedBuffer.toString('utf8');
    } catch (e) {
        return null;
    }

    const parts = payload.split(':');
    if (parts.length !== 3 || parts[2] !== TOKEN_MARKER) return null;

    const expectedSignature = sign(payload);
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
        return null;
    }

    if (expectedEmployeeId && parts[0] !== expectedEmployeeId) return null;
    if (expectedDeviceId && parts[1] !== expectedDeviceId) return null;

    return { employeeId: parts[0], deviceId: parts[1] };
};

module.exports = { generateAgentToken, verifyAgentToken };
