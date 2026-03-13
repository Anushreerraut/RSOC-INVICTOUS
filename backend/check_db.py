import sqlite3
import json

conn = sqlite3.connect('rsoc.db')
conn.row_factory = sqlite3.Row
cur = conn.cursor()

# Get the latest scan ID
scan = cur.execute('SELECT id FROM scans ORDER BY created_at DESC LIMIT 1').fetchone()
if not scan:
    print("No scans found")
else:
    scan_id = scan['id']
    findings = [dict(row) for row in cur.execute("SELECT title, category, severity FROM findings WHERE scan_id = ? AND category = 'Active Defense Detection'", (scan_id,)).fetchall()]
    print(json.dumps(findings, indent=2))
