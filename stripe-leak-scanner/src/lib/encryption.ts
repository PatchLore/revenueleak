import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = process.env.ENCRYPTION_KEY!;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(KEY.padEnd(32).slice(0, 32), 'utf8'), iv);
  cipher.setAAD(Buffer.from('stripe-scanner', 'utf8'));
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
  
  const decipher = crypto.createDecipheriv(
    ALGORITHM, 
    Buffer.from(KEY.padEnd(32).slice(0, 32), 'utf8'), 
    Buffer.from(ivHex, 'hex')
  );
  
  decipher.setAAD(Buffer.from('stripe-scanner', 'utf8'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Utility function to generate a secure encryption key
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}