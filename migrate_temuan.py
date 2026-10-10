"""
Migrasi database untuk fitur Temuan & Tindak Lanjut.
Jalankan sekali: python migrate_temuan.py
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'eva_app.db')


def table_exists(cursor, table_name):
    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        (table_name,)
    )
    return cursor.fetchone() is not None


def column_exists(cursor, table_name, column_name):
    cursor.execute(f"PRAGMA table_info({table_name})")
    return any(row[1] == column_name for row in cursor.fetchall())


def main():
    print(f"📁 Database: {DB_PATH}")
    if not os.path.exists(DB_PATH):
        print("❌ File database tidak ditemukan! Jalankan server dulu sekali.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # ============================================
    # TABEL: pic (hierarkis)
    # ============================================
    if table_exists(cursor, 'pic'):
        # Cek apakah tabel lama (schema flat) perlu di-drop & recreate
        if not column_exists(cursor, 'pic', 'parent_id'):
            print("⚠️  Tabel 'pic' versi lama terdeteksi. Drop & recreate...")
            cursor.execute("DROP TABLE IF EXISTS pic")
        else:
            print("ℹ️  Tabel 'pic' sudah ada dengan schema baru, skip.")
    
    if not table_exists(cursor, 'pic'):
        cursor.execute("""
            CREATE TABLE pic (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                parent_id INTEGER,
                level INTEGER DEFAULT 1,
                urutan INTEGER DEFAULT 0,
                nama_jabatan VARCHAR(200) NOT NULL,
                departemen VARCHAR(200),
                nama_orang VARCHAR(200),
                email VARCHAR(200),
                telepon VARCHAR(50),
                foto_base64 TEXT,
                kategori_tanggung_jawab TEXT DEFAULT '[]',
                is_active BOOLEAN DEFAULT 1,
                is_template BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (parent_id) REFERENCES pic(id)
            )
        """)
        cursor.execute("CREATE INDEX idx_pic_user_id ON pic(user_id)")
        cursor.execute("CREATE INDEX idx_pic_parent_id ON pic(parent_id)")
        print("✅ Tabel 'pic' dibuat.")

    # ============================================
    # TABEL: temuan
    # ============================================
    if table_exists(cursor, 'temuan'):
        print("ℹ️  Tabel 'temuan' sudah ada, skip.")
    else:
        cursor.execute("""
            CREATE TABLE temuan (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                tahun VARCHAR(100) NOT NULL,
                judul VARCHAR(300) NOT NULL,
                deskripsi TEXT NOT NULL,
                kategori VARCHAR(100) NOT NULL,
                prioritas VARCHAR(20) DEFAULT 'sedang',
                data_pendukung TEXT DEFAULT '{}',
                dampak TEXT,
                rekomendasi TEXT,
                pic_id INTEGER,
                status VARCHAR(20) DEFAULT 'open',
                deadline DATETIME,
                resolved_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (pic_id) REFERENCES pic(id)
            )
        """)
        cursor.execute("CREATE INDEX idx_temuan_user_id ON temuan(user_id)")
        cursor.execute("CREATE INDEX idx_temuan_pic_id ON temuan(pic_id)")
        cursor.execute("CREATE INDEX idx_temuan_status ON temuan(status)")
        print("✅ Tabel 'temuan' dibuat.")

    # ============================================
    # TABEL: temuan_history
    # ============================================
    if table_exists(cursor, 'temuan_history'):
        print("ℹ️  Tabel 'temuan_history' sudah ada, skip.")
    else:
        cursor.execute("""
            CREATE TABLE temuan_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                temuan_id INTEGER NOT NULL,
                status_lama VARCHAR(20),
                status_baru VARCHAR(20) NOT NULL,
                catatan TEXT,
                changed_by INTEGER,
                changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (temuan_id) REFERENCES temuan(id),
                FOREIGN KEY (changed_by) REFERENCES users(id)
            )
        """)
        cursor.execute("CREATE INDEX idx_temuan_history_temuan_id ON temuan_history(temuan_id)")
        print("✅ Tabel 'temuan_history' dibuat.")

    conn.commit()

    # Verifikasi
    print("\n📋 Verifikasi tabel:")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    for row in cursor.fetchall():
        print(f"   - {row[0]}")

    conn.close()
    print("\n🎉 Migrasi selesai! Silakan restart server.")


if __name__ == "__main__":
    main()