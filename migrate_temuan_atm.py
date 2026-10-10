"""Migrasi: tambah kolom recommended_methods ke tabel temuan."""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'eva_app.db')


def column_exists(cursor, table, column):
    cursor.execute(f"PRAGMA table_info({table})")
    return any(row[1] == column for row in cursor.fetchall())


def main():
    print(f"📁 Database: {DB_PATH}")
    if not os.path.exists(DB_PATH):
        print("❌ File database tidak ditemukan!")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    if column_exists(cursor, 'temuan', 'recommended_methods'):
        print("ℹ️  Kolom 'recommended_methods' sudah ada, skip.")
    else:
        cursor.execute(
            "ALTER TABLE temuan ADD COLUMN recommended_methods TEXT DEFAULT '[]'"
        )
        conn.commit()
        print("✅ Kolom 'recommended_methods' ditambahkan ke tabel 'temuan'.")

    # Verifikasi
    cursor.execute("PRAGMA table_info(temuan)")
    print("\n📋 Kolom di tabel 'temuan':")
    for row in cursor.fetchall():
        print(f"   - {row[1]}")

    conn.close()
    print("\n🎉 Migrasi selesai!")


if __name__ == "__main__":
    main()