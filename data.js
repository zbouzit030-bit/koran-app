// ============== Azkar Data ==============
const azkarData = {
  morning: [
    { 
      text: "اللهم أنت ربي لا إله إلا أنت، خلقتني وأنا عبدك، وأنا على عهدك ووعدك ما استطعت", 
      times: 1 
    },
    { 
      text: "سبحان الله وبحمده، سبحان الله العظيم", 
      times: 100 
    },
    { 
      text: "لا إله إلا الله وحده لا شريك له، له الملك وله الحمد", 
      times: 10 
    },
  ],
  evening: [
    { 
      text: "اللهم بك أمسينا، وبك أصبحنا، وبك نحيا، وبك نموت، وإليك النشور", 
      times: 3 
    },
    { 
      text: "سبحان الله وبحمده، سبحان الله العظيم", 
      times: 100 
    },
  ],
  prayer: [
    { 
      text: "سبحان الله والحمد لله والله أكبر", 
      times: 33 
    },
    { 
      text: "لا إله إلا الله وحده لا شريك له، له الملك وله الحمد", 
      times: 1 
    },
  ],
  sleep: [
    { 
      text: "بسم الله الرحمن الرحيم اللهم أسلمت وجهي إليك", 
      times: 1 
    },
    { 
      text: "سبحان الله، والحمد لله، والله أكبر", 
      times: 33 
    },
  ]
};

// ============== Achievements ==============
const achievements = [
  { id: 'first-khatma', name: 'ختمة أولى 🎉', desc: 'أكمل قراءة القرآن مرة', progress: 0, required: 114 },
  { id: 'thousand-ayah', name: '1000 آية 📈', desc: 'اقرأ 1000 آية', progress: 0, required: 1000 },
  { id: 'week-streak', name: '7 أيام متواصلة 🔥', desc: 'اقرأ لمدة أسبوع', progress: 0, required: 7 },
  { id: 'memorize-30', name: '30 آية محفوظة 🧠', desc: 'احفظ 30 آية', progress: 0, required: 30 },
];

// ============== Prayer Times Constants ==============
const prayerNames = {
  ar: {
    Fajr: 'الفجر',
    Dhuhr: 'الظهر',
    Asr: 'العصر',
    Maghrib: 'المغرب',
    Isha: 'العشاء'
  },
  en: {
    Fajr: 'Fajr',
    Dhuhr: 'Dhuhr',
    Asr: 'Asr',
    Maghrib: 'Maghrib',
    Isha: 'Isha'
  }
};

// ============== API Endpoints ==============
const API_ENDPOINTS = {
  surah: 'https://api.alquran.cloud/v1/surah',
  surahByNumber: (n) => `https://api.alquran.cloud/v1/surah/${n}`,
  ayahTafseer: (n, tafseer = 'ar.jalalayn') => `https://api.alquran.cloud/v1/ayah/${n}/${tafseer}`,
  ayahAudio: (n, readerId = 128) => `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${n}.mp3`,
  search: (q) => `https://api.alquran.cloud/v1/search/${encodeURIComponent(q)}/all/ar`,
  prayerTimes: (timestamp, lat, lng) => `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${lat}&longitude=${lng}&method=2`
};

// ============== Readers ==============
const readers = [
  { id: 128, name: 'مشاري العفاسي' },
  { id: 1, name: 'عبد الباسط' },
  { id: 2, name: 'محمود خليل' },
  { id: 7, name: 'ياسين الجزائري' },
  { id: 3, name: 'محمد جبريل' },
  { id: 5, name: 'أحمد العجمي' }
];