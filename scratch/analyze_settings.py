import re

filepath = r"C:\e drive backup\Pictures\antiygravity\views\settings.ejs"
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")
for idx, line in enumerate(lines):
    if 'id="panel-' in line or "id='panel-" in line or 'settings-panel' in line:
        print(f"Line {idx+1}: {line.strip()}")
