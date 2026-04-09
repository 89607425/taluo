import { query } from './db';

export async function ensureSchema(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id VARCHAR(191) PRIMARY KEY,
      reverse_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      default_spread VARCHAR(32) NOT NULL DEFAULT 'trinity',
      interpretation_style VARCHAR(32) NOT NULL DEFAULT 'detailed',
      theme_style VARCHAR(32) NOT NULL DEFAULT 'dark',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS tarot_records (
      id VARCHAR(191) PRIMARY KEY,
      user_id VARCHAR(191) NOT NULL,
      question TEXT NOT NULL,
      spread_type VARCHAR(32) NOT NULL,
      cards_json JSON NOT NULL,
      interpretation_text MEDIUMTEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_tarot_records_user_created (user_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS tarot_notes (
      id VARCHAR(191) PRIMARY KEY,
      user_id VARCHAR(191) NOT NULL,
      reading_id VARCHAR(191) NULL,
      title VARCHAR(255) NOT NULL,
      content MEDIUMTEXT NOT NULL,
      tags_json JSON NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_tarot_notes_user_created (user_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  try {
    await query(`
      ALTER TABLE user_settings
      ADD COLUMN theme_style VARCHAR(32) NOT NULL DEFAULT 'dark'
    `);
  } catch (error) {
    const err = error as { errno?: number };
    // ER_DUP_FIELDNAME: column already exists.
    if (err.errno !== 1060) throw error;
  }
}
