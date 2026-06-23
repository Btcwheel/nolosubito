import os

for fname in sorted(os.listdir('supabase/migrations')):
    if not fname.endswith('.sql'):
        continue
    fpath = os.path.join('supabase/migrations', fname)
    with open(fpath, 'rb') as f:
        data = f.read()
    count = data.count(ord('\\'))
    if count > 0:
        print(f'{fname}: {count} backslashes')
print('Done scanning')
