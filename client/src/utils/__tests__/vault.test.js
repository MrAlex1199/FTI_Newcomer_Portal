import { describe, it, expect } from 'vitest';

describe('Personal Vault Logic & Security Helpers', () => {
  // 1. PIN Validation
  const isValidPin = (pin) => typeof pin === 'string' && /^\d{6}$/.test(pin);

  it('validates 6-digit numeric PIN correctly', () => {
    expect(isValidPin('123456')).toBe(true);
    expect(isValidPin('000000')).toBe(true);
    expect(isValidPin('987654')).toBe(true);

    expect(isValidPin('12345')).toBe(false); // 5 digits
    expect(isValidPin('1234567')).toBe(false); // 7 digits
    expect(isValidPin('12345a')).toBe(false); // contains letter
    expect(isValidPin('')).toBe(false);
    expect(isValidPin(null)).toBe(false);
    expect(isValidPin(undefined)).toBe(false);
  });

  // 2. Secret Masking
  const maskSecret = (val, reveal = false) => {
    if (reveal) return val || '';
    return '••••••••••••';
  };

  const maskCardNumber = (cardNum, reveal = false) => {
    if (!cardNum) return '•••• •••• •••• ••••';
    if (reveal) return cardNum;
    const clean = cardNum.replace(/\s+/g, '');
    const last4 = clean.slice(-4);
    return `•••• •••• •••• ${last4}`;
  };

  it('masks secret values unless explicitly revealed', () => {
    const rawPass = 'SecretP@ssword2026';
    expect(maskSecret(rawPass, false)).toBe('••••••••••••');
    expect(maskSecret(rawPass, true)).toBe('SecretP@ssword2026');

    const card = '4111 2222 3333 4444';
    expect(maskCardNumber(card, false)).toBe('•••• •••• •••• 4444');
    expect(maskCardNumber(card, true)).toBe('4111 2222 3333 4444');
  });

  // 3. Vault Items Filtering
  const vaultItems = [
    {
      _id: '1',
      category: 'login',
      title: 'FTI Member Portal',
      username: 'somchai.f',
      url: 'https://member.fti.or.th',
      tags: ['portal', 'member'],
      favorite: true,
    },
    {
      _id: '2',
      category: 'note',
      title: 'Meeting Wi-Fi Code',
      username: '',
      url: '',
      tags: ['wifi', 'guest'],
      favorite: false,
    },
    {
      _id: '3',
      category: 'key',
      title: 'Production API Key',
      username: '',
      url: 'https://api.fti.or.th',
      tags: ['api', 'prod'],
      favorite: true,
    },
  ];

  it('filters vault items by category', () => {
    const logins = vaultItems.filter((i) => i.category === 'login');
    expect(logins).toHaveLength(1);
    expect(logins[0].title).toBe('FTI Member Portal');

    const keys = vaultItems.filter((i) => i.category === 'key');
    expect(keys).toHaveLength(1);
    expect(keys[0].title).toBe('Production API Key');
  });

  it('filters vault items by favorites', () => {
    const favs = vaultItems.filter((i) => i.favorite);
    expect(favs).toHaveLength(2);
  });

  it('filters vault items by search query across title, username, url, and tags', () => {
    const search = (q) => {
      const term = q.toLowerCase();
      return vaultItems.filter(
        (i) =>
          i.title.toLowerCase().includes(term) ||
          i.username.toLowerCase().includes(term) ||
          i.url.toLowerCase().includes(term) ||
          i.tags.some((t) => t.toLowerCase().includes(term))
      );
    };

    expect(search('member')).toHaveLength(1);
    expect(search('wifi')).toHaveLength(1);
    expect(search('fti.or.th')).toHaveLength(2);
    expect(search('nonexistent')).toHaveLength(0);
  });

  // 4. Auto-lock Timer Formatter
  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  it('formats remaining seconds to MM:SS string', () => {
    expect(formatTimer(600)).toBe('10:00');
    expect(formatTimer(599)).toBe('09:59');
    expect(formatTimer(65)).toBe('01:05');
    expect(formatTimer(9)).toBe('00:09');
    expect(formatTimer(0)).toBe('00:00');
  });
});
