import {
  Document, Page, View, Text, Image, Font, StyleSheet, Svg,
  Circle, Path, Rect, Line, Defs, LinearGradient, Stop,
} from '@react-pdf/renderer';

/* ── Font ──────────────────────────────────────────────────────────────── */
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff2', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff2', fontWeight: 700 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuDyYAZ9hiJ-Ek-_EeA.woff2', fontWeight: 800 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuBXYAZ9hiJ-Ek-_EeA.woff2', fontWeight: 900 },
  ],
});

const NAVY   = '#2D2E82';
const ORANGE = '#F96209';
const DARK   = '#111827';
const GRAY   = '#D8DCF0';
const LGRAY  = '#F8F9FC';
const BORDER = '#E5E7EB';
const MUTED  = '#9CA3AF';
const TEXT   = '#4B5563';

const fmt  = (n) => n != null ? Number(n).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00';
const fmtN = (n) => n != null ? Number(n).toLocaleString('it-IT') : '—';

const S = StyleSheet.create({
  page:         { backgroundColor: GRAY, fontFamily: 'Inter', fontSize: 9, color: DARK },
  card:         { backgroundColor: '#fff', margin: '9mm 11mm', flex: 1, borderRadius: 4 },

  /* header */
  hdr:          { backgroundColor: NAVY, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'stretch', borderRadius: '4 4 0 0' },
  hdrLeft:      { flexDirection: 'row', alignItems: 'center', gap: 10, padding: '10 14' },
  hdrSep:       { width: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginVertical: 8 },
  hdrTag:       { fontSize: 7, letterSpacing: 1.2, color: 'rgba(255,255,255,0.6)', fontWeight: 600 },
  hdrRight:     { alignItems: 'flex-end', justifyContent: 'center', padding: '8 12', borderLeftWidth: 3, borderLeftColor: ORANGE },
  hdrLabel:     { fontSize: 6.5, letterSpacing: 1, color: 'rgba(255,255,255,0.55)', fontWeight: 600 },
  hdrNum:       { fontSize: 15, fontWeight: 800, color: '#fff', lineHeight: 1.1, marginTop: 1 },
  hdrDate:      { fontSize: 7.5, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  hdrValid:     { marginTop: 3, backgroundColor: ORANGE, borderRadius: 999, paddingVertical: 2, paddingHorizontal: 7 },
  hdrValidTxt:  { fontSize: 7, fontWeight: 700, color: '#fff' },

  /* body */
  body:         { padding: '12 14', flex: 1 },
  eyebrow:      { fontSize: 7, letterSpacing: 1, fontWeight: 700, color: NAVY, backgroundColor: '#EAECF8', paddingVertical: 3, paddingHorizontal: 7, borderRadius: 3, alignSelf: 'flex-start', marginBottom: 7 },
  h1:           { fontSize: 20, fontWeight: 900, lineHeight: 1.15, color: DARK, marginBottom: 5 },
  h1navy:       { color: NAVY },
  intro:        { fontSize: 9, lineHeight: 1.6, color: TEXT, marginBottom: 11 },
  bold:         { fontWeight: 700, color: DARK },

  /* client cards */
  clientGrid:   { flexDirection: 'row', gap: 8, marginBottom: 11 },
  clientCard:   { flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 6, padding: '9 11' },
  ccLabel:      { fontSize: 6.5, letterSpacing: 1, fontWeight: 700, color: MUTED, marginBottom: 5 },
  ccName:       { fontSize: 11, fontWeight: 700, color: DARK, marginBottom: 3 },
  ccRow:        { fontSize: 8.5, color: TEXT, marginTop: 2 },

  /* vehicle */
  vehicle:      { backgroundColor: NAVY, borderRadius: 6, padding: '13 14', marginBottom: 11 },
  vLabel:       { fontSize: 6.5, letterSpacing: 1.2, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 4 },
  vName:        { fontSize: 17, fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: 2 },
  vVer:         { fontSize: 9, color: 'rgba(255,255,255,0.7)', marginBottom: 9 },
  vChips:       { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  chipHot:      { backgroundColor: ORANGE, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 9 },
  chipHotTxt:   { fontSize: 8, fontWeight: 700, color: '#fff' },
  chip:         { borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', borderRadius: 999, paddingVertical: 3, paddingHorizontal: 9 },
  chipTxt:      { fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,0.9)' },

  /* canone */
  canoneRow:    { flexDirection: 'row', gap: 9, marginBottom: 11 },
  ctWrap:       { flex: 1.6 },
  ctLabel:      { fontSize: 7, letterSpacing: 0.8, fontWeight: 700, color: MUTED, marginBottom: 5 },
  ctHead:       { flexDirection: 'row', backgroundColor: NAVY, paddingVertical: 5, paddingHorizontal: 7, borderRadius: '4 4 0 0' },
  ctHCell:      { fontSize: 7, fontWeight: 700, color: '#fff', letterSpacing: 0.5 },
  ctRow:        { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 7, borderBottomWidth: 1, borderBottomColor: BORDER },
  ctRowAlt:     { backgroundColor: LGRAY },
  ctRowTot:     { backgroundColor: '#EAECF8', borderTopWidth: 1.5, borderTopColor: '#D0D4EF' },
  ctCell:       { fontSize: 8.5, color: DARK },
  ctCellBold:   { fontSize: 9, fontWeight: 800, color: NAVY },
  cboxWrap:     { flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 6, overflow: 'hidden' },
  cboxHdr:      { backgroundColor: NAVY, padding: '6 10' },
  cboxHdrTxt:   { fontSize: 6.5, fontWeight: 700, letterSpacing: 0.8, color: '#fff' },
  cboxBody:     { padding: '9 10' },
  cboxPrice:    { flexDirection: 'row', alignItems: 'flex-end', gap: 2, marginBottom: 3 },
  cboxCur:      { fontSize: 13, fontWeight: 700, color: ORANGE, lineHeight: 1.4 },
  cboxNum:      { fontSize: 30, fontWeight: 900, color: ORANGE, lineHeight: 1 },
  cboxPer:      { fontSize: 9.5, fontWeight: 600, color: MUTED, lineHeight: 1.6 },
  cboxSub:      { fontSize: 7.5, color: MUTED, lineHeight: 1.5, marginBottom: 7 },
  cboxAnt:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 7, borderTopWidth: 1, borderTopColor: BORDER, borderTopStyle: 'dashed' },
  cboxAntL:     { fontSize: 8, color: TEXT },
  cboxAntV:     { fontSize: 11, fontWeight: 800, color: NAVY },

  /* services */
  svcsHdr:      { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 7 },
  svcsTitle:    { fontSize: 7, letterSpacing: 0.8, fontWeight: 700, color: MUTED },
  svcsRule:     { flex: 1, height: 1, backgroundColor: BORDER },
  svcsBadge:    { fontSize: 7, fontWeight: 700, color: NAVY, backgroundColor: '#EAECF8', paddingVertical: 2, paddingHorizontal: 5, borderRadius: 3 },
  svcsGrid:     { flexDirection: 'row', gap: 10 },
  svcsCol:      { flex: 1 },
  svcItem:      { flexDirection: 'row', gap: 5, alignItems: 'flex-start', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#F1F3F9' },
  svcName:      { fontSize: 9, fontWeight: 600, color: DARK },
  svcMeta:      { fontSize: 8, color: MUTED, marginTop: 1 },

  /* footer */
  foot:         { backgroundColor: NAVY, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: '7 14', borderRadius: '0 0 4 4' },
  footTxt:      { fontSize: 7.5, color: 'rgba(255,255,255,0.65)' },
  footBold:     { fontWeight: 700, color: '#fff' },

  /* page 2 */
  p2body:       { padding: '12 14', flex: 1 },
  secTitle:     { fontSize: 7, letterSpacing: 0.9, fontWeight: 700, color: MUTED, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: BORDER, marginBottom: 10 },
  specs2col:    { flexDirection: 'row', gap: 28, marginBottom: 14 },
  specCol:      { flex: 1 },
  specRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#F1F3F9' },
  specK:        { fontSize: 9, color: TEXT },
  specV:        { fontSize: 9, fontWeight: 600, color: DARK, textAlign: 'right', maxWidth: '55%' },
  valoreGrid:   { flexDirection: 'row', gap: 7, marginBottom: 14 },
  vbox:         { flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 5, padding: '7 9' },
  vboxL:        { fontSize: 6.5, letterSpacing: 0.8, fontWeight: 700, color: MUTED, marginBottom: 3 },
  vboxV:        { fontSize: 13, fontWeight: 800, color: DARK },
  vboxTot:      { flex: 1.1, backgroundColor: NAVY, borderRadius: 5, padding: '7 10', justifyContent: 'center' },
  vboxTotL:     { fontSize: 6.5, letterSpacing: 0.8, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 3 },
  vboxTotV:     { fontSize: 13, fontWeight: 800, color: '#fff' },
  whyGrid:      { flexDirection: 'row', gap: 7, marginBottom: 13 },
  whyCard:      { flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 7, padding: '9 8', backgroundColor: '#FAFBFD' },
  whyIc:        { fontSize: 16, marginBottom: 4 },
  whyH:         { fontSize: 8.5, fontWeight: 700, color: DARK, marginBottom: 3 },
  whyP:         { fontSize: 7.5, color: MUTED, lineHeight: 1.4 },
  cta:          { backgroundColor: ORANGE, borderRadius: 8, padding: '12 14', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  ctaTitle:     { fontSize: 11, fontWeight: 800, color: '#fff', marginBottom: 2 },
  ctaSub:       { fontSize: 8, color: 'rgba(255,255,255,0.85)' },
  ctaBtn:       { backgroundColor: NAVY, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12 },
  ctaBtnTxt:    { fontSize: 7.5, fontWeight: 800, color: '#fff', letterSpacing: 0.8 },
  signGrid:     { flexDirection: 'row', gap: 28, marginBottom: 13 },
  signBl:       { flex: 1, borderTopWidth: 1.5, borderTopColor: DARK, paddingTop: 5 },
  signLbl:      { fontSize: 7, letterSpacing: 1.2, fontWeight: 700, color: MUTED },
  signNm:       { fontSize: 9, color: TEXT, marginTop: 2 },
  legal:        { fontSize: 7, lineHeight: 1.55, color: MUTED },
  legalH:       { fontSize: 7, letterSpacing: 0.7, fontWeight: 700, color: NAVY, marginTop: 7, marginBottom: 3 },
  legalP:       { marginBottom: 3 },
  nref:         { color: NAVY, fontWeight: 700 },
});

/* Componenti helper */
const CheckCircle = () => (
  <Svg width={12} height={12} viewBox="0 0 12 12">
    <Circle cx="6" cy="6" r="6" fill="#16A34A"/>
    <Path d="M3 6l2 2 4-4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const Dot = () => (
  <Svg width={6} height={6} viewBox="0 0 6 6">
    <Circle cx="3" cy="3" r="3" fill={ORANGE}/>
  </Svg>
);

const CtRow = ({ label, iva_excl, iva_incl, isTotal }) => (
  <View style={[S.ctRow, isTotal && S.ctRowTot, !isTotal && { backgroundColor: isTotal ? undefined : 'transparent' }]}>
    <Text style={[isTotal ? S.ctCellBold : S.ctCell, { flex: 1.6 }]}>{label}</Text>
    <Text style={[isTotal ? S.ctCellBold : S.ctCell, { width: 60, textAlign: 'right' }]}>{iva_excl}</Text>
    <Text style={[isTotal ? S.ctCellBold : S.ctCell, { width: 60, textAlign: 'right' }]}>{iva_incl}</Text>
  </View>
);

const SvcItem = ({ nome, nota }) => (
  <View style={S.svcItem}>
    <CheckCircle/>
    <View>
      <Text style={S.svcName}>{nome}</Text>
      <Text style={S.svcMeta}>{nota}</Text>
    </View>
  </View>
);

const SpecRow = ({ k, v }) => (
  <View style={S.specRow}>
    <Text style={S.specK}>{k}</Text>
    <Text style={S.specV}>{v}</Text>
  </View>
);

const Header = ({ rif, oggi, scadenza, logoB64, showValid = true }) => (
  <View style={S.hdr}>
    <View style={S.hdrLeft}>
      {logoB64
        ? <Image src={logoB64} style={{ height: 26, width: 'auto' }}/>
        : <Text style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>nolosubito</Text>
      }
      <View style={S.hdrSep}/>
      <Text style={S.hdrTag}>NOLEGGIO A LUNGO TERMINE</Text>
    </View>
    <View style={S.hdrRight}>
      <Text style={S.hdrLabel}>OFFERTA N.</Text>
      <Text style={S.hdrNum}>{rif}</Text>
      <Text style={S.hdrDate}>Emessa il {oggi}</Text>
      {showValid && (
        <View style={S.hdrValid}>
          <Text style={S.hdrValidTxt}>Valida fino al {scadenza}</Text>
        </View>
      )}
    </View>
  </View>
);

const Footer = ({ left, right }) => (
  <View style={S.foot}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <Dot/>
      <Text style={S.footTxt}><Text style={S.footBold}>Nolosubito S.r.l.</Text>  ·  {left}</Text>
    </View>
    <Text style={S.footTxt}>{right}</Text>
  </View>
);

/* ── SERVIZI ── */
const SERVIZI = [
  ['R.C.A. Responsabilità Civile',  'Massimale max 25 milioni'],
  ['Copertura Danni Kasko',          'Penale 500 € per sinistro'],
  ['Incendio e Furto',               'Penale 10% sul valore'],
  ['Manutenzione Ordinaria',         'Tagliandi periodici programmati'],
  ['Manutenzione Straordinaria',     'Riparazioni per usura'],
  ['Tassa di Possesso',              'Bollo auto gestito da broker'],
  ['Immatricolazione',               'Messa su strada inclusa'],
  ['Cambio Pneumatici',              'Stagionali (estivi/invernali)'],
  ['Assistenza Stradale H24',        "Soccorso 365 giorni l'anno"],
  ['Consegna del Veicolo',           'Presso sede o domicilio'],
  ['Gestione Multe',                 'Rinotifica al conducente'],
  ['Customer Care Dedicato',         'Numero verde + e-mail'],
];

/* ── DOCUMENTO PRINCIPALE ── */
export function PreventivoPdfDoc({ prev, clienteNome, logoB64 }) {
  const rif      = `NS-${prev.id.slice(-6).toUpperCase()}`;
  const oggi     = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  const scadenza = new Date(Date.now() + 15 * 86400000).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  const mesAnno  = new Date().toLocaleDateString('it-IT', { month: '2-digit', year: 'numeric' });

  const canone        = Number(prev.canone_finale ?? prev.canone_mensile);
  const canoneNetto   = canone / 1.22;
  const anticipo      = Number(prev.anticipo) || 0;
  const anticipoNetto = anticipo / 1.22;
  const kmTotali      = Number(prev.km_annui) * (Number(prev.durata_mesi) / 12);
  const qVN = canoneNetto * 0.67, qSN = canoneNetto * 0.33;
  const qVL = canone * 0.67,      qSL = canone * 0.33;

  const listing    = Number(prev.valore_listing || prev.valore_veicolo || 0);
  const optional   = Number(prev.valore_optional || 0);
  const accessori  = Number(prev.valore_accessori || 0);
  const totVeicolo = listing + optional + accessori;

  const specsLeft = [
    ['Marca',         prev.veicolo_marca    || '—'],
    ['Modello',       prev.veicolo_modello  || '—'],
    ['Versione',      prev.veicolo_versione || '—'],
    ['Alimentazione', prev.alimentazione    || '—'],
    ['Cambio',        prev.cambio           || '—'],
    ['Carrozzeria',   prev.carrozzeria      || '—'],
    ['Potenza',       prev.potenza          || '—'],
  ];
  const specsRight = [
    ['Colore esterno',    prev.colore_esterno    || 'A definire'],
    ['Interni',           prev.interni           || 'A definire'],
    ['Emissioni CO₂',     prev.emissioni_co2     || '—'],
    ['Classe ambientale', prev.classe_ambientale || '—'],
    ['Durata contratto',  `${prev.durata_mesi} mesi`],
    ['Km annui',          `${fmtN(prev.km_annui)} km`],
    ['Km totali',         `${fmtN(kmTotali)} km`],
  ];

  const chips = [
    { label: '✓ Pronta consegna', hot: true },
    ...(prev.alimentazione ? [{ label: prev.alimentazione }] : []),
    { label: `${prev.durata_mesi} mesi` },
    { label: `${fmtN(prev.km_annui)} km/anno` },
    ...(prev.cambio ? [{ label: prev.cambio }] : []),
  ];

  /* Dividi servizi in 3 colonne */
  const col1 = SERVIZI.filter((_, i) => i % 3 === 0);
  const col2 = SERVIZI.filter((_, i) => i % 3 === 1);
  const col3 = SERVIZI.filter((_, i) => i % 3 === 2);

  return (
    <Document title={`Preventivo ${rif} — Nolosubito`} author="Nolosubito S.r.l.">

      {/* ══ PAGINA 1 ══ */}
      <Page size="A4" style={S.page}>
        <View style={S.card}>

          <Header rif={rif} oggi={oggi} scadenza={scadenza} logoB64={logoB64} showValid/>

          <View style={S.body}>

            {/* Eyebrow + Titolo */}
            <Text style={S.eyebrow}>PROPOSTA PERSONALIZZATA</Text>
            <Text style={S.h1}>
              <Text>Proposta di noleggio </Text>
              <Text style={S.h1navy}>a lungo termine{'\n'}</Text>
              <Text>di veicolo in locazione</Text>
            </Text>
            <Text style={[S.intro, { marginTop: 5 }]}>
              Gentile <Text style={S.bold}>{clienteNome || 'Cliente'}</Text>, abbiamo il piacere di trasmetterle l'offerta a Lei dedicata
              <Text style={S.nref}>(1)</Text>. La ringraziamo per la preferenza accordataci e restiamo a Sua disposizione
              per qualsiasi chiarimento. Tutti i servizi inclusi nel canone mensile sono pensati per garantirLe una
              mobilità completa, sicura e senza pensieri.
            </Text>

            {/* Schede cliente / consulente */}
            <View style={S.clientGrid}>
              <View style={S.clientCard}>
                <Text style={S.ccLabel}>CLIENTE</Text>
                <Text style={S.ccName}>{clienteNome || 'Cliente'}</Text>
                {prev.cliente_email    && <Text style={S.ccRow}>{prev.cliente_email}</Text>}
                {prev.cliente_telefono && <Text style={S.ccRow}>+39 {prev.cliente_telefono}</Text>}
              </View>
              <View style={S.clientCard}>
                <Text style={S.ccLabel}>CONSULENTE DI VENDITA</Text>
                <Text style={S.ccName}>Nolosubito S.r.l.</Text>
                <Text style={S.ccRow}>+39 06 400 49490</Text>
                <Text style={S.ccRow}>info@nolosubito.it</Text>
                <Text style={S.ccRow}>nolosubito.it</Text>
              </View>
            </View>

            {/* Veicolo */}
            <View style={S.vehicle}>
              <Text style={S.vLabel}>VEICOLO PROPOSTO</Text>
              <Text style={S.vName}>{prev.veicolo_marca} {prev.veicolo_modello}</Text>
              {(prev.veicolo_versione || prev.alimentazione) && (
                <Text style={S.vVer}>{[prev.veicolo_versione, prev.alimentazione].filter(Boolean).join(' · ')}</Text>
              )}
              <View style={S.vChips}>
                {chips.map((c, i) => c.hot
                  ? <View key={i} style={S.chipHot}><Text style={S.chipHotTxt}>{c.label}</Text></View>
                  : <View key={i} style={S.chip}><Text style={S.chipTxt}>{c.label}</Text></View>
                )}
              </View>
            </View>

            {/* Canone */}
            <View style={S.canoneRow}>
              <View style={S.ctWrap}>
                <Text style={S.ctLabel}>COMPOSIZIONE DEL CANONE</Text>
                <View style={S.ctHead}>
                  <Text style={[S.ctHCell, { flex: 1.6 }]}>VOCE</Text>
                  <Text style={[S.ctHCell, { width: 60, textAlign: 'right' }]}>IVA ESCLUSA</Text>
                  <Text style={[S.ctHCell, { width: 60, textAlign: 'right' }]}>IVA INCLUSA</Text>
                </View>
                <CtRow label="Quota Canone Veicolo" iva_excl={`€ ${fmt(qVN)}`} iva_incl={`€ ${fmt(qVL)}`}/>
                <CtRow label="Quota Canone Servizi"  iva_excl={`€ ${fmt(qSN)}`} iva_incl={`€ ${fmt(qSL)}`}/>
                <CtRow label="Anticipo"               iva_excl={`€ ${fmt(anticipoNetto)}`} iva_incl={`€ ${fmt(anticipo)}`}/>
                <CtRow label="Canone Mensile Totale"  iva_excl={`€ ${fmt(canoneNetto)}`}   iva_incl={`€ ${fmt(canone)}`} isTotal/>
              </View>
              <View style={S.cboxWrap}>
                <View style={S.cboxHdr}>
                  <Text style={S.cboxHdrTxt}>CANONE MENSILE · IVA INCLUSA</Text>
                </View>
                <View style={S.cboxBody}>
                  <View style={S.cboxPrice}>
                    <Text style={S.cboxCur}>€</Text>
                    <Text style={S.cboxNum}>{fmt(canone)}</Text>
                    <Text style={S.cboxPer}>/mese</Text>
                  </View>
                  <Text style={S.cboxSub}>
                    Per {prev.durata_mesi} mesi · {fmtN(prev.km_annui)} km/anno{'\n'}{fmtN(kmTotali)} km totali
                  </Text>
                  <View style={S.cboxAnt}>
                    <Text style={S.cboxAntL}>Anticipo</Text>
                    <Text style={S.cboxAntV}>€ {fmt(anticipo)}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Servizi */}
            <View style={S.svcsHdr}>
              <Text style={S.svcsTitle}>SERVIZI INCLUSI NEL CANONE</Text>
              <View style={S.svcsRule}/>
              <View style={S.svcsBadge}><Text>{SERVIZI.length} servizi</Text></View>
            </View>
            {prev.note_cliente?.trim() && (
              <View style={{ padding: '6 10', backgroundColor: LGRAY, borderLeftWidth: 3, borderLeftColor: NAVY, borderRadius: 3, marginBottom: 7 }}>
                <Text style={{ fontSize: 8.5, color: TEXT, fontStyle: 'italic', lineHeight: 1.5 }}>{prev.note_cliente.trim()}</Text>
              </View>
            )}
            <View style={S.svcsGrid}>
              <View style={S.svcsCol}>{col1.map(([n, m]) => <SvcItem key={n} nome={n} nota={m}/>)}</View>
              <View style={S.svcsCol}>{col2.map(([n, m]) => <SvcItem key={n} nome={n} nota={m}/>)}</View>
              <View style={S.svcsCol}>{col3.map(([n, m]) => <SvcItem key={n} nome={n} nota={m}/>)}</View>
            </View>

          </View>

          <Footer left="info@nolosubito.it · nolosubito.it · +39 06 400 49490" right="Pagina 1 di 2"/>
        </View>
      </Page>

      {/* ══ PAGINA 2 ══ */}
      <Page size="A4" style={S.page}>
        <View style={S.card}>

          <Header rif={rif} oggi={oggi} scadenza={scadenza} logoB64={logoB64} showValid={false}/>

          <View style={S.p2body}>

            <Text style={S.eyebrow}>DETTAGLI TECNICI</Text>
            <Text style={[S.h1, { fontSize: 16, marginBottom: 2 }]}>Caratteristiche del veicolo</Text>
            <Text style={[S.h1navy, { fontSize: 13, fontWeight: 700, marginBottom: 11 }]}>
              {prev.veicolo_marca} {prev.veicolo_modello}{prev.veicolo_versione ? ' ' + prev.veicolo_versione : ''}
            </Text>

            <Text style={S.secTitle}>DATI TECNICI VEICOLO</Text>
            <View style={S.specs2col}>
              <View style={S.specCol}>{specsLeft.map(([k, v]) => <SpecRow key={k} k={k} v={v}/>)}</View>
              <View style={S.specCol}>{specsRight.map(([k, v]) => <SpecRow key={k} k={k} v={v}/>)}</View>
            </View>

            <Text style={S.secTitle}>VALORE DEL VEICOLO</Text>
            <View style={S.valoreGrid}>
              <View style={S.vbox}><Text style={S.vboxL}>LISTING</Text><Text style={S.vboxV}>€ {fmt(listing)}</Text></View>
              <View style={S.vbox}><Text style={S.vboxL}>OPTIONAL</Text><Text style={S.vboxV}>€ {fmt(optional)}</Text></View>
              <View style={S.vbox}><Text style={S.vboxL}>ACCESSORI</Text><Text style={S.vboxV}>€ {fmt(accessori)}</Text></View>
              <View style={S.vboxTot}><Text style={S.vboxTotL}>TOTALE VEICOLO</Text><Text style={S.vboxTotV}>€ {fmt(totVeicolo)}</Text></View>
            </View>

            <Text style={S.secTitle}>PERCHÉ SCEGLIERE NOLOSUBITO</Text>
            <View style={S.whyGrid}>
              {[
                ['🛡️', 'Canone tutto incluso',   'Un solo importo fisso al mese, costi pianificabili senza sorprese.'],
                ['⏱️', '15+ anni di esperienza', 'Sedi a Roma, Napoli, Avellino e Salerno con rete su tutta Italia.'],
                ['✅',  'Burocrazia zero',         'Immatricolazione, bollo, assicurazione: gestiamo tutto noi.'],
                ['💬', 'Customer Care H24',       'Assistenza stradale e consulenti dedicati per tutta la durata.'],
              ].map(([ic, h, p]) => (
                <View key={h} style={S.whyCard}>
                  <Text style={S.whyIc}>{ic}</Text>
                  <Text style={S.whyH}>{h}</Text>
                  <Text style={S.whyP}>{p}</Text>
                </View>
              ))}
            </View>

            <View style={S.cta}>
              <View>
                <Text style={S.ctaTitle}>Accettando l'offerta, attiviamo subito la pratica.</Text>
                <Text style={S.ctaSub}>Pronta consegna · Procedura digitale · Risposta in 24h</Text>
              </View>
              <View style={S.ctaBtn}><Text style={S.ctaBtnTxt}>ACCETTA OFFERTA →</Text></View>
            </View>

            <View style={S.signGrid}>
              <View style={S.signBl}>
                <Text style={S.signLbl}>PER IL CLIENTE</Text>
                <Text style={S.signNm}>{clienteNome || 'Cliente'} · firma per accettazione</Text>
              </View>
              <View style={S.signBl}>
                <Text style={S.signLbl}>PER NOLOSUBITO S.R.L.</Text>
                <Text style={S.signNm}>Il consulente di vendita</Text>
              </View>
            </View>

            <View style={S.legal}>
              <Text style={S.legalH}>NOTE E CONDIZIONI</Text>
              <Text style={S.legalP}>
                <Text style={S.nref}>(1)</Text> Il presente documento non costituisce offerta contrattuale ed è comunque soggetto alla successiva valutazione della nostra Società. I canoni sono stati formulati in base ai listini delle Case Costruttrici attualmente in vigore e potrebbero essere suscettibili di variazioni. Tutti gli importi, salvo ove espressamente indicato, si intendono al netto dell'IVA. L'imposta da applicare è pari al 22%, salvo differenti disposizioni di legge. Le dotazioni del veicolo saranno quelle previste dalla Casa Costruttrice al momento della produzione. R.C.A.: Responsabilità Civile Auto, prevede un massimale e/o una penale. Manutenzione ordinaria: controlli obbligatori periodici. Copertura Danni: garanzia per i danni subiti dal veicolo indipendentemente dalla responsabilità del conducente, salvo dolo o colpa grave.
              </Text>
              <Text style={S.legalH}>INFORMATIVA PRIVACY</Text>
              <Text style={S.legalP}>
                Il titolare del trattamento è Nolosubito S.r.l., Via degli Archivi di Stato 15, Roma. Dati trattati per fornirLe il preventivo richiesto, art. 6 par. 1 lett. b) GDPR. Per esercitare i Suoi diritti: info@nolosubito.it.
              </Text>
            </View>

          </View>

          <Footer left="Via degli Archivi di Stato 15, Roma · info@nolosubito.it · +39 06 400 49490" right={`Pagina 2 di 2 · Ed. 1 — ${mesAnno}`}/>
        </View>
      </Page>

    </Document>
  );
}
