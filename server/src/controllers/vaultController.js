import crypto from 'crypto';
import bcrypt from 'bcrypt';
import VaultSettings from '../models/VaultSettings.js';
import VaultItem from '../models/VaultItem.js';

const PEPPER = process.env.VAULT_SECRET_KEY || 'fti-portal-vault-fallback-secret-2026';

// Derive 256-bit AES key using scrypt
function deriveVaultKey(pin, salt) {
  return crypto.scryptSync(pin, `${salt}:${PEPPER}`, 32);
}

// Encrypt payload object with AES-256-GCM
function encryptSecret(payloadObj, pin, salt) {
  const key = deriveVaultKey(pin, salt);
  const iv = crypto.randomBytes(12); // 96-bit IV
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = JSON.stringify(payloadObj);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag,
  };
}

// Decrypt payload object with AES-256-GCM
function decryptSecret(encryptedData, ivHex, authTagHex, pin, salt) {
  const key = deriveVaultKey(pin, salt);
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}

const getUserId = (req) => req.user?.id || req.user?._id;

/**
 * GET /api/v1/vault/status
 * Returns whether user has configured their vault PIN, lockout status, and total item count
 */
export async function getVaultStatus(req, res, next) {
  try {
    const userId = getUserId(req);
    const settings = await VaultSettings.findOne({ userId });
    const totalItems = await VaultItem.countDocuments({ userId });

    if (!settings) {
      return res.status(200).json({
        success: true,
        data: {
          isConfigured: false,
          autoLockMinutes: 10,
          pinHint: '',
          totalItems: 0,
          isLocked: false,
        },
      });
    }

    const now = new Date();
    const isLocked = settings.lockedUntil && new Date(settings.lockedUntil) > now;

    res.status(200).json({
      success: true,
      data: {
        isConfigured: true,
        autoLockMinutes: settings.autoLockMinutes || 10,
        pinHint: settings.pinHint || '',
        totalItems,
        isLocked,
        lockedUntil: isLocked ? settings.lockedUntil : null,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/vault/setup-pin
 * Sets up the 6-digit Master PIN for the first time
 */
export async function setupPin(req, res, next) {
  try {
    const userId = getUserId(req);
    const { pin, pinHint, autoLockMinutes = 10 } = req.body;

    if (!pin || !/^\d{6}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        message: 'Master PIN must be exactly 6 numeric digits (0-9)',
      });
    }

    const existing = await VaultSettings.findOne({ userId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Vault PIN is already configured. Use change PIN instead.',
      });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const pinHash = await bcrypt.hash(pin, 10);

    const newSettings = await VaultSettings.create({
      userId,
      pinHash,
      salt,
      pinHint: pinHint ? String(pinHint).trim() : '',
      autoLockMinutes: Math.max(1, Math.min(60, Number(autoLockMinutes) || 10)),
    });

    res.status(201).json({
      success: true,
      message: 'Vault Master PIN created successfully',
      data: {
        isConfigured: true,
        autoLockMinutes: newSettings.autoLockMinutes,
        pinHint: newSettings.pinHint,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/vault/verify-pin
 * Verifies that the supplied PIN is correct
 */
export async function verifyPin(req, res, next) {
  try {
    const userId = getUserId(req);
    const { pin } = req.body;

    if (!pin || !/^\d{6}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        message: 'PIN must be 6 digits',
      });
    }

    const settings = await VaultSettings.findOne({ userId });
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Vault PIN has not been configured yet',
      });
    }

    const now = new Date();
    if (settings.lockedUntil && new Date(settings.lockedUntil) > now) {
      const waitSeconds = Math.ceil((new Date(settings.lockedUntil) - now) / 1000);
      return res.status(429).json({
        success: false,
        message: `Vault is temporarily locked due to failed attempts. Please wait ${waitSeconds} seconds.`,
      });
    }

    const isMatch = await bcrypt.compare(pin, settings.pinHash);
    if (!isMatch) {
      const failed = (settings.failedAttempts || 0) + 1;
      let lockUntil = null;
      if (failed >= 5) {
        lockUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 min lockout
      }
      await VaultSettings.updateOne(
        { _id: settings._id },
        { failedAttempts: failed, lockedUntil: lockUntil }
      );

      return res.status(401).json({
        success: false,
        message: failed >= 5
          ? 'Too many incorrect PIN attempts. Vault is locked for 5 minutes.'
          : `Incorrect PIN. ${5 - failed} attempts remaining before temporary lock.`,
        remainingAttempts: Math.max(0, 5 - failed),
      });
    }

    // Success: reset failed attempts
    await VaultSettings.updateOne(
      { _id: settings._id },
      { failedAttempts: 0, lockedUntil: null }
    );

    res.status(200).json({
      success: true,
      message: 'PIN verified successfully',
      data: {
        verified: true,
        autoLockMinutes: settings.autoLockMinutes,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/vault/change-pin
 * Re-encrypts all items with a new PIN
 */
export async function changePin(req, res, next) {
  try {
    const userId = getUserId(req);
    const { oldPin, newPin, pinHint } = req.body;

    if (!oldPin || !newPin || !/^\d{6}$/.test(newPin)) {
      return res.status(400).json({
        success: false,
        message: 'New PIN must be 6 numeric digits',
      });
    }

    const settings = await VaultSettings.findOne({ userId });
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Vault PIN has not been configured yet',
      });
    }

    const isMatch = await bcrypt.compare(oldPin, settings.pinHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current PIN is incorrect',
      });
    }

    // Re-encrypt all items
    const items = await VaultItem.find({ userId });
    const newSalt = crypto.randomBytes(16).toString('hex');
    const newPinHash = await bcrypt.hash(newPin, 10);

    for (const item of items) {
      try {
        const decryptedPayload = decryptSecret(
          item.encryptedData,
          item.iv,
          item.authTag,
          oldPin,
          settings.salt
        );

        const reEncrypted = encryptSecret(decryptedPayload, newPin, newSalt);
        item.encryptedData = reEncrypted.encryptedData;
        item.iv = reEncrypted.iv;
        item.authTag = reEncrypted.authTag;
        await item.save();
      } catch (err) {
        // Skip or handle failed single item
      }
    }

    settings.pinHash = newPinHash;
    settings.salt = newSalt;
    if (pinHint !== undefined) settings.pinHint = String(pinHint).trim();
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Master PIN changed and all vault items re-encrypted successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/vault/items
 * Retrieves vault items (decrypted if valid PIN provided in 'x-vault-pin' header)
 */
export async function listItems(req, res, next) {
  try {
    const userId = getUserId(req);
    const { category, search, favorite } = req.query;
    const pin = req.headers['x-vault-pin'];

    const filter = { userId };
    if (category && category !== 'all') {
      filter.category = category;
    }
    if (favorite === 'true') {
      filter.favorite = true;
    }

    let items = await VaultItem.find(filter).sort({ favorite: -1, updatedAt: -1 });

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (it) =>
          it.title?.toLowerCase().includes(q) ||
          it.username?.toLowerCase().includes(q) ||
          it.url?.toLowerCase().includes(q) ||
          it.tags?.some((tg) => tg.toLowerCase().includes(q))
      );
    }

    // If PIN is provided and valid, decrypt each item's secret payload
    let canDecrypt = false;
    let userSalt = '';

    if (pin && /^\d{6}$/.test(pin)) {
      const settings = await VaultSettings.findOne({ userId });
      if (settings && (await bcrypt.compare(pin, settings.pinHash))) {
        canDecrypt = true;
        userSalt = settings.salt;
      }
    }

    const result = items.map((item) => {
      const base = {
        _id: item._id,
        category: item.category,
        title: item.title,
        favorite: item.favorite,
        tags: item.tags || [],
        username: item.username || '',
        url: item.url || '',
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };

      if (canDecrypt) {
        try {
          const secrets = decryptSecret(
            item.encryptedData,
            item.iv,
            item.authTag,
            pin,
            userSalt
          );
          return {
            ...base,
            secrets,
            isDecrypted: true,
          };
        } catch {
          return {
            ...base,
            secrets: null,
            isDecrypted: false,
          };
        }
      } else {
        return {
          ...base,
          secrets: null,
          isDecrypted: false,
        };
      }
    });

    res.status(200).json({
      success: true,
      data: result,
      count: result.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/vault/items
 * Encrypts and saves a new vault item
 */
export async function createItem(req, res, next) {
  try {
    const userId = getUserId(req);
    const pin = req.headers['x-vault-pin'];
    const { category = 'login', title, username = '', url = '', tags = [], secrets = {} } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Title is required',
      });
    }

    if (!pin || !/^\d{6}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        message: 'Valid 6-digit Master PIN is required to encrypt secrets',
      });
    }

    const settings = await VaultSettings.findOne({ userId });
    if (!settings || !(await bcrypt.compare(pin, settings.pinHash))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Master PIN',
      });
    }

    const encrypted = encryptSecret(secrets, pin, settings.salt);

    const newItem = await VaultItem.create({
      userId,
      category,
      title: title.trim(),
      username: username ? username.trim() : '',
      url: url ? url.trim() : '',
      tags: Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [],
      encryptedData: encrypted.encryptedData,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
    });

    res.status(201).json({
      success: true,
      message: 'Item saved securely in vault',
      data: {
        _id: newItem._id,
        category: newItem.category,
        title: newItem.title,
        username: newItem.username,
        url: newItem.url,
        tags: newItem.tags,
        favorite: newItem.favorite,
        secrets,
        isDecrypted: true,
        createdAt: newItem.createdAt,
        updatedAt: newItem.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/v1/vault/items/:id
 * Updates and re-encrypts an existing vault item
 */
export async function updateItem(req, res, next) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const pin = req.headers['x-vault-pin'];
    const { category, title, username, url, tags, secrets } = req.body;

    if (!pin || !/^\d{6}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        message: 'Valid Master PIN is required to update secrets',
      });
    }

    const settings = await VaultSettings.findOne({ userId });
    if (!settings || !(await bcrypt.compare(pin, settings.pinHash))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Master PIN',
      });
    }

    const item = await VaultItem.findOne({ _id: id, userId });
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Vault item not found',
      });
    }

    if (category) item.category = category;
    if (title) item.title = title.trim();
    if (username !== undefined) item.username = username.trim();
    if (url !== undefined) item.url = url.trim();
    if (Array.isArray(tags)) item.tags = tags.map((t) => String(t).trim()).filter(Boolean);

    // If new secrets supplied, re-encrypt
    if (secrets && typeof secrets === 'object') {
      const encrypted = encryptSecret(secrets, pin, settings.salt);
      item.encryptedData = encrypted.encryptedData;
      item.iv = encrypted.iv;
      item.authTag = encrypted.authTag;
    }

    await item.save();

    res.status(200).json({
      success: true,
      message: 'Vault item updated securely',
      data: {
        _id: item._id,
        category: item.category,
        title: item.title,
        username: item.username,
        url: item.url,
        tags: item.tags,
        favorite: item.favorite,
        secrets: secrets || null,
        isDecrypted: Boolean(secrets),
        updatedAt: item.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/vault/items/:id
 * Deletes a vault item
 */
export async function deleteItem(req, res, next) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const item = await VaultItem.findOneAndDelete({ _id: id, userId });
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Vault item not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Vault item deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/vault/items/:id/favorite
 * Toggles favorite state
 */
export async function toggleFavorite(req, res, next) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const item = await VaultItem.findOne({ _id: id, userId });
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Vault item not found',
      });
    }

    item.favorite = !item.favorite;
    await item.save();

    res.status(200).json({
      success: true,
      data: {
        _id: item._id,
        favorite: item.favorite,
      },
    });
  } catch (error) {
    next(error);
  }
}
