// COMPLETE GEOGRAPHIC DATA - KOTA SURABAYA
// Source: Kemendagri (Permendagri No. 137/2017) + Pos Indonesia
// Cross-verified: kodepos.vercel.app API (Feb 2026)
// 31 Kecamatan, 154 Kelurahan — AKURAT & LENGKAP

export interface Kelurahan {
  kode: string;
  nama: string;
  kodepos: string[];
}

export interface Kecamatan {
  kode: string;
  nama: string;
  kelurahan: Kelurahan[];
}

export interface GeographicData {
  kecamatan: Kecamatan[];
}

export const geographicData: GeographicData = {
  kecamatan: [
    // ====== SURABAYA PUSAT (5 Kecamatan) ======
    {
      kode: '3578010',
      nama: 'Tegalsari',
      kelurahan: [
        { kode: '3578010001', nama: 'Dr. Soetomo', kodepos: ['60264'] },
        { kode: '3578010002', nama: 'Kedungdoro', kodepos: ['60261'] },
        { kode: '3578010003', nama: 'Tegalsari', kodepos: ['60262'] },
        { kode: '3578010004', nama: 'Wonorejo', kodepos: ['60263'] },
        { kode: '3578010005', nama: 'Keputran', kodepos: ['60265'] }
      ]
    },
    {
      kode: '3578020',
      nama: 'Genteng',
      kelurahan: [
        { kode: '3578020001', nama: 'Genteng', kodepos: ['60275'] },
        { kode: '3578020002', nama: 'Ketabang', kodepos: ['60272'] },
        { kode: '3578020003', nama: 'Kapasari', kodepos: ['60273'] },
        { kode: '3578020004', nama: 'Peneleh', kodepos: ['60274'] },
        { kode: '3578020005', nama: 'Embong Kaliasin', kodepos: ['60271'] }
      ]
    },
    {
      kode: '3578030',
      nama: 'Bubutan',
      kelurahan: [
        { kode: '3578030001', nama: 'Bubutan', kodepos: ['60174'] },
        { kode: '3578030002', nama: 'Gundih', kodepos: ['60172'] },
        { kode: '3578030003', nama: 'Jepara', kodepos: ['60171'] },
        { kode: '3578030004', nama: 'Alun-Alun Contong', kodepos: ['60174'] },
        { kode: '3578030005', nama: 'Tembok Dukuh', kodepos: ['60173'] }
      ]
    },
    {
      kode: '3578040',
      nama: 'Simokerto',
      kelurahan: [
        { kode: '3578040001', nama: 'Simokerto', kodepos: ['60143'] },
        { kode: '3578040002', nama: 'Tambakrejo', kodepos: ['60142'] },
        { kode: '3578040003', nama: 'Kapasan', kodepos: ['60141'] },
        { kode: '3578040004', nama: 'Simolawang', kodepos: ['60144'] },
        { kode: '3578040005', nama: 'Sidodadi', kodepos: ['60145'] }
      ]
    },
    {
      kode: '3578050',
      nama: 'Pabean Cantian',
      kelurahan: [
        { kode: '3578050001', nama: 'Bongkaran', kodepos: ['60161'] },
        { kode: '3578050002', nama: 'Nyamplungan', kodepos: ['60162'] },
        { kode: '3578050003', nama: 'Krembangan Utara', kodepos: ['60163'] },
        { kode: '3578050004', nama: 'Perak Timur', kodepos: ['60164'] },
        { kode: '3578050005', nama: 'Perak Utara', kodepos: ['60165'] }
      ]
    },
    // ====== SURABAYA TIMUR (6 Kecamatan) ======
    {
      kode: '3578060',
      nama: 'Gubeng',
      kelurahan: [
        { kode: '3578060001', nama: 'Gubeng', kodepos: ['60281'] },
        { kode: '3578060002', nama: 'Pucang Sewu', kodepos: ['60283'] },
        { kode: '3578060003', nama: 'Mojo', kodepos: ['60285'] },
        { kode: '3578060004', nama: 'Airlangga', kodepos: ['60286'] },
        { kode: '3578060005', nama: 'Kertajaya', kodepos: ['60282'] },
        { kode: '3578060006', nama: 'Barata Jaya', kodepos: ['60284'] }
      ]
    },
    {
      kode: '3578070',
      nama: 'Rungkut',
      kelurahan: [
        { kode: '3578070001', nama: 'Wonorejo', kodepos: ['60296'] },
        { kode: '3578070002', nama: 'Medokan Ayu', kodepos: ['60295'] },
        { kode: '3578070003', nama: 'Kalirungkut', kodepos: ['60293'] },
        { kode: '3578070004', nama: 'Penjaringansari', kodepos: ['60297'] },
        { kode: '3578070005', nama: 'Kedung Baruk', kodepos: ['60298'] },
        { kode: '3578070006', nama: 'Rungkut Kidul', kodepos: ['60293'] }
      ]
    },
    {
      kode: '3578080',
      nama: 'Tenggilis Mejoyo',
      kelurahan: [
        { kode: '3578080001', nama: 'Tenggilis Mejoyo', kodepos: ['60292'] },
        { kode: '3578080002', nama: 'Panjang Jiwo', kodepos: ['60299'] },
        { kode: '3578080003', nama: 'Kutisari', kodepos: ['60291'] },
        { kode: '3578080004', nama: 'Kendangsari', kodepos: ['60292'] }
      ]
    },
    {
      kode: '3578090',
      nama: 'Gunung Anyar',
      kelurahan: [
        { kode: '3578090001', nama: 'Gunung Anyar', kodepos: ['60294'] },
        { kode: '3578090002', nama: 'Gunung Anyar Tambak', kodepos: ['60294'] },
        { kode: '3578090003', nama: 'Rungkut Menanggal', kodepos: ['60293'] },
        { kode: '3578090004', nama: 'Rungkut Tengah', kodepos: ['60293'] }
      ]
    },
    {
      kode: '3578100',
      nama: 'Sukolilo',
      kelurahan: [
        { kode: '3578100001', nama: 'Nginden Jangkungan', kodepos: ['60118'] },
        { kode: '3578100002', nama: 'Semolowaru', kodepos: ['60119'] },
        { kode: '3578100003', nama: 'Klampis Ngasem', kodepos: ['60117'] },
        { kode: '3578100004', nama: 'Medokan Semampir', kodepos: ['60119'] },
        { kode: '3578100005', nama: 'Menur Pumpungan', kodepos: ['60118'] },
        { kode: '3578100006', nama: 'Keputih', kodepos: ['60111'] },
        { kode: '3578100007', nama: 'Gebang Putih', kodepos: ['60117'] }
      ]
    },
    {
      kode: '3578110',
      nama: 'Mulyorejo',
      kelurahan: [
        { kode: '3578110001', nama: 'Mulyorejo', kodepos: ['60115'] },
        { kode: '3578110002', nama: 'Kalisari', kodepos: ['60112'] },
        { kode: '3578110003', nama: 'Kejawan Putih Tambak', kodepos: ['60112'] },
        { kode: '3578110004', nama: 'Kalijudan', kodepos: ['60114'] },
        { kode: '3578110005', nama: 'Dukuh Sutorejo', kodepos: ['60113'] },
        { kode: '3578110006', nama: 'Manyar Sabrangan', kodepos: ['60116'] }
      ]
    },
    // ====== SURABAYA BARAT (9 Kecamatan) ======
    {
      kode: '3578120',
      nama: 'Sawahan',
      kelurahan: [
        { kode: '3578120001', nama: 'Sawahan', kodepos: ['60251'] },
        { kode: '3578120002', nama: 'Banyu Urip', kodepos: ['60254'] },
        { kode: '3578120003', nama: 'Pakis', kodepos: ['60256'] },
        { kode: '3578120004', nama: 'Petemon', kodepos: ['60252'] },
        { kode: '3578120005', nama: 'Putat Jaya', kodepos: ['60255'] },
        { kode: '3578120006', nama: 'Kupang Krajan', kodepos: ['60253'] }
      ]
    },
    {
      kode: '3578130',
      nama: 'Krembangan',
      kelurahan: [
        { kode: '3578130001', nama: 'Krembangan Selatan', kodepos: ['60175'] },
        { kode: '3578130002', nama: 'Kemayoran', kodepos: ['60176'] },
        { kode: '3578130003', nama: 'Dupak', kodepos: ['60179'] },
        { kode: '3578130004', nama: 'Perak Barat', kodepos: ['60177'] },
        { kode: '3578130005', nama: 'Morokrembangan', kodepos: ['60178'] }
      ]
    },
    {
      kode: '3578140',
      nama: 'Asemrowo',
      kelurahan: [
        { kode: '3578140001', nama: 'Asemrowo', kodepos: ['60182'] },
        { kode: '3578140002', nama: 'Genting Kalianak', kodepos: ['60183'] },
        { kode: '3578140003', nama: 'Tambak Sarioso', kodepos: ['60184'] }
      ]
    },
    {
      kode: '3578150',
      nama: 'Benowo',
      kelurahan: [
        { kode: '3578150001', nama: 'Sememi', kodepos: ['60198'] },
        { kode: '3578150002', nama: 'Kandangan', kodepos: ['60199'] },
        { kode: '3578150003', nama: 'Romokalisari', kodepos: ['60192'] },
        { kode: '3578150004', nama: 'Tambak Oso Wilangun', kodepos: ['60191'] }
      ]
    },
    {
      kode: '3578160',
      nama: 'Pakal',
      kelurahan: [
        { kode: '3578160001', nama: 'Pakal', kodepos: ['60196'] },
        { kode: '3578160002', nama: 'Sumber Rejo', kodepos: ['60192'] },
        { kode: '3578160003', nama: 'Babat Jerawat', kodepos: ['60197'] },
        { kode: '3578160004', nama: 'Benowo', kodepos: ['60195'] }
      ]
    },
    {
      kode: '3578170',
      nama: 'Lakarsantri',
      kelurahan: [
        { kode: '3578170001', nama: 'Bangkingan', kodepos: ['60214'] },
        { kode: '3578170002', nama: 'Jeruk', kodepos: ['60212'] },
        { kode: '3578170003', nama: 'Lakarsantri', kodepos: ['60211'] },
        { kode: '3578170004', nama: 'Lidah Kulon', kodepos: ['60213'] },
        { kode: '3578170005', nama: 'Lidah Wetan', kodepos: ['60213'] },
        { kode: '3578170006', nama: 'Sumur Welut', kodepos: ['60215'] }
      ]
    },
    {
      kode: '3578180',
      nama: 'Sambikerep',
      kelurahan: [
        { kode: '3578180001', nama: 'Sambikerep', kodepos: ['60217'] },
        { kode: '3578180002', nama: 'Made', kodepos: ['60219'] },
        { kode: '3578180003', nama: 'Beringin', kodepos: ['60218'] },
        { kode: '3578180004', nama: 'Lontar', kodepos: ['60216'] }
      ]
    },
    {
      kode: '3578190',
      nama: 'Tandes',
      kelurahan: [
        { kode: '3578190001', nama: 'Tandes', kodepos: ['60187'] },
        { kode: '3578190002', nama: 'Balongsari', kodepos: ['60186'] },
        { kode: '3578190003', nama: 'Manukan Wetan', kodepos: ['60184'] },
        { kode: '3578190004', nama: 'Manukan Kulon', kodepos: ['60185'] },
        { kode: '3578190005', nama: 'Banjar Sugihan', kodepos: ['60185'] },
        { kode: '3578190006', nama: 'Karang Poh', kodepos: ['60186'] }
      ]
    },
    {
      kode: '3578200',
      nama: 'Sukomanunggal',
      kelurahan: [
        { kode: '3578200001', nama: 'Sukomanunggal', kodepos: ['60188'] },
        { kode: '3578200002', nama: 'Tanjungsari', kodepos: ['60187'] },
        { kode: '3578200003', nama: 'Simomulyo', kodepos: ['60281'] },
        { kode: '3578200004', nama: 'Simomulyo Baru', kodepos: ['60281'] },
        { kode: '3578200005', nama: 'Sonokwijenan', kodepos: ['60189'] },
        { kode: '3578200006', nama: 'Putat Gede', kodepos: ['60189'] }
      ]
    },
    // ====== SURABAYA UTARA (3 Kecamatan) ======
    {
      kode: '3578210',
      nama: 'Bulak',
      kelurahan: [
        { kode: '3578210001', nama: 'Bulak', kodepos: ['60124'] },
        { kode: '3578210002', nama: 'Kedung Cowek', kodepos: ['60125'] },
        { kode: '3578210003', nama: 'Kenjeran', kodepos: ['60123'] },
        { kode: '3578210004', nama: 'Sukolilo Baru', kodepos: ['60122'] }
      ]
    },
    {
      kode: '3578220',
      nama: 'Kenjeran',
      kelurahan: [
        { kode: '3578220001', nama: 'Bulak Banteng', kodepos: ['60127'] },
        { kode: '3578220002', nama: 'Tanah Kali Kedinding', kodepos: ['60129'] },
        { kode: '3578220003', nama: 'Sidotopo Wetan', kodepos: ['60128'] },
        { kode: '3578220004', nama: 'Tambak Wedi', kodepos: ['60126'] }
      ]
    },
    {
      kode: '3578230',
      nama: 'Semampir',
      kelurahan: [
        { kode: '3578230001', nama: 'Ampel', kodepos: ['60151'] },
        { kode: '3578230002', nama: 'Pegirian', kodepos: ['60153'] },
        { kode: '3578230003', nama: 'Sidotopo', kodepos: ['60152'] },
        { kode: '3578230004', nama: 'Wonokusumo', kodepos: ['60154'] },
        { kode: '3578230005', nama: 'Ujung', kodepos: ['60155'] }
      ]
    },
    // ====== SURABAYA SELATAN (8 Kecamatan) ======
    {
      kode: '3578240',
      nama: 'Wonokromo',
      kelurahan: [
        { kode: '3578240001', nama: 'Wonokromo', kodepos: ['60243'] },
        { kode: '3578240002', nama: 'Darmo', kodepos: ['60241'] },
        { kode: '3578240003', nama: 'Ngagel', kodepos: ['60246'] },
        { kode: '3578240004', nama: 'Ngagel Rejo', kodepos: ['60245'] },
        { kode: '3578240005', nama: 'Jagir', kodepos: ['60244'] },
        { kode: '3578240006', nama: 'Sawunggaling', kodepos: ['60242'] }
      ]
    },
    {
      kode: '3578250',
      nama: 'Wonocolo',
      kelurahan: [
        { kode: '3578250001', nama: 'Bendul Merisi', kodepos: ['60239'] },
        { kode: '3578250002', nama: 'Margorejo', kodepos: ['60238'] },
        { kode: '3578250003', nama: 'Sidosermo', kodepos: ['60239'] },
        { kode: '3578250004', nama: 'Siwalankerto', kodepos: ['60236'] },
        { kode: '3578250005', nama: 'Jemur Wonosari', kodepos: ['60237'] }
      ]
    },
    {
      kode: '3578260',
      nama: 'Wiyung',
      kelurahan: [
        { kode: '3578260001', nama: 'Wiyung', kodepos: ['60228'] },
        { kode: '3578260002', nama: 'Balas Klumprik', kodepos: ['60222'] },
        { kode: '3578260003', nama: 'Babatan', kodepos: ['60227'] },
        { kode: '3578260004', nama: 'Jajar Tunggal', kodepos: ['60229'] }
      ]
    },
    {
      kode: '3578270',
      nama: 'Karang Pilang',
      kelurahan: [
        { kode: '3578270001', nama: 'Karang Pilang', kodepos: ['60221'] },
        { kode: '3578270002', nama: 'Kebraon', kodepos: ['60222'] },
        { kode: '3578270003', nama: 'Kedurus', kodepos: ['60223'] },
        { kode: '3578270004', nama: 'Warugunung', kodepos: ['60221'] }
      ]
    },
    {
      kode: '3578280',
      nama: 'Jambangan',
      kelurahan: [
        { kode: '3578280001', nama: 'Jambangan', kodepos: ['60232'] },
        { kode: '3578280002', nama: 'Karah', kodepos: ['60232'] },
        { kode: '3578280003', nama: 'Kebonsari', kodepos: ['60233'] },
        { kode: '3578280004', nama: 'Pagesangan', kodepos: ['60233'] }
      ]
    },
    {
      kode: '3578290',
      nama: 'Gayungan',
      kelurahan: [
        { kode: '3578290001', nama: 'Dukuh Menanggal', kodepos: ['60234'] },
        { kode: '3578290002', nama: 'Gayungan', kodepos: ['60235'] },
        { kode: '3578290003', nama: 'Ketintang', kodepos: ['60231'] },
        { kode: '3578290004', nama: 'Menanggal', kodepos: ['60234'] }
      ]
    },
    {
      kode: '3578300',
      nama: 'Dukuh Pakis',
      kelurahan: [
        { kode: '3578300001', nama: 'Dukuh Pakis', kodepos: ['60225'] },
        { kode: '3578300002', nama: 'Dukuh Kupang', kodepos: ['60225'] },
        { kode: '3578300003', nama: 'Gunung Sari', kodepos: ['60224'] },
        { kode: '3578300004', nama: 'Pradah Kalikendal', kodepos: ['60226'] }
      ]
    },
    {
      kode: '3578310',
      nama: 'Tambaksari',
      kelurahan: [
        { kode: '3578310001', nama: 'Pacar Keling', kodepos: ['60131'] },
        { kode: '3578310002', nama: 'Pacar Kembang', kodepos: ['60132'] },
        { kode: '3578310003', nama: 'Ploso', kodepos: ['60133'] },
        { kode: '3578310004', nama: 'Rangkah', kodepos: ['60135'] },
        { kode: '3578310005', nama: 'Gading', kodepos: ['60134'] },
        { kode: '3578310006', nama: 'Kapas Madya Baru', kodepos: ['60137'] },
        { kode: '3578310007', nama: 'Dukuh Setro', kodepos: ['60138'] },
        { kode: '3578310008', nama: 'Tambaksari', kodepos: ['60136'] }
      ]
    }
  ]
};

