// ============== Global State ==============
const appState = {
  currentFontSize: parseFloat(getFromLocal('fontSize')) || 1.8,
  currentSurah: null,
  currentReader: getFromLocal('currentReader') || 128,
  favorites: getFromLocal('favorites') || [],
  allSurahs: [],
  isOnline: navigator.onLine,
  dataSaverMode: getFromLocal('dataSaverMode') || false,
  autoPlayMode: getFromLocal('autoPlayMode') || false,
  focusMode: false,
  focusCurrentAyahIndex: 0,
  focusCurrentAyahs: [],
  lastReadSurah: getFromLocal('lastReadSurah') || null,
  readSurahs: getFromLocal('readSurahs') || [],
  charactersRead: parseInt(getFromLocal('charactersRead')) || 0,
};

const config = {
  minFontSize: 1,
  maxFontSize: 3,
  fontStep: 0.2,
};

// ============== Initialization ==============
document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
  console.log('🚀 Initializing Quran App...');
  console.log('🌐 Browser:', getBrowserInfo());
  console.log('✅ Features:', checkFeatures());

  // تسجيل Service Worker
  registerServiceWorkerSafely();

  // تحميل البيانات الأساسية
  await loadSurahs();

  // التحقق من الإنترنت
  setupOnlineOfflineDetection();

  // إعادة تعيين المظهر
  const savedTheme = getFromLocal('theme') || 'dark';
  toggleTheme(savedTheme);

  // عرض بطاقة الاستئناف
  showResumeCardIfAvailable();

  // طلب أذن الإشعارات
  requestNotificationPermission();

  // إعداد عداد الصلاة
  setupPrayerCountdown();

  // تحديث شريط التقدم
  updateKhatmaProgress();

  // حفظ آخر قراءة عند الخروج
  window.addEventListener('beforeunload', saveLastReadSurah);

  console.log('✅ App initialized successfully!');
}

// ============== Service Worker Registration ==============
function registerServiceWorkerSafely() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(registration => {
        console.log('✅ Service Worker registered:', registration);
        
        // تحديث تلقائي
        if (registration.waiting) {
          promptUserToRefresh(registration.waiting);
        }
        
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'waiting') {
              promptUserToRefresh(newWorker);
            }
          });
        });
      })
      .catch(err => console.error('❌ Service Worker registration failed:', err));
  }
}

function promptUserToRefresh(worker) {
  const message = '🔄 يوجد تحديث جديد. هل تريد تحديث التطبيق؟';
  if (confirm(message)) {
    worker.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  }
}

// ============== Online/Offline Detection ==============
function setupOnlineOfflineDetection() {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
}

function handleOnline() {
  appState.isOnline = true;
  document.getElementById('offlineIndicator').classList.remove('show');
  console.log('✅ Online');
  showNotification('📡 متصل بالإنترنت', { body: 'يتم الآن مزامنة البيانات' });
}

function handleOffline() {
  appState.isOnline = false;
  document.getElementById('offlineIndicator').classList.add('show');
  console.log('⚠️ Offline');
  showNotification('📴 بدون إنترنت', { body: 'يعمل التطبيق بالذاكرة المحفوظة' });
}

// ============== Theme Management ==============
function toggleTheme(theme) {
  document.body.className = theme === 'auto' ? '' : `${theme}-mode`;
  saveToLocal('theme', theme);
  console.log(`🎨 Theme changed to: ${theme}`);
}

// ============== Font Size Management ==============
function increaseFont() {
  if (appState.currentFontSize < config.maxFontSize) {
    appState.currentFontSize += config.fontStep;
    updateFontDisplay();
  }
}

function decreaseFont() {
  if (appState.currentFontSize > config.minFontSize) {
    appState.currentFontSize -= config.fontStep;
    updateFontDisplay();
  }
}

function updateFontDisplay() {
  document.querySelectorAll('.ayah').forEach(el => {
    el.style.fontSize = appState.currentFontSize + 'rem';
  });
  
  document.getElementById('fontSize').textContent = appState.currentFontSize.toFixed(1);
  saveToLocal('fontSize', appState.currentFontSize);
}

// ============== Load Surahs ==============
async function loadSurahs() {
  console.log('📥 Loading Surahs...');
  
  const cached = getFromLocal('surahs_cache');
  if (cached) {
    appState.allSurahs = cached;
    populateSurahSelects();
    console.log('✅ Surahs loaded from cache');
    return;
  }

  if (!appState.isOnline) {
    console.warn('⚠️ No internet - cannot load surahs');
    return;
  }

  try {
    const response = await fetch(API_ENDPOINTS.surah);
    const data = await response.json();
    appState.allSurahs = data.data;
    saveToLocal('surahs_cache', appState.allSurahs);
    populateSurahSelects();
    console.log('✅ Surahs loaded from API');
  } catch (err) {
    logError(err, 'loadSurahs');
  }
}

function populateSurahSelects() {
  ['surahSelect', 'tafseerSurahSelect', 'memorizesurahSelect'].forEach(id => {
    const select = document.getElementById(id);
    if (!select) return;

    select.innerHTML = '<option value="">اختر السورة...</option>';
    appState.allSurahs.forEach(surah => {
      const opt = document.createElement('option');
      opt.value = surah.number;
      opt.textContent = `${surah.number}. ${surah.name}`;
      select.appendChild(opt);
    });
  });
}

// ============== Tab Management ==============
function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  
  const tab = document.getElementById(tabName);
  if (tab) {
    tab.classList.add('active');
    if (event?.target) event.target.classList.add('active');
    
    // تحميل محتوى التبويب
    if (tabName === 'favorites') displayFavorites();
    if (tabName === 'stats') updateStats();
  }
}

// ============== Get Surah ==============
async function getSurah(surahNumber) {
  if (!surahNumber) return;

  const container = document.getElementById('ayatsContainer');
  container.innerHTML = '<div class="loading">جاري تحميل السورة...</div>';

  const cacheKey = `surah_${surahNumber}`;
  const cached = getFromLocal(cacheKey);

  if (cached) {
    displaySurah(cached);
    return;
  }

  if (!appState.isOnline) {
    container.innerHTML = '<p style="color: #999;">❌ السورة غير محفوظة - يرجى الاتصال بالإنترنت</p>';
    return;
  }

  try {
    const response = await fetch(API_ENDPOINTS.surahByNumber(surahNumber));
    const data = await response.json();
    saveToLocal(cacheKey, data.data);
    displaySurah(data.data);
  } catch (err) {
    logError(err, 'getSurah');
    container.innerHTML = '<p style="color: #f44336;">❌ خطأ في تحميل السورة</p>';
  }
}

function displaySurah(surahData) {
  appState.currentSurah = surahData;
  document.getElementById('surahName').textContent = surahData.name;

  const container = document.getElementById('ayatsContainer');
  container.innerHTML = '';

  surahData.ayahs.forEach((ayah, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'ayah-wrapper';

    const p = document.createElement('p');
    p.className = 'ayah';
    p.style.fontSize = appState.currentFontSize + 'rem';
    p.id = `ayah-${ayah.number}`;
    p.textContent = `${ayah.text} (${ayah.numberInSurah})`;
    p.onclick = () => toggleFavorite(ayah);
    p.ondblclick = () => enterFocusMode(surahData.ayahs, index);

    const controls = document.createElement('div');
    controls.className = 'ayah-controls';
    controls.innerHTML = `
      <button class="ayah-btn" onclick="repeatAyah(${ayah.number}, 3)" title="تكرار 3 مرات">3x</button>
      <button class="ayah-btn" onclick="repeatAyah(${ayah.number}, 5)" title="تكرار 5 مرات">5x</button>
      <button class="ayah-btn" onclick="repeatAyah(${ayah.number}, 10)" title="تكرار 10 مرات">10x</button>
    `;

    wrapper.appendChild(p);
    wrapper.appendChild(controls);
    container.appendChild(wrapper);
  });

  // تحديث حالة التطبيق
  addReadSurah(surahData.number);
  updateKhatmaProgress();
  updateAudioPlayer(surahData.number);
  updateHasanatDisplay();
}

// ============== Audio Player ==============
function updateAudioPlayer(surahNumber) {
  const player = document.getElementById('audioPlayer');
  const readerGroup = document.getElementById('readerSelectGroup');

  if (appState.dataSaverMode) {
    readerGroup.style.display = 'none';
    player.style.display = 'none';
  } else {
    readerGroup.style.display = 'flex';
    player.style.display = 'block';
    player.src = `https://cdn.islamic.network/quran/audio-surah/${appState.currentReader}/ar.alafasy/${surahNumber}.mp3`;

    // التشغيل المتتالي
    player.onended = () => {
      if (appState.autoPlayMode && appState.currentSurah.number < 114) {
        const nextSurah = appState.currentSurah.number + 1;
        document.getElementById('surahSelect').value = nextSurah;
        getSurah(nextSurah);
      }
    };
  }
}

function changeReader() {
  appState.currentReader = document.getElementById('readerSelect').value;
  saveToLocal('currentReader', appState.currentReader);
  if (appState.currentSurah) {
    updateAudioPlayer(appState.currentSurah.number);
  }
}

// ============== Repeat Ayah ==============
async function repeatAyah(ayahNumber, times) {
  const audioUrl = `https://cdn.islamic.network/quran/audio/${appState.currentReader}/ar.alafasy/${ayahNumber}.mp3`;
  
  let count = 0;
  const playNext = async () => {
    if (count < times) {
      count++;
      try {
        const audio = new Audio(audioUrl);
        audio.onended = () => {
          if (count < times) setTimeout(playNext, 500);
        };
        await audio.play();
      } catch (err) {
        console.error('❌ Audio playback failed:', err);
      }
    }
  };

  playNext();
}

// ============== Focus Mode ==============
function toggleFocusMode() {
  const overlay = document.getElementById('focusModeOverlay');
  if (!appState.focusMode && appState.currentSurah) {
    appState.focusMode = true;
    appState.focusCurrentAyahs = appState.currentSurah.ayahs;
    appState.focusCurrentAyahIndex = 0;
    updateFocusDisplay();
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  } else {
    appState.focusMode = false;
    overlay.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

function enterFocusMode(ayahs, index) {
  appState.focusMode = true;
  appState.focusCurrentAyahs = ayahs;
  appState.focusCurrentAyahIndex = index;
  updateFocusDisplay();
  document.getElementById('focusModeOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

async function updateFocusDisplay() {
  const ayah = appState.focusCurrentAyahs[appState.focusCurrentAyahIndex];
  document.getElementById('focusAyahText').textContent = ayah.text;

  // تشغيل الصوت تلقائياً
  if (!appState.dataSaverMode) {
    const audioUrl = `https://cdn.islamic.network/quran/audio/${appState.currentReader}/ar.alafasy/${ayah.number}.mp3`;
    try {
      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (err) {
      console.warn('⚠️ Audio autoplay failed:', err);
    }
  }
}

function nextAyahFocus() {
  if (appState.focusCurrentAyahIndex < appState.focusCurrentAyahs.length - 1) {
    appState.focusCurrentAyahIndex++;
    updateFocusDisplay();
  }
}

function previousAyahFocus() {
  if (appState.focusCurrentAyahIndex > 0) {
    appState.focusCurrentAyahIndex--;
    updateFocusDisplay();
  }
}

// ============== Data Saver Mode ==============
function toggleDataSaver() {
  appState.dataSaverMode = document.getElementById('dataSaverToggle').checked;
  saveToLocal('dataSaverMode', appState.dataSaverMode);
  if (appState.currentSurah) {
    updateAudioPlayer(appState.currentSurah.number);
  }
  showNotification(appState.dataSaverMode ? '💾 وضع توفير البيانات مفعّل' : '💾 وضع توفير البيانات معطّل');
}

// ============== Auto Play ==============
function toggleAutoPlay() {
  appState.autoPlayMode = document.getElementById('autoPlayToggle').checked;
  saveToLocal('autoPlayMode', appState.autoPlayMode);
  showNotification(appState.autoPlayMode ? '▶️ التشغيل المتتالي مفعّل' : '▶️ التشغيل المتتالي معطّل');
}

// ============== Khatma Progress ==============
function addReadSurah(surahNumber) {
  if (!appState.readSurahs.includes(surahNumber)) {
    appState.readSurahs.push(surahNumber);
    saveToLocal('readSurahs', appState.readSurahs);

    // إضافة الحروف
    const surah = appState.allSurahs.find(s => s.number === surahNumber);
    if (surah && appState.currentSurah) {
      const charCount = appState.currentSurah.ayahs.reduce((sum, a) => sum + a.text.length, 0);
      appState.charactersRead += charCount;
      saveToLocal('charactersRead', appState.charactersRead);
    }
  }
}

function updateKhatmaProgress() {
  const progress = (appState.readSurahs.length / 114) * 100;
  const fill = document.getElementById('progressFill');
  fill.style.width = progress + '%';
  document.getElementById('progressPercent').textContent = progress.toFixed(1) + '%';
  document.getElementById('readSurahs').textContent = appState.readSurahs.length;
  document.getElementById('remainSurahs').textContent = 114 - appState.readSurahs.length;
}

function updateHasanatDisplay() {
  const hasanat = appState.charactersRead * 10;
  document.getElementById('hasanatCount').textContent = formatNumber(hasanat);
}

// ============== Resume Reading ==============
function showResumeCardIfAvailable() {
  const lastRead = getFromLocal('lastReadSurah');
  if (lastRead && appState.allSurahs.length > 0) {
    const surah = appState.allSurahs.find(s => s.number === lastRead.surahNumber);
    if (surah) {
      document.getElementById('resumeSurahName').textContent = surah.name;
      document.getElementById('resumeAyahInfo').textContent = `الآية: ${lastRead.lastAyahNumber}`;
      document.getElementById('resumeCard').style.display = 'block';
    }
  }
}

function resumeReading() {
  const lastRead = getFromLocal('lastReadSurah');
  document.getElementById('surahSelect').value = lastRead.surahNumber;
  getSurah(lastRead.surahNumber);
  dismissResume();
  switchTab('quran');
}

function dismissResume() {
  document.getElementById('resumeCard').style.display = 'none';
}

function saveLastReadSurah() {
  if (appState.currentSurah) {
    saveToLocal('lastReadSurah', {
      surahNumber: appState.currentSurah.number,
      lastAyahNumber: appState.currentSurah.ayahs.length,
      timestamp: Date.now()
    });
  }
}

// ============== Favorites ==============
function toggleFavorite(ayah) {
  const idx = appState.favorites.findIndex(f => f.number === ayah.number);
  if (idx > -1) {
    appState.favorites.splice(idx, 1);
  } else {
    appState.favorites.push(ayah);
  }
  saveToLocal('favorites', appState.favorites);
  updateStats();
}

function displayFavorites() {
  const container = document.getElementById('favoritesList');
  container.innerHTML = '';

  if (appState.favorites.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">لا توجد آيات مفضلة</p>';
    return;
  }

  appState.favorites.forEach(fav => {
    const div = document.createElement('div');
    div.className = 'favorite-item';
    div.innerHTML = `
      <strong>${fav.surah?.name || 'السورة'}</strong>
      <p style="font-size: 0.9rem; color: #ddd; margin-top: 10px;">${fav.text}</p>
      <button onclick="removeFavorite(${fav.number})" style="margin-top: 10px; width: 100%;">حذف</button>
    `;
    container.appendChild(div);
  });
}

function removeFavorite(ayahNumber) {
  appState.favorites = appState.favorites.filter(f => f.number !== ayahNumber);
  saveToLocal('favorites', appState.favorites);
  displayFavorites();
  updateStats();
}

function clearFavorites() {
  if (confirm('🚨 هل تريد حذف جميع المفضلة؟')) {
    appState.favorites = [];
    saveToLocal('favorites', appState.favorites);
    displayFavorites();
    updateStats();
    showNotification('✓ تم حذف المفضلة', { body: 'جميع الآيات المفضلة تم حذفها' });
  }
}

// ============== Statistics ==============
function updateStats() {
  document.getElementById('favCount').textContent = appState.favorites.length;
  document.getElementById('characterCount').textContent = formatNumber(appState.charactersRead);
}

// ============== Prayer Times ==============
function getPrayerTimes() {
  if (!navigator.geolocation) {
    alert('❌ تحديد الموقع غير مدعوم في متصفحك');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;

      if (!appState.isOnline) {
        alert('⚠️ هذه الميزة تتطلب إنترنت');
        return;
      }

      try {
        const timestamp = Math.floor(Date.now() / 1000);
        const response = await fetch(API_ENDPOINTS.prayerTimes(timestamp, latitude, longitude));
        const data = await response.json();

        displayPrayerTimes(data.data.timings);
        saveToLocal('prayerTimes', data.data);
        setupPrayerCountdown();
      } catch (err) {
        logError(err, 'getPrayerTimes');
        alert('❌ خطأ في جلب أوقات الصلاة');
      }
    },
    (err) => {
      console.error('❌ Geolocation error:', err);
      alert('❌ تعذر الوصول إلى موقعك - تأكد من أذن الموقع');
    }
  );
}

function displayPrayerTimes(timings) {
  const container = document.getElementById('prayerTimesContainer');
  container.innerHTML = '';

  const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const names = ['الفجر 🌅', 'الظهر ☀️', 'العصر 🌤️', 'المغرب 🌅', 'العشاء 🌙'];

  prayers.forEach((prayer, idx) => {
    const card = document.createElement('div');
    card.className = 'prayer-card';
    card.innerHTML = `
      <div style="color: var(--gold); font-weight: bold; margin-bottom: 10px;">${names[idx]}</div>
      <div style="font-size: 1.8rem; font-family: 'Courier New', monospace;">${timings[prayer]}</div>
    `;
    container.appendChild(card);
  });
}

function setupPrayerCountdown() {
  const interval = setInterval(() => {
    const prayerData = getFromLocal('prayerTimes');
    if (!prayerData) {
      clearInterval(interval);
      return;
    }

    const timings = prayerData.timings;
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const names = ['الفجر', 'الظهر', 'العصر', 'المغرب', 'العشاء'];

    for (let i = 0; i < prayers.length; i++) {
      const prayerTime = timings[prayers[i]];
      if (prayerTime > currentTime) {
        const [h, m] = prayerTime.split(':').map(Number);
        const prayerDate = new Date();
        prayerDate.setHours(h, m, 0);

        const diff = prayerDate - now;
        if (diff > 0) {
          const hours = Math.floor(diff / 3600000);
          const mins = Math.floor((diff % 3600000) / 60000);
          const secs = Math.floor((diff % 60000) / 1000);

          document.getElementById('nextPrayerName').textContent = `الصلاة القادمة: ${names[i]}`;
          document.getElementById('countdownTimer').textContent = 
            `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
          document.getElementById('prayerCountdown').style.display = 'block';
          return;
        }
      }
    }
  }, 1000);
}

// ============== Azkar ==============
function switchAzkarCategory(category) {
  document.querySelectorAll('#azkar .tab-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  displayAzkar(category);
}

function displayAzkar(category) {
  const container = document.getElementById('azkarContainer');
  container.innerHTML = '';

  const azkar = azkarData[category] || [];
  azkar.forEach((zikr, idx) => {
    const zikrId = `${category}_${idx}`;
    const counter = parseInt(getFromLocal(`azkar_${zikrId}`)) || 0;

    const card = document.createElement('div');
    card.className = 'azkar-card';
    card.innerHTML = `
      <div style="font-size: 1.1rem; line-height: 1.8; margin-bottom: 15px; text-align: center;">${zikr.text}</div>
      <div class="counter-display">${counter}/${zikr.times}</div>
      <button onclick="incrementAzkar('${zikrId}', ${zikr.times})" style="width: 100%; padding: 12px;">✓ تم</button>
    `;
    container.appendChild(card);
  });
}

function incrementAzkar(zikrId, maxTimes) {
  let counter = parseInt(getFromLocal(`azkar_${zikrId}`)) || 0;
  if (counter < maxTimes) {
    counter++;
    saveToLocal(`azkar_${zikrId}`, counter);
    displayAzkar(zikrId.split('_')[0]);

    if (counter === maxTimes) {
      showNotification('✓ ممتاز!', { body: 'اكتملت هذه الحسنة' });
    }
  }
}

// ============== Search ==============
const debouncedSearch = debounce(performSearch, 400);

function searchAyahs() {
  const query = document.getElementById('searchInput').value.trim();
  if (query.length < 2) {
    document.getElementById('searchResults').innerHTML = '';
    return;
  }
  debouncedSearch(query);
}

async function performSearch(query) {
  const resultsDiv = document.getElementById('searchResults');

  if (!appState.isOnline) {
    resultsDiv.innerHTML = '<p style="color: #999;">⚠️ البحث يتطلب إنترنت</p>';
    return;
  }

  resultsDiv.innerHTML = '<div class="loading">جاري البحث...</div>';

  try {
    const response = await fetch(API_ENDPOINTS.search(query));
    const data = await response.json();

    if (!data.data?.matches?.length) {
      resultsDiv.innerHTML = '<p style="color: #999;">❌ لم يتم العثور على نتائج</p>';
      return;
    }

    resultsDiv.innerHTML = '';
    data.data.matches.slice(0, 20).forEach(match => {
      const div = document.createElement('div');
      div.className = 'search-result';
      div.innerHTML = `
        <strong style="color: var(--gold);">${match.surah.name}</strong>
        <p style="font-size: 0.9rem; color: #bbb; margin-top: 5px;">الآية ${match.numberInSurah}</p>
        <p style="font-size: 0.95rem; margin-top: 8px;">${match.text}</p>
      `;
      div.onclick = () => {
        document.getElementById('surahSelect').value = match.surah.number;
        getSurah(match.surah.number);
        switchTab('quran');
      };
      resultsDiv.appendChild(div);
    });
  } catch (err) {
    logError(err, 'performSearch');
    resultsDiv.innerHTML = '<p style="color: #f44336;">❌ خطأ في البحث</p>';
  }
}

// ============== Tafseer ==============
async function loadTafseerSurah(surahNumber) {
  if (!surahNumber) return;

  const container = document.getElementById('tafseerContainer');
  container.innerHTML = '<div class="loading">جاري تحميل التفسير...</div>';

  const cacheKey = `surah_${surahNumber}`;
  const cached = getFromLocal(cacheKey);

  const display = async (data) => {
    container.innerHTML = '';
    for (const ayah of data.ayahs.slice(0, 10)) {
      const cacheKeyTafseer = `tafseer_${ayah.number}`;
      let tafseer = getFromLocal(cacheKeyTafseer);

      if (!tafseer && appState.isOnline) {
        try {
          const response = await fetch(API_ENDPOINTS.ayahTafseer(ayah.number));
          const tafseerData = await response.json();
          tafseer = tafseerData.data.text;
          saveToLocal(cacheKeyTafseer, tafseer);
        } catch (err) {
          console.warn('⚠️ Failed to fetch tafseer:', err);
          tafseer = '❌ لم يتم الحصول على التفسير';
        }
      }

      const div = document.createElement('div');
      div.style.cssText = 'background: var(--light); padding: 20px; margin-bottom: 20px; border-radius: 10px; border-right: 4px solid var(--gold);';
      div.innerHTML = `
        <p style="color: var(--gold); font-size: 1.2rem; margin-bottom: 10px;"><strong>الآية ${ayah.numberInSurah}:</strong></p>
        <p style="font-size: 1.5rem; margin-bottom: 15px; line-height: 2.5;">${ayah.text}</p>
        <div style="color: #ddd; line-height: 2;">${tafseer || '⏳ جاري التحميل...'}</div>
      `;
      container.appendChild(div);
    }
  };

  if (cached) {
    display(cached);
  } else if (appState.isOnline) {
    try {
      const response = await fetch(API_ENDPOINTS.surahByNumber(surahNumber));
      const data = await response.json();
      saveToLocal(cacheKey, data.data);
      display(data.data);
    } catch (err) {
      logError(err, 'loadTafseerSurah');
      container.innerHTML = '<p style="color: #f44336;">❌ خطأ في تحميل التفسير</p>';
    }
  }
}

// ============== Memorization Mode ==============
async function loadMemorizeSurah(surahNumber) {
  if (!surahNumber) return;

  const container = document.getElementById('memorizeContainer');
  container.innerHTML = '<div class="loading">جاري تحميل السورة...</div>';

  const cacheKey = `surah_${surahNumber}`;
  const cached = getFromLocal(cacheKey);

  const display = (data) => {
    container.innerHTML = '';
    data.ayahs.forEach((ayah) => {
      const div = document.createElement('div');
      div.style.cssText = 'background: var(--light); padding: 20px; margin-bottom: 20px; border-radius: 10px;';
      div.innerHTML = `
        <p style="font-size: 1.3rem; color: var(--gold); margin-bottom: 10px;"><strong>الآية ${ayah.numberInSurah}:</strong></p>
        <p style="font-size: 1.6rem; line-height: 2.5; margin-bottom: 15px;">${ayah.text}</p>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button onclick="repeatAyah(${ayah.number}, 3)" style="flex: 1;">🔊 3x</button>
          <button onclick="repeatAyah(${ayah.number}, 5)" style="flex: 1;">🔊 5x</button>
          <button onclick="repeatAyah(${ayah.number}, 10)" style="flex: 1;">🔊 10x</button>
        </div>
      `;
      container.appendChild(div);
    });
  };

  if (cached) {
    display(cached);
  } else if (appState.isOnline) {
    try {
      const response = await fetch(API_ENDPOINTS.surahByNumber(surahNumber));
      const data = await response.json();
      saveToLocal(cacheKey, data.data);
      display(data.data);
    } catch (err) {
      logError(err, 'loadMemorizeSurah');
      container.innerHTML = '<p style="color: #f44336;">❌ خطأ في تحميل السورة</p>';
    }
  }
}

// ============== Initialize on page load ==============
window.addEventListener('load', () => {
  const saved = getFromLocal('fontSize');
  if (saved) {
    appState.currentFontSize = parseFloat(saved);
    updateFontDisplay();
  }
});