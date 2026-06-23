import os

migrations_dir = 'supabase/migrations'
fixed = 0

target = b"\\'"
replacement = b"''"

for fname in sorted(os.listdir(migrations_dir)):
    if not fname.endswith('.sql'):
        continue
    fpath = os.path.join(migrations_dir, fname)
    with open(fpath, 'rb') as f:
        data = f.read()

    original = data
    data = data.replace(target, replacement)

    if data != original:
        with open(fpath, 'wb') as f:
            f.write(data)
        print(f'Fixed: {fname}')
        fixed += 1

print(f'Total files modified: {fixed}')