// Helper functions dengan validasi super ketat
export const findByKodepos = (kodepos: string) => {
  // Validasi format kode pos
  if (!kodepos || kodepos.length !== 5 || !/^\d{5}$/.test(kodepos)) {
    return null;
  }

  // Harus dimulai dengan 60 (Surabaya)
  if (!kodepos.startsWith('60')) {
    return null;
  }

  for (const kec of geographicData.kecamatan) {
    for (const kel of kec.kelurahan) {
      if (kel.kodepos.includes(kodepos)) {
        return {
          kecamatan: kec,
          kelurahan: kel
        };
      }
    }
  }
  return null;
};

export const getAllKecamatan = () => {
  return geographicData.kecamatan.map(kec => ({
    kode: kec.kode,
    nama: kec.nama
  }));
};

export const getKelurahanByKecamatan = (kodeKecamatan: string) => {
  const kec = geographicData.kecamatan.find(k => k.kode === kodeKecamatan);
  return kec ? kec.kelurahan : [];
};

// Get all unique postal codes
export const getAllPostalCodes = (): string[] => {
  const codes = new Set<string>();
  geographicData.kecamatan.forEach(kec => {
    kec.kelurahan.forEach(kel => {
      kel.kodepos.forEach(code => codes.add(code));
    });
  });
  return Array.from(codes).sort();
};

// Validate if postal code is in Surabaya
export const isValidSurabayaPostalCode = (kodepos: string): boolean => {
  return findByKodepos(kodepos) !== null;
};
