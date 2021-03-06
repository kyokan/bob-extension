const {aes, bcrypt} = require('bcrypto');

const iv = Buffer.from('4175e1b983206d61e1b98769207061646d652068c5abe1b983', 'hex').slice(0, 16);

export function encrypt(text: string, password: string): string {
  const key = bcrypt.hash256(password, null, 4);
  return aes.encipher(Buffer.from(text, 'utf-8'), key, iv).toString('hex');
}

export function decrypt(ciphertext: string, password: string): string {
  const key = bcrypt.hash256(password, null, 4);
  return aes.decipher(Buffer.from(ciphertext, 'hex'), key, iv).toString('utf-8');
}

export function hash(text: string): string {
  return bcrypt.hash256(text, null, 4).toString('hex');
}
