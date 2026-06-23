import os

migrations_dir = 'supabase/migrations'
targets = [
    '20260625_kb_carrier_franchigie.sql',
    '20260626_kb_chi_e_nolosubito.sql',
    '20260627_kb_faq_nlt.sql',
    '20260628_kb_optional_accessori.sql',
    '20260629_kb_processo_noleggio.sql',
]

for fname in targets:
    fpath = os.path.join(migrations_dir, fname)
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    # Replace every pair of single quotes with a single quote
    # This undoes the earlier corruption where every ' was doubled to ''
    # ''hello'' → 'hello', '''' → '' (empty string preserved)
    content = content.replace("''", "'")

    if content != original:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Fixed: {fname}')
    else:
        print(f'Unchanged: {fname}')
