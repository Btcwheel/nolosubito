import sys
import os
import json
import base64
import fitz
import requests

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
pdf_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
    root, 'supabase', 'functions', 'analyze-preventivo', 'samples',
    'AYVENS - TUTTO A ZERO + VETTURA SOS. + GOMME + ANTICIPO.pdf'
)

ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vd29peXdyemZuam9jdnNibWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0OTg1MDUsImV4cCI6MjA5MjA3NDUwNX0.0Qr7mgoNnpaxO3l8QKX_g-_LuS7-u2ZelSaCEa9gRIc'
ANALYZE_URL = 'https://nowoiywrzfnjocvsbmih.supabase.co/functions/v1/analyze-preventivo'

print(f'Carico PDF: {pdf_path}')
doc = fitz.open(pdf_path)
pages_b64 = []
text_parts = []

for i, page in enumerate(doc):
    if i >= 5:
        break
    pix = page.get_pixmap(dpi=150)
    img_bytes = pix.tobytes('jpeg')
    pages_b64.append(base64.b64encode(img_bytes).decode())
    text_parts.append(f'PAGINA {i+1}: ' + page.get_text().replace('\n', ' ').strip())

print(f'Pagine convertite: {len(pages_b64)}')
print(f'Invocazione analyze-preventivo...')

res = requests.post(
    ANALYZE_URL,
    headers={'Authorization': f'Bearer {ANON_KEY}', 'Content-Type': 'application/json'},
    json={'pages': pages_b64, 'text': '\n\n'.join(text_parts)},
    timeout=120,
)

if not res.ok:
    print('Errore analyze-preventivo:', res.status_code, res.text[:500])
    sys.exit(1)

data = res.json()
if data.get('error'):
    print('Errore analyze-preventivo:', data['error'])
    sys.exit(1)

output_path = os.path.join(root, 'temp_broker_extracted.json')
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(data['data'], f, indent=2, ensure_ascii=False)

print(f'Dati estratti salvati in: {output_path}')
print(json.dumps(data['data'], indent=2, ensure_ascii=False))
