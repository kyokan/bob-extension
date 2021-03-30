export async function put(db: any, key: string, value: any) {
  return db.put(Buffer.from(key, 'utf-8'), Buffer.from(JSON.stringify(value), 'utf-8'));
}

export async function get(db: any, key: string) {
  const data = await db.get(Buffer.from(key, 'utf-8'));
  if (data === null) {
    return null;
  }

  return JSON.parse(data.toString('utf-8'));
}

export async function del(db: any, key: string) {
  return db.del(Buffer.from(key, 'utf-8'));
}
