import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Svg,
  Circle,
  Path,
  Line,
  Rect,
  Font,
} from '@react-pdf/renderer';

Font.register({
  family: 'Inter',
  fonts: [
    { src: '/fonts/Inter-Regular.ttf', fontWeight: 400 },
    { src: '/fonts/Inter-Medium.ttf', fontWeight: 500 },
    { src: '/fonts/Inter-Bold.ttf', fontWeight: 700 },
    { src: '/fonts/Inter-ExtraBold.ttf', fontWeight: 800 }
  ]
});

const NAVY = '#36389D';
const ORANGE = '#F6B000';
const PAGE_BG = '#F4F7FB';
const SHEET = '#FFFFFF';
const TEXT = '#1F2942';
const MUTED = '#6D7894';
const SOFT = '#F4F6FB';
const SOFTER = '#FAFBFD';
const BORDER = '#DCE2EF';
const BLUE_TINT = '#EFF1FB';
const GREEN = '#2EAD64';

const fmt = (n) => (n != null ? Number(n).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00');
const fmtN = (n) => (n != null ? Number(n).toLocaleString('it-IT') : '—');

const S = StyleSheet.create({
  page: {
    backgroundColor: PAGE_BG,
    fontFamily: 'Inter',
    fontSize: 9,
    color: TEXT,
  },
  sheet: {
    flex: 1,
    margin: 0,
    backgroundColor: PAGE_BG,
    overflow: 'hidden',
  },
  stripe: { height: 8, backgroundColor: NAVY },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 26,
    paddingTop: 15,
    paddingBottom: 11,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  logoImg: { width: 154, height: 40, objectFit: 'contain' },
  logoFallback: { width: 36, height: 36, borderRadius: 18, backgroundColor: `${NAVY}14`, alignItems: 'center', justifyContent: 'center' },
  tagWrap: {
    paddingLeft: 14,
    borderLeftWidth: 1,
    borderLeftColor: '#CBD3E2',
    paddingVertical: 1,
  },
  tagLine: { fontSize: 7.5, color: '#4B5563', letterSpacing: 1.4, fontWeight: 'bold', lineHeight: 1.15 },
  headerRight: { alignItems: 'flex-end' },
  headerLabel: { fontSize: 8, color: '#4B5563', letterSpacing: 1.1, fontWeight: 'bold' },
  headerNumber: { fontSize: 13.5, color: TEXT, fontWeight: 'bold', marginTop: 2 },
  headerDate: { fontSize: 8.2, color: '#4B5563', marginTop: 5 },
  validPill: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF0C8',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  validDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ORANGE },
  validTxt: { fontSize: 8.2, color: '#875900', fontWeight: 'bold' },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 6,
    position: 'relative',
  },
  pageMeta: { marginTop: 6, marginBottom: 12 },
  pageMetaLabel: { fontSize: 10, color: TEXT, marginBottom: 2 },
  pageMetaNumber: { fontSize: 10, color: TEXT, marginBottom: 2 },
  pageMetaDate: { fontSize: 10, color: TEXT, marginBottom: 2 },

  heroGlow: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 210,
    height: 168,
    backgroundColor: '#FFF8E8',
    opacity: 0.7,
  },
  eyebrow: {
    alignSelf: 'flex-start',
    backgroundColor: '#EAEAF8',
    color: NAVY,
    fontSize: 7.5,
    fontWeight: 'bold',
    letterSpacing: 1.4,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 8,
  },
  h1: {
    fontSize: 19.5,
    lineHeight: 1.18,
    color: TEXT,
    fontWeight: 'bold',
    marginBottom: 13,
  },
  h1Blue: { color: NAVY },
  intro: { fontSize: 8, lineHeight: 1.42, color: '#1F2942', marginBottom: 9, maxWidth: 430 },
  introBold: { color: NAVY, fontWeight: 'bold' },
  introRef: { color: NAVY, fontWeight: 'bold' },

  cardGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    padding: '10 11 9 11',
    backgroundColor: '#FFFFFF',
  },
  cardLabel: {
    fontSize: 7.6,
    fontWeight: 'bold',
    color: '#4B5563',
    letterSpacing: 1.6,
    marginBottom: 6,
  },
  cardIcon: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#F0F0FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardName: { fontSize: 10.8, lineHeight: 1.15, color: TEXT, fontWeight: 'bold', marginBottom: 4, maxWidth: 198 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 2 },
  contactText: { fontSize: 7.9, color: '#374151' },

  vehicle: {
    backgroundColor: NAVY,
    borderRadius: 12,
    padding: '11 13 12 13',
    marginBottom: 9,
    position: 'relative',
    overflow: 'hidden',
  },
  vehicleGlow: {
    position: 'absolute',
    right: -18,
    top: 10,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 197, 0, 0.18)',
  },
  vehicleLabel: {
    color: 'rgba(255,255,255,0.52)',
    fontSize: 7.6,
    letterSpacing: 1.6,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  vehicleLine: {
    position: 'absolute',
    top: 17,
    left: 110,
    width: 118,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  vehicleName: { color: '#FFFFFF', fontSize: 15.2, lineHeight: 1.12, fontWeight: 'bold', marginBottom: 3, maxWidth: 410 },
  vehicleSub: { color: 'rgba(255,255,255,0.72)', fontSize: 8.2, marginBottom: 8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  chipHot: {
    backgroundColor: ORANGE,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  chipHotText: { color: '#3C2B00', fontSize: 7.3, fontWeight: 'bold' },
  chip: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  chipText: { color: 'rgba(255,255,255,0.9)', fontSize: 7.3, fontWeight: 'bold' },

  quoteRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  quoteTable: { flex: 1.6, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: BORDER },
  quoteHead: { flexDirection: 'row', backgroundColor: '#F5F7FD', paddingVertical: 7, paddingHorizontal: 13 },
  quoteHeadCell: { fontSize: 7.4, fontWeight: 'bold', color: '#4B5563', letterSpacing: 1.1 },
  quoteRowLine: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 13, borderBottomWidth: 1, borderBottomColor: BORDER, backgroundColor: '#FFF' },
  quoteRowAlt: { backgroundColor: '#FAFBFD' },
  quoteRowTotal: { backgroundColor: BLUE_TINT },
  quoteCell: { fontSize: 8.1, color: TEXT },
  quoteCellBold: { fontSize: 8.3, color: NAVY, fontWeight: 'bold' },
  quoteCellRight: { width: 92, textAlign: 'right' },
  priceCard: {
    width: 170,
    borderRadius: 12,
    backgroundColor: NAVY,
    paddingHorizontal: 13,
    paddingTop: 12,
    paddingBottom: 10,
    justifyContent: 'space-between',
  },
  priceLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 7.4, letterSpacing: 1.4, fontWeight: 'bold', maxWidth: 120 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, marginTop: 8 },
  priceCurrency: { color: ORANGE, fontSize: 13.5, fontWeight: 'bold', lineHeight: 1 },
  priceValue: { color: '#FFFFFF', fontSize: 22, lineHeight: 1, fontWeight: 'bold' },
  pricePer: { color: 'rgba(255,255,255,0.68)', fontSize: 9, lineHeight: 1.5, marginBottom: 1 },
  priceSub: { color: 'rgba(255,255,255,0.72)', fontSize: 7.1, lineHeight: 1.35, marginTop: 6, marginBottom: 8 },
  priceBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.16)',
    borderTopStyle: 'dashed',
  },
  priceBottomLabel: { color: 'rgba(255,255,255,0.72)', fontSize: 7.6 },
  priceAnt: {
    backgroundColor: '#D39C3D',
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  priceAntTxt: { color: '#F4D06A', fontWeight: 'bold', fontSize: 7.8 },

  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 5 },
  sectionTitle: { fontSize: 7.9, color: NAVY, fontWeight: 'bold', letterSpacing: 1.2 },
  sectionRule: { flex: 1, height: 1, backgroundColor: BORDER },
  sectionBadge: {
    backgroundColor: '#ECECF9',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 7,
  },
  sectionBadgeTxt: { color: NAVY, fontSize: 7.2, fontWeight: 'bold' },
  noteBox: {
    backgroundColor: SOFT,
    borderLeftWidth: 3,
    borderLeftColor: NAVY,
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 5,
  },
  noteTxt: { color: '#374151', fontSize: 7.5, lineHeight: 1.35 },
  servicesGrid: { flexDirection: 'row', gap: 8 },
  servicesCol: { flex: 1 },
  serviceItem: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'flex-start',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F7',
  },
  serviceTextWrap: { flex: 1 },
  serviceTitle: { fontSize: 8, fontWeight: 'bold', color: '#1F2942', marginBottom: 1 },
  serviceMeta: { fontSize: 7, color: '#4B5563', lineHeight: 1.15 },

  p2TitleWrap: { marginTop: 2, marginBottom: 8 },
  p2Hero: { fontSize: 13.8, lineHeight: 1.1, color: TEXT, fontWeight: 'bold', marginBottom: 1 },
  p2HeroBlue: { color: NAVY },
  p2HeroSub: { fontSize: 10.8, lineHeight: 1.1, color: TEXT, fontWeight: 'bold' },

  specsGrid: { flexDirection: 'row', gap: 18, marginBottom: 9 },
  specCol: { flex: 1 },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F7',
  },
  specK: { fontSize: 8.2, color: '#4B5563' },
  specV: { fontSize: 8.2, color: TEXT, fontWeight: 'bold', textAlign: 'right', maxWidth: '56%' },
  valueGrid: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  valueBox: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: SOFTER,
    padding: '9 12',
    minHeight: 60,
    justifyContent: 'space-between',
  },
  valueBoxLabel: { fontSize: 7.1, color: '#4B5563', letterSpacing: 1.1, fontWeight: 'bold', marginBottom: 3 },
  valueBoxValue: { fontSize: 10.8, color: TEXT, fontWeight: 'bold' },
  valueTotal: {
    flex: 1.1,
    borderRadius: 14,
    backgroundColor: NAVY,
    padding: '9 12',
    minHeight: 60,
    justifyContent: 'space-between',
  },
  valueTotalLabel: { fontSize: 7.1, color: 'rgba(255,255,255,0.55)', letterSpacing: 1.1, fontWeight: 'bold' },
  valueTotalValue: { fontSize: 10.8, color: '#F8C12B', fontWeight: 'bold' },

  whyGrid: { flexDirection: 'row', gap: 7, marginBottom: 10 },
  whyCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    padding: '8 8 8 8',
    backgroundColor: '#FFFFFF',
  },
  whyIconBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#F2F2FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  whyTitle: { fontSize: 7.9, fontWeight: 'bold', color: TEXT, marginBottom: 2 },
  whyText: { fontSize: 6.7, color: '#374151', lineHeight: 1.18 },

  cta: {
    backgroundColor: ORANGE,
    borderRadius: 13,
    paddingVertical: 9,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  ctaTitle: { fontSize: 9, fontWeight: 'bold', color: '#2D2000', marginBottom: 1 },
  ctaSub: { fontSize: 7.1, color: '#4B5563' },
  ctaBtn: {
    backgroundColor: NAVY,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 110,
    justifyContent: 'center',
  },
  ctaBtnTxt: { fontSize: 7.2, fontWeight: 'bold', color: '#FFFFFF' },

  signGrid: { flexDirection: 'row', gap: 24, marginBottom: 8 },
  signBlock: { flex: 1, borderTopWidth: 1.4, borderTopColor: TEXT, paddingTop: 4 },
  signLabel: { fontSize: 7.2, color: '#4B5563', letterSpacing: 1.2, fontWeight: 'bold', marginBottom: 1 },
  signName: { fontSize: 7.8, color: '#374151' },

  legal: { fontSize: 5.5, lineHeight: 1.28, color: '#374151' },
  legalSection: { fontSize: 7.5, color: NAVY, fontWeight: 'bold', letterSpacing: 1.2, marginTop: 2, marginBottom: 2 },
  legalBlock: { marginBottom: 3 },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: '#DCE2EF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 26,
    paddingVertical: 7,
  },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ORANGE },
  footerTxt: { fontSize: 6.9, color: '#374151' },
  footerBold: { fontWeight: 'bold', color: TEXT },
  footerRight: { fontSize: 6.9, color: '#374151' },
});

