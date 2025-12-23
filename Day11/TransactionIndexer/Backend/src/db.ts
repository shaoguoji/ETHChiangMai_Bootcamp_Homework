import Database from 'better-sqlite3';

const db = new Database('transfers.db');

export function initDB() {
    db.exec(`
    CREATE TABLE IF NOT EXISTS transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT UNIQUE,
      from_address TEXT,
      to_address TEXT,
      value TEXT,
      block_number INTEGER
    )
  `);
}

export interface Transfer {
    hash: string;
    from: string;
    to: string;
    value: string;
    blockNumber: bigint;
}

export function saveTransfer(transfer: Transfer) {
    const insert = db.prepare(`
    INSERT OR IGNORE INTO transfers (hash, from_address, to_address, value, block_number)
    VALUES (@hash, @from, @to, @value, @blockNumber)
  `);
    insert.run({
        hash: transfer.hash,
        from: transfer.from,
        to: transfer.to,
        value: transfer.value,
        blockNumber: Number(transfer.blockNumber)
    });
}

export function getTransfers(address: string) {
    const query = db.prepare(`
    SELECT * FROM transfers 
    WHERE from_address = ? OR to_address = ?
    ORDER BY block_number DESC
  `);
    return query.all(address, address);
}

export function getAllTransfers() {
    const query = db.prepare('SELECT * FROM transfers ORDER BY block_number DESC LIMIT 100');
    return query.all();
}
