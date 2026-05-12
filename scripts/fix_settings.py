import sqlite3
c = sqlite3.connect('data/reporte-celular.db')
c.execute("UPDATE app_settings SET value='0' WHERE key='week_start_day'")
c.commit()
print(c.execute('SELECT key,value FROM app_settings').fetchall())