const LogoFallback = () => (
  <View style={S.logoFallback}>
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Circle cx="11" cy="11" r="10" stroke={NAVY} strokeWidth="1.2" fill="none" />
      <Path d="M6.9 5.7v10.6h2.1V9.9l4.2 6.4h1.9V5.7h-2.1v6.4L9 5.7H6.9z" fill={NAVY} />
    </Svg>
  </View>
);

const CardIcon = ({ type, tone = NAVY }) => {
  if (type === 'user') {
    return (
      <Svg width={12} height={12} viewBox="0 0 12 12">
        <Circle cx="6" cy="4" r="2" stroke={tone} strokeWidth="1" fill="none" />
        <Path d="M2.4 9.2c.6-1.7 2-2.7 3.6-2.7s3 1 3.6 2.7" stroke={tone} strokeWidth="1" fill="none" strokeLinecap="round" />
      </Svg>
    );
  }

  if (type === 'pin') {
    return (
      <Svg width={12} height={12} viewBox="0 0 12 12">
        <Path d="M6 10.5s3-2.7 3-5.1A3 3 0 1 0 3 5.4c0 2.4 3 5.1 3 5.1z" stroke={tone} strokeWidth="1" fill="none" />
        <Circle cx="6" cy="5.2" r="1.1" fill={tone} />
      </Svg>
    );
  }

  return null;
};

const SmallIcon = ({ type }) => {
  if (type === 'phone') {
    return (
      <Svg width={10} height={10} viewBox="0 0 12 12">
        <Path d="M3 1.8l1.2-.5 1.8 3.1-1 .8c.6 1.2 1.6 2.2 2.8 2.8l.8-1 3.1 1.8-.5 1.2C10.2 11 6.4 10.4 3.8 7.8S1 2.8 3 1.8z" stroke={NAVY} strokeWidth="0.9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }

  if (type === 'mail') {
    return (
      <Svg width={10} height={10} viewBox="0 0 12 12">
        <Rect x="1.4" y="2.1" width="9.2" height="7.8" rx="1.2" stroke={NAVY} strokeWidth="0.9" fill="none" />
        <Path d="M1.8 3l4.2 3.2L10.2 3" stroke={NAVY} strokeWidth="0.9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }

  if (type === 'globe') {
    return (
      <Svg width={10} height={10} viewBox="0 0 12 12">
        <Circle cx="6" cy="6" r="4.6" stroke={NAVY} strokeWidth="0.9" fill="none" />
        <Path d="M1.7 6h8.6M6 1.4c1.4 1.3 2.2 2.9 2.2 4.6S7.4 9.3 6 10.6M6 1.4c-1.4 1.3-2.2 2.9-2.2 4.6S4.6 9.3 6 10.6" stroke={NAVY} strokeWidth="0.8" fill="none" strokeLinecap="round" />
      </Svg>
    );
  }

  if (type === 'check') {
    return (
      <Svg width={15} height={15} viewBox="0 0 15 15">
        <Circle cx="7.5" cy="7.5" r="7.5" fill="#F0FAF3" />
        <Path d="M4.3 7.5l2 2.1 4.1-4.2" stroke={GREEN} strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }

  if (type === 'shield') {
    return (
      <Svg width={12} height={12} viewBox="0 0 12 12">
        <Path d="M6 1.2 2.2 2.8v2.8c0 2.2 1.6 4.1 3.8 4.8 2.2-.7 3.8-2.6 3.8-4.8V2.8L6 1.2z" stroke={NAVY} strokeWidth="0.9" fill="none" />
      </Svg>
    );
  }

  if (type === 'clock') {
    return (
      <Svg width={12} height={12} viewBox="0 0 12 12">
        <Circle cx="6" cy="6" r="5" stroke={NAVY} strokeWidth="0.9" fill="none" />
        <Path d="M6 3.3V6l1.8 1.2" stroke={NAVY} strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }

  if (type === 'chat') {
    return (
      <Svg width={12} height={12} viewBox="0 0 12 12">
        <Path d="M1.4 2.1h9.2v5.4c0 .6-.5 1.1-1.1 1.1H4.6l-2.8 1.9V2.1z" stroke={NAVY} strokeWidth="0.9" fill="none" strokeLinejoin="round" />
        <Path d="M3.2 4.5h5.6M3.2 6h3.5" stroke={NAVY} strokeWidth="0.9" strokeLinecap="round" />
      </Svg>
    );
  }

  if (type === 'spark') {
    return (
      <Svg width={12} height={12} viewBox="0 0 12 12">
        <Path d="M6 1.3l.8 2.6 2.6.8-2.6.8L6 8.1l-.8-2.6-2.6-.8 2.6-.8L6 1.3z" stroke={NAVY} strokeWidth="0.8" fill="none" />
      </Svg>
    );
  }

  if (type === 'arrow') {
    return (
      <Svg width={12} height={12} viewBox="0 0 12 12">
        <Path d="M2 6h6.5M6.2 3.2 9 6l-2.8 2.8" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }

  if (type === 'gas') {
    return (
      <Svg width={10} height={10} viewBox="0 0 12 12">
        <Path d="M2.5 11V3c0-1.1.9-2 2-2h3c1.1 0 2 .9 2 2v8M1.5 11h9" stroke="#FFFFFF" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M9.5 4.5h2v3h-2" stroke="#FFFFFF" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Rect x="4" y="3.5" width="2" height="2.5" fill="#FFFFFF" />
      </Svg>
    );
  }

  if (type === 'calendar') {
    return (
      <Svg width={10} height={10} viewBox="0 0 12 12">
        <Rect x="1.5" y="2.5" width="9" height="8" rx="1" stroke="#FFFFFF" strokeWidth="1" fill="none" />
        <Path d="M3.5 1.5v2M8.5 1.5v2M1.5 5.5h9" stroke="#FFFFFF" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }

  if (type === 'speed') {
    return (
      <Svg width={10} height={10} viewBox="0 0 12 12">
        <Path d="M1.5 9A4.5 4.5 0 0 1 10.5 9" stroke="#FFFFFF" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx="6" cy="8" r="1" fill="#FFFFFF" />
        <Path d="M6 7L4.5 4.5" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }

  if (type === 'gear') {
    return (
      <Svg width={10} height={10} viewBox="0 0 12 12">
        <Circle cx="6" cy="6" r="2.5" stroke="#FFFFFF" strokeWidth="1" fill="none" />
        <Path d="M6 1.5V3M6 9v1.5M9 6h1.5M1.5 6H3M9.2 2.8L8.1 3.9M3.9 8.1L2.8 9.2M9.2 9.2L8.1 8.1M3.9 3.9L2.8 2.8" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }

  return null;
};

const WIcon = ({ type }) => {
  const map = {
    shield: <SmallIcon type="shield" />,
    clock: <SmallIcon type="clock" />,
    check: <SmallIcon type="check" />,
    chat: <SmallIcon type="chat" />,
  };

  return <View>{map[type]}</View>;
};

const CheckItem = ({ nome, nota }) => (
  <View style={S.serviceItem}>
    <SmallIcon type="check" />
    <View style={S.serviceTextWrap}>
      <Text style={S.serviceTitle}>{nome}</Text>
      <Text style={S.serviceMeta}>{nota}</Text>
    </View>
  </View>
);

const SpecRow = ({ k, v }) => (
  <View style={S.specRow}>
    <Text style={S.specK}>{k}</Text>
    <Text style={S.specV}>{v}</Text>
  </View>
);

const QuoteRow = ({ label, excl, incl, total = false, alt = false }) => (
  <View style={[S.quoteRowLine, alt && S.quoteRowAlt, total && S.quoteRowTotal]}>
    <Text style={[total ? S.quoteCellBold : S.quoteCell, { flex: 1.5 }]}>{label}</Text>
    <Text style={[total ? S.quoteCellBold : S.quoteCell, S.quoteCellRight]}>{excl}</Text>
    <Text style={[total ? S.quoteCellBold : S.quoteCell, S.quoteCellRight]}>{incl}</Text>
  </View>
);

const Footer = ({ left, right }) => (
  <View style={S.footer}>
    <View style={S.footerLeft}>
      <View style={S.footerDot} />
      <Text style={S.footerTxt}>
        <Text style={S.footerBold}>Nolosubito S.r.l.</Text>
        <Text> · {left}</Text>
      </Text>
    </View>
    <Text style={S.footerRight}>{right}</Text>
  </View>
);

const Header = ({ rif, oggi, scadenza, logoSrc }) => (
  <View style={S.header}>
    <View style={S.headerLeft}>
      {logoSrc ? <Image src={logoSrc} style={S.logoImg} /> : <LogoFallback />}
      <View style={S.tagWrap}>
        <Text style={S.tagLine}>NOLEGGIO A</Text>
        <Text style={S.tagLine}>LUNGO TERMINE</Text>
      </View>
    </View>
    <View style={S.headerRight}>
      <Text style={S.headerLabel}>OFFERTA N.</Text>
      <Text style={S.headerNumber}>{rif}</Text>
      <Text style={S.headerDate}>Emessa il {oggi}</Text>
      <View style={S.validPill}>
        <View style={S.validDot} />
        <Text style={S.validTxt}>Valida fino al {scadenza}</Text>
      </View>
    </View>
  </View>
);

const PageShell = ({ children, footerLeft, footerRight, logoSrc, rif, oggi, scadenza, showMeta = false, meta = null }) => (
  <Page size="A4" style={S.page}>
    <View style={S.sheet}>
      <View style={S.stripe} />
      <Header rif={rif} oggi={oggi} scadenza={scadenza} logoSrc={logoSrc} />
      <View style={S.content} wrap={false}>
        {showMeta && (
          <View style={S.pageMeta}>
            <Text style={S.pageMetaLabel}>Offerta N.</Text>
            <Text style={S.pageMetaNumber}>{meta?.rif || rif}</Text>
            <Text style={S.pageMetaDate}>Emessa il {meta?.oggi || oggi}</Text>
            <Text style={S.pageMetaDate}>Valida fino al {meta?.scadenza || scadenza}</Text>
          </View>
        )}
        {children}
      </View>
      <Footer left={footerLeft} right={footerRight} />
    </View>
  </Page>
);

// Mappa label canonico (dall'edge function) → [etichetta display, descrizione breve]
const SERVIZI_CANONICAL_MAP = {
  'R.C.A. Responsabilità Civile':     ['R.C.A. Responsabilità Civile',  'Massimale e penale variano in base al carrier scelto'],
  'Incendio e Furto':                 ['Incendio e Furto',              'Penale variabile in base al carrier scelto'],
  'Copertura Danni':                  ['Copertura Danni',               'Penale variabile in base al carrier scelto'],
  'Manutenzione Ordinaria e Straordinaria': ['Manutenzione Ordinaria e Straordinaria', 'Tagliandi e riparazioni inclusi'],
  'Soccorso Stradale':                ['Soccorso Stradale',             'Assistenza e traino inclusi'],
  'Cristalli':                        ['Cristalli',                     'Riparazione/sostituzione inclusa'],
  'Gestione Multe':                   ['Gestione Multe',                'Rinotifica contravvenzioni inclusa'],
  'Gestione Sinistri':                ['Gestione Sinistri',             'Supporto pratiche sinistro'],
  'Pneumatici':                       ['Pneumatici',                    'Sostituzione inclusa secondo usura'],
  'Tassa di Proprietà':               ['Tassa di Proprietà',            'Gestione e pagamento bollo auto'],
  'Auto Sostitutiva':                 ['Auto Sostitutiva',              'Veicolo sostitutivo in caso di fermo'],
  'Telematica':                       ['Telematica',                    'Dispositivo GPS/Blackbox incluso'],
  'Infortuni Conducente':             ['Infortuni Conducente',          'Polizza assicurativa inclusa'],
  'Tutela Legale':                    ['Tutela Legale',                 'Assistenza legale inclusa'],
  'Consegna del Veicolo':             ['Consegna del Veicolo',          'Consegna presso hub o domicilio'],
  'Fatturazione Elettronica':         ['Fatturazione Elettronica',      'Emissione digitale delle fatture'],
  'Eventi Atmosferici':               ['Eventi Atmosferici',            'Copertura da grandine e meteo'],
  'Immatricolazione':                 ['Immatricolazione',              'Messa su strada inclusa'],
};

// Mappa servizio normalizzato → [etichetta display, descrizione breve] (legacy)
const SERVIZI_MAP = {
  'rca':                            ['R.C.A. Responsabilità Civile',  'Massimale e penale variano in base al carrier scelto'],
  'copertura danni':                ['Copertura Danni',               'Penale variabile in base al carrier scelto'],
  'copertura danni kasko':          ['Copertura Danni',               'Penale variabile in base al carrier scelto'],
  'kasko':                          ['Copertura Danni',               'Penale variabile in base al carrier scelto'],
  'copertura incendio e furto':     ['Incendio e Furto',              'Penale variabile in base al carrier scelto'],
  'incendio e furto':               ['Incendio e Furto',              'Penale variabile in base al carrier scelto'],
  'manutenzione ordinaria e straordinaria': ['Manutenzione Ordinaria e Straordinaria', 'Tagliandi e riparazioni inclusi'],
  'manutenzione ordinaria':         ['Manutenzione Ordinaria',        'Tagliandi periodici programmati'],
  'manutenzione straordinaria':     ['Manutenzione Straordinaria',    'Riparazioni per usura'],
  'tassa di proprietà':             ['Tassa di Proprietà',            'Gestione e pagamento bollo auto'],
  'immatricolazione':               ['Immatricolazione',              'Messa su strada inclusa'],
  'pneumatici':                     ['Pneumatici',                    'Sostituzione inclusa secondo usura'],
  'soccorso stradale':              ['Soccorso Stradale',             'Assistenza e traino inclusi'],
  'auto sostitutiva':               ['Auto Sostitutiva',              'Veicolo sostitutivo in caso di fermo'],
  'gestione multe':                 ['Gestione Multe',                'Rinotifica contravvenzioni inclusa'],
  'copertura cristalli':            ['Cristalli',                     'Riparazione/sostituzione inclusa'],
  'cristalli':                      ['Cristalli',                     'Riparazione/sostituzione inclusa'],
  'infortuni conducente':           ['Infortuni Conducente',          'Polizza assicurativa inclusa'],
  'tutela legale':                  ['Tutela Legale',                 'Assistenza legale inclusa'],
  'telematica':                     ['Telematica',                    'Dispositivo GPS/Blackbox incluso'],
  'fatturazione elettronica':       ['Fatturazione Elettronica',      'Emissione digitale delle fatture'],
  'consegna del veicolo':           ['Consegna del Veicolo',          'Consegna presso hub o domicilio'],
  'consegna c o hub auto':          ['Consegna del Veicolo',          'Consegna presso hub o domicilio'],
  'eventi atmosferici':             ['Eventi Atmosferici',            'Copertura da grandine e meteo'],
  'my leasys app':                  ['Telematica',                    'App di gestione contratto'],
  'i care smart':                   ['Telematica',                    'Servizi digitali e assistenza'],
  'traino standard':                ['Soccorso Stradale',             'Soccorso e traino incluso'],
  'gestione sinistri':              ['Gestione Sinistri',             'Supporto pratiche sinistro'],
};

function normalizeServiceKey(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const SERVIZI_DEFAULT = [
  ['R.C.A. Responsabilità Civile', 'Massimale e penale variano in base al carrier scelto'],
  ['Copertura Danni',              'Penale variabile in base al carrier scelto'],
  ['Incendio e Furto',             'Penale variabile in base al carrier scelto'],
  ['Manutenzione Ordinaria e Straordinaria', 'Tagliandi e riparazioni inclusi'],
  ['Soccorso Stradale',            'Assistenza e traino inclusi'],
  ['Cristalli',                    'Riparazione/sostituzione inclusa'],
  ['Gestione Multe',               'Rinotifica contravvenzioni inclusa'],
  ['Gestione Sinistri',            'Supporto pratiche sinistro'],
  ['Pneumatici',                   'Sostituzione inclusa secondo usura'],
  ['Tassa di Proprietà',           'Gestione e pagamento bollo auto'],
  ['Auto Sostitutiva',             'Veicolo sostitutivo in caso di fermo'],
  ['Telematica',                   'Dispositivo GPS/Blackbox incluso'],
];

// Estrae servizi da note_operative (formato: "Servizi inclusi: X, Y, Z")
function parseServizi(noteOperative) {
  if (!noteOperative) return null;
  const match = noteOperative.match(/Servizi inclusi:\s*([^\n]+)/i);
  if (!match) return null;
  const nomi = match[1].split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  if (nomi.length === 0) return null;
  return nomi.map(n => SERVIZI_MAP[normalizeServiceKey(n)] || [n.replace(/\b\w/g, c => c.toUpperCase()), '']).filter(Boolean);
}

export function PreventivoPdfDoc({ prev, clienteNome, logoB64 }) {
  const rif = `NS-${prev.id.slice(-6).toUpperCase()}`;
  const oggi = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  const scadenza = new Date(Date.now() + 5 * 86400000).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  const mesAnno = new Date().toLocaleDateString('it-IT', { month: '2-digit', year: 'numeric' });

  const canone = Number(prev.canone_finale ?? prev.canone_mensile);
  const canoneNetto = canone / 1.22;
  const anticipo = Number(prev.anticipo) || 0;
  const anticipoNetto = anticipo / 1.22;
  const kmTotali = Number(prev.km_annui) * (Number(prev.durata_mesi) / 12);
  const qVN = canoneNetto * 0.67;
  const qSN = canoneNetto * 0.33;
  const qVL = canone * 0.67;
  const qSL = canone * 0.33;

  const listing = Number(prev.valore_listing || prev.valore_veicolo || 0);
  const optional = Number(prev.valore_optional || 0);
  const accessori = Number(prev.valore_accessori || 0);
  const totVeicolo = listing + optional + accessori;

  const specsLeft = [
    ['Marca', prev.veicolo_marca || '—'],
    ['Modello', prev.veicolo_modello || '—'],
    ['Versione', prev.veicolo_versione || '—'],
    ['Alimentazione', prev.alimentazione || '—'],
    ['Cambio', prev.cambio || '—'],
    ['Carrozzeria', prev.carrozzeria || '—'],
    ['Potenza', prev.potenza || '—'],
  ];
  const specsRight = [
    ['Colore esterno', prev.colore_esterno || 'A definire'],
    ['Interni', prev.interni || 'A definire'],
    ['Emissioni CO₂', prev.emissioni_co2 || '—'],
    ['Classe ambientale', prev.classe_ambientale || '—'],
    ['Deposito cauzionale', prev.deposito_cauzionale != null ? `€ ${fmt(prev.deposito_cauzionale)}` : '—'],
    ['Durata contratto', `${prev.durata_mesi} mesi`],
    ['Km annui', `${fmtN(prev.km_annui)} km`],
    ['Km totali', `${fmtN(kmTotali)} km`],
  ];

  const chips = [
    { label: 'Pronta consegna', hot: true },
    ...(prev.alimentazione ? [{ label: prev.alimentazione, icon: 'gas' }] : []),
    { label: `${prev.durata_mesi} mesi`, icon: 'calendar' },
    { label: `${fmtN(prev.km_annui)} km/anno`, icon: 'speed' },
    ...(prev.cambio ? [{ label: prev.cambio, icon: 'gear' }] : []),
  ];

  // Usa servizi salvati sul preventivo (coppie [canonical, original])
  // Prima prova match diretto sul label canonico, poi fallback a normalizeServiceKey (legacy)
  const serviziRaw = prev.servizi?.length > 0 ? prev.servizi : null;
  const servizi = serviziRaw
    ? serviziRaw.map((s) => {
        // Handle both formats: [canonical, original] pairs and plain strings (legacy)
        const [canonical, original] = Array.isArray(s) ? s : [s, null];
        // Match diretto sul label canonico (nuovo formato dall'edge function)
        const canonicalMapped = SERVIZI_CANONICAL_MAP[canonical];
        if (canonicalMapped) return [canonicalMapped[0], original || canonicalMapped[1]];
        // Fallback: match normalizzato (legacy)
        const normalizedMapped = SERVIZI_MAP[normalizeServiceKey(canonical)];
        if (normalizedMapped) return [normalizedMapped[0], original || normalizedMapped[1]];
        return [canonical, original || ''];
      })
    : parseServizi(prev.note_operative) ?? SERVIZI_DEFAULT;
  const col1 = servizi.filter((_, i) => i % 3 === 0);
  const col2 = servizi.filter((_, i) => i % 3 === 1);
  const col3 = servizi.filter((_, i) => i % 3 === 2);

  const logoSrc = logoB64 || null;

  return (
    <Document title={`Preventivo ${rif} — Nolosubito`} author="Nolosubito S.r.l.">
      <PageShell
        logoSrc={logoSrc}
        rif={rif}
        oggi={oggi}
        scadenza={scadenza}
        footerLeft="info@nolosubito.it · nolosubito.it · +39 06 400 49490"
        footerRight="Pagina 1 di 2"
      >
        <View style={S.heroGlow} />

        <Text style={S.eyebrow}>PROPOSTA PERSONALIZZATA</Text>
        <Text style={S.h1}>
          <Text style={S.h1Blue}>Proposta di noleggio a lungo termine{'\n'}di veicolo in locazione</Text>
        </Text>
        <Text style={S.intro}>
          Gentile <Text style={S.introBold}>{clienteNome || 'Cliente'}</Text>, abbiamo il piacere di trasmetterle l'offerta a Lei dedicata
          <Text style={S.introRef}>(1)</Text>. La ringraziamo per la preferenza accordataci e restiamo a Sua disposizione per qualsiasi chiarimento.
          Tutti i servizi inclusi nel canone mensile sono pensati per garantirLe una mobilità completa, sicura e senza pensieri.
        </Text>

        <View style={S.cardGrid}>
          <View style={S.card}>
            <View style={S.cardIcon}><CardIcon type="user" /></View>
            <Text style={S.cardLabel}>CLIENTE</Text>
            <Text style={S.cardName}>{clienteNome || 'Cliente'}</Text>
            {prev.cliente_email ? (
              <View style={S.contactRow}>
                <SmallIcon type="mail" />
                <Text style={S.contactText}>{prev.cliente_email}</Text>
              </View>
            ) : null}
            {prev.cliente_telefono ? (
              <View style={S.contactRow}>
                <SmallIcon type="phone" />
                <Text style={S.contactText}>+39 {prev.cliente_telefono}</Text>
              </View>
            ) : null}
          </View>

          <View style={S.card}>
            <View style={S.cardIcon}><CardIcon type="pin" /></View>
            <Text style={S.cardLabel}>CONSULENTE DI VENDITA</Text>
            <Text style={S.cardName}>Nolosubito S.r.l.</Text>
            <View style={S.contactRow}>
              <SmallIcon type="phone" />
              <Text style={S.contactText}>+39 06 400 49490</Text>
            </View>
            <View style={S.contactRow}>
              <SmallIcon type="mail" />
              <Text style={S.contactText}>info@nolosubito.it</Text>
            </View>
            <View style={S.contactRow}>
              <SmallIcon type="globe" />
              <Text style={S.contactText}>nolosubito.it</Text>
            </View>
          </View>
        </View>

        <View style={S.vehicle}>
          <View style={S.vehicleGlow} />
          <Text style={S.vehicleLabel}>VEICOLO PROPOSTO</Text>
          <View style={S.vehicleLine} />
          <Text style={S.vehicleName}>{prev.veicolo_marca} {prev.veicolo_modello}</Text>
          {(prev.veicolo_versione || prev.alimentazione) && (
            <Text style={S.vehicleSub}>{[prev.veicolo_versione, prev.alimentazione].filter(Boolean).join(' · ')}</Text>
          )}
          <View style={S.chipWrap}>
            {chips.map((c, i) => (
              c.hot ? (
                <View key={i} style={S.chipHot}>
                  <SmallIcon type="check" />
                  <Text style={S.chipHotText}>{c.label}</Text>
                </View>
              ) : (
                <View key={i} style={S.chip}>
                  {c.icon && <SmallIcon type={c.icon} />}
                  <Text style={S.chipText}>{c.label}</Text>
                </View>
              )
            ))}
          </View>
        </View>

        <View style={S.quoteRow}>
          <View style={S.quoteTable}>
            <View style={S.quoteHead}>
              <Text style={[S.quoteHeadCell, { flex: 1.5 }]}>COMPOSIZIONE DEL CANONE</Text>
              <Text style={[S.quoteHeadCell, S.quoteCellRight]}>IVA ESCLUSA</Text>
              <Text style={[S.quoteHeadCell, S.quoteCellRight]}>IVA INCLUSA</Text>
            </View>
            <QuoteRow label="Quota Canone Veicolo" excl={`€ ${fmt(qVN)}`} incl={`€ ${fmt(qVL)}`} />
            <QuoteRow label="Quota Canone Servizi" excl={`€ ${fmt(qSN)}`} incl={`€ ${fmt(qSL)}`} alt />
            <QuoteRow label="Anticipo" excl={`€ ${fmt(anticipoNetto)}`} incl={`€ ${fmt(anticipo)}`} />
            <QuoteRow label="Canone Mensile Totale" excl={`€ ${fmt(canoneNetto)}`} incl={`€ ${fmt(canone)}`} total />
          </View>

          <View style={S.priceCard}>
            <Text style={S.priceLabel}>CANONE MENSILE · IVA INCLUSA</Text>
            <View>
              <View style={S.priceRow}>
                <Text style={S.priceCurrency}>€</Text>
                <Text style={S.priceValue}>{fmt(canone)}</Text>
              </View>
              <Text style={S.pricePer}>/mese</Text>
              <Text style={S.priceSub}>
                Per {prev.durata_mesi} mesi · {fmtN(prev.km_annui)} km/anno{'\n'}{fmtN(kmTotali)} km totali
              </Text>
            </View>
            <View style={S.priceBottom}>
              <Text style={S.priceBottomLabel}>Anticipo</Text>
              <View style={S.priceAnt}>
                <Text style={S.priceAntTxt}>€ {fmt(anticipo)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={S.sectionTitleRow}>
          <Text style={S.sectionTitle}>SERVIZI INCLUSI NEL CANONE</Text>
          <View style={S.sectionRule} />
          <View style={S.sectionBadge}>
            <Text style={S.sectionBadgeTxt}>{servizi.length} servizi</Text>
          </View>
        </View>

        {prev.note_cliente?.trim() ? (
          <View style={S.noteBox}>
            <Text style={S.noteTxt}>{prev.note_cliente.trim()}</Text>
          </View>
        ) : null}

        <View style={S.servicesGrid}>
          <View style={S.servicesCol}>{col1.map(([n, m]) => <CheckItem key={n} nome={n} nota={m} />)}</View>
          <View style={S.servicesCol}>{col2.map(([n, m]) => <CheckItem key={n} nome={n} nota={m} />)}</View>
          <View style={S.servicesCol}>{col3.map(([n, m]) => <CheckItem key={n} nome={n} nota={m} />)}</View>
        </View>

        <View style={[S.noteBox, { marginTop: 5 }]}>
          <Text style={S.noteTxt}>
            I massimali, le penali e le condizioni specifiche dei servizi inclusi possono variare in base alla società di noleggio selezionata. I dettagli verranno confermati in fase di attivazione del contratto.
          </Text>
        </View>
      </PageShell>

      <PageShell
        logoSrc={logoSrc}
        rif={rif}
        oggi={oggi}
        scadenza={scadenza}
        footerLeft="Via degli Archivi di Stato 15, Roma · info@nolosubito.it · +39 06 400 49490"
        footerRight={`Pagina 2 di 2 · Ed. 1 — ${mesAnno}`}
      >
        <Text style={S.eyebrow}>DETTAGLI TECNICI</Text>
        <View style={S.p2TitleWrap}>
          <Text style={S.p2Hero}>
            <Text style={S.p2HeroBlue}>Caratteristiche del veicolo</Text>
          </Text>
          <Text style={S.p2HeroSub}>
            {prev.veicolo_marca} {prev.veicolo_modello}{prev.veicolo_versione ? ` ${prev.veicolo_versione}` : ''}
          </Text>
        </View>

        <View style={{ marginBottom: 10 }}>
          <Text style={S.sectionTitle}>DATI TECNICI VEICOLO</Text>
        </View>
        <View style={S.specsGrid}>
          <View style={S.specCol}>{specsLeft.map(([k, v]) => <SpecRow key={k} k={k} v={v} />)}</View>
          <View style={S.specCol}>{specsRight.map(([k, v]) => <SpecRow key={k} k={k} v={v} />)}</View>
        </View>

        <View style={{ marginBottom: 10 }}>
          <Text style={S.sectionTitle}>VALORE DEL VEICOLO</Text>
        </View>
        <View style={S.valueGrid}>
          <View style={S.valueBox}>
            <Text style={S.valueBoxLabel}>LISTINO</Text>
            <Text style={S.valueBoxValue}>€ {fmt(listing)}</Text>
          </View>
          <View style={S.valueBox}>
            <Text style={S.valueBoxLabel}>OPTIONAL</Text>
            <Text style={S.valueBoxValue}>€ {fmt(optional)}</Text>
          </View>
          <View style={S.valueBox}>
            <Text style={S.valueBoxLabel}>ACCESSORI</Text>
            <Text style={S.valueBoxValue}>€ {fmt(accessori)}</Text>
          </View>
          <View style={S.valueTotal}>
            <Text style={S.valueTotalLabel}>TOTALE VEICOLO</Text>
            <Text style={S.valueTotalValue}>€ {fmt(totVeicolo)}</Text>
          </View>
        </View>

        <View style={{ marginBottom: 10 }}>
          <Text style={S.sectionTitle}>PERCHÉ SCEGLIERE NOLOSUBITO</Text>
        </View>
        <View style={S.whyGrid}>
          {[
            { ic: <WIcon type="shield" />, h: 'Canone tutto incluso', p: 'Un solo importo fisso al mese, costi pianificabili senza sorprese.' },
            { ic: <WIcon type="clock" />, h: '15+ anni di esperienza', p: 'Sedi a Roma, Napoli, Avellino e Salerno con rete su tutta Italia.' },
            { ic: <WIcon type="check" />, h: 'Burocrazia zero', p: 'Immatricolazione, bollo, assicurazione: gestiamo tutto noi.' },
            { ic: <WIcon type="chat" />, h: 'Customer Care H24', p: 'Assistenza stradale e consulenti dedicati per tutta la durata.' },
          ].map(({ ic, h, p }) => (
            <View key={h} style={S.whyCard}>
              <View style={S.whyIconBox}>{ic}</View>
              <Text style={S.whyTitle}>{h}</Text>
              <Text style={S.whyText}>{p}</Text>
            </View>
          ))}
        </View>

        <View style={S.cta}>
          <View>
            <Text style={S.ctaTitle}>Accettando l'offerta, attiviamo subito la pratica.</Text>
            <Text style={S.ctaSub}>Pronta consegna · Procedura digitale · Risposta in 24h</Text>
          </View>
          <View style={S.ctaBtn}>
            <Text style={S.ctaBtnTxt}>ACCETTA OFFERTA</Text>
            <SmallIcon type="arrow" />
          </View>
        </View>

        <View style={S.signGrid}>
          <View style={S.signBlock}>
            <Text style={S.signLabel}>PER IL CLIENTE</Text>
            <Text style={S.signName}>{clienteNome || 'Cliente'} · firma per accettazione</Text>
          </View>
          <View style={S.signBlock}>
            <Text style={S.signLabel}>PER NOLOSUBITO S.R.L.</Text>
            <Text style={S.signName}>Il consulente di vendita</Text>
          </View>
        </View>

        <View style={S.legal}>
          <Text style={S.legalSection}>NOTE E CONDIZIONI</Text>
          <Text style={S.legalBlock}>
            <Text style={{ color: NAVY, fontWeight: 'bold' }}>(1)</Text> Il presente documento non costituisce offerta contrattuale ed è comunque soggetto alla successiva valutazione della nostra Società. I canoni sono stati formulati in base ai listini delle Case Costruttrici attualmente in vigore, ivi incluse le dotazioni di serie, e potrebbero essere suscettibili di variazioni. Tutti gli importi, salvo ove espressamente indicato, si intendono al netto dell'IVA. L'imposta da applicare è pari al 22%, salvo differenti disposizioni di legge.
          </Text>
          <Text style={S.legalBlock}>
            <Text style={{ color: NAVY, fontWeight: 'bold' }}>(2)</Text> Le dotazioni del veicolo saranno quelle previste dalla Casa Costruttrice al momento della produzione. I valori sono quelli comunicati dal Costruttore al momento dell'offerta. Nolosubito non risponde della correttezza dei medesimi così come di eventuali variazioni comunicate successivamente all'offerta.
          </Text>
          <Text style={S.legalBlock}>
            <Text style={{ color: NAVY, fontWeight: 'bold' }}>* </Text>Si informa che il valore di CO₂ esposto è soggetto a possibili variazioni in base alle metodologie WLTP. R.C.A.: Responsabilità Civile Auto, prevede un massimale e/o una penale. Manutenzione ordinaria: controlli obbligatori periodici. Copertura Danni: garanzia per i danni subiti dal veicolo indipendentemente dalla responsabilità del conducente, salvo dolo o colpa grave, in caso di urto, uscita di strada, ribaltamento, incendio, tentato furto, eventi sociopolitici o atti vandalici.
          </Text>

          <Text style={S.legalSection}>INFORMATIVA PRIVACY</Text>
          <Text style={S.legalBlock}>
            Il titolare del trattamento dei dati personali inseriti nel presente modulo è Nolosubito S.r.l., con sede legale in Via degli Archivi di Stato 15, Roma. I dati sono trattati per fornirLe il preventivo richiesto, sulla base dell'art. 6, par. 1, lett. b) GDPR, nonché per finalità gestionali e analitiche interne, sulla base dell'art. 6, par. 1, lett. f) GDPR, nel rispetto del principio di proporzionalità. I dati sono trattati con modalità elettroniche e, ove non seguisse una Sua richiesta o affidamento, saranno eliminati entro 90 giorni dalla compilazione del presente modulo. Per esercitare i Suoi diritti, così come previsti dal Regolamento UE 2016/679, può scrivere a info@nolosubito.it. Ha inoltre diritto di presentare un reclamo, nelle forme e modalità stabilite dalla legge, al Garante per la protezione dei dati personali.
          </Text>
        </View>
      </PageShell>
    </Document>
  );
}
