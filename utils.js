// ============== Utility Functions ==============

/**
 * حفظ البيانات في localStorage
 */
function saveToLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    console.log(`✅ Saved: ${key}`);
  } catch (e) {
    console.error(`❌ Error saving ${key}:`, e);
  }
}

/**
 * استرجاع البيانات من localStorage
 */
function getFromLocal(key, defaultValue = null) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  } catch (e) {
    console.error(`❌ Error reading ${key}:`, e);
    return defaultValue;
  }
}

/**
 * حذف بيانات من localStorage
 */
function removeFromLocal(key) {
  try {
    localStorage.removeItem(key);
    console.log(`🗑️ Removed: ${key}`);
  } catch (e) {
    console.error(`❌ Error removing ${key}:`, e);
  }
}

/**
 * تنظيف localStorage
 */
function clearAllLocal() {
  if (confirm('🚨 هل تريد حذف جميع البيانات المحفوظة؟')) {
    localStorage.clear();
    console.log('🗑️ All data cleared');
  }
}

/**
 * حساب نسبة التشابه بين نصين (للتسميع)
 */
function calculateSimilarity(str1, str2) {
  const s1 = str1.trim().replace(/\s+/g, '').toLowerCase();
  const s2 = str2.trim().replace(/\s+/g, '').toLowerCase();
  
  let matches = 0;
  const minLength = Math.min(s1.length, s2.length);
  
  for (let i = 0; i < minLength; i++) {
    if (s1[i] === s2[i]) matches++;
  }
  
  return matches / Math.max(s1.length, s2.length);
}

/**
 * حساب زاوية القبلة
 */
function calculateQiblaAngle(userLat, userLng) {
  const meccaLat = 21.4225;
  const meccaLng = 39.8262;
  
  const dLng = (meccaLng - userLng) * Math.PI / 180;
  const lat1 = userLat * Math.PI / 180;
  const lat2 = meccaLat * Math.PI / 180;
  
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  
  let qibla = Math.atan2(y, x) * 180 / Math.PI;
  return (qibla + 360) % 360;
}

/**
 * تحديد اتجاه البوصلة
 */
function getCompassDirection(angle) {
  const directions = ['شمال ⬆️', 'شمال شرق ↗️', 'شرق ➡️', 'جنوب شرق ↘️', 
                      'جنوب ⬇️', 'جنوب غرب ↙️', 'غرب ⬅️', 'شمال غرب ↖️'];
  return directions[Math.round(angle / 45) % 8];
}

/**
 * تنسيق الوقت (HH:MM:SS)
 */
function formatTime(date) {
  return date.toLocaleTimeString('ar-SA', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
}

/**
 * تنسيق التاريخ
 */
function formatDate(date) {
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * حساب الفرق الزمني
 */
function calculateCountdown(targetDate) {
  const now = new Date();
  const diff = targetDate - now;
  
  if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0 };
  
  return {
    hours: Math.floor(diff / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000)
  };
}

/**
 * تنسيق الأرقام بفاصل الآلاف
 */
function formatNumber(num) {
  return num.toLocaleString('ar-SA');
}

/**
 * إظهار إشعار
 */
function showNotification(title, options = {}) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50" y="80" font-size="80" text-anchor="middle">📖</text></svg>',
      badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23c1a35f"/><text x="50" y="80" font-size="80" text-anchor="middle" fill="%231a2a22">📖</text></svg>',
      tag: 'quran-app',
      requireInteraction: false,
      ...options
    });
  }
}

/**
 * طلب الإذن للإشعارات
 */
function requestNotificationPermission() {
  if ('Notification' in window) {
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log(`📢 Notification permission: ${permission}`);
      });
    }
  }
}

/**
 * Debounce function للبحث
 */
function debounce(func, delay = 400) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle function للأحداث المتكررة
 */
function throttle(func, limit = 1000) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * فتح رابط في نافذة جديدة
 */
function openExternal(url) {
  if (/^https?:\/\//.test(url)) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * تحميل صورة
 */
function preloadImage(url) {
  const img = new Image();
  img.src = url;
  return img;
}

/**
 * التحقق من الإنترنت
 */
function isOnlineConnection() {
  return navigator.onLine;
}

/**
 * شغّل صوت
 */
async function playAudio(url, options = {}) {
  try {
    const audio = new Audio(url);
    audio.volume = options.volume || 1;
    
    if (options.loop) audio.loop = true;
    if (options.autoplay) await audio.play();
    
    return audio;
  } catch (e) {
    console.error('❌ Error playing audio:', e);
    return null;
  }
}

/**
 * حفظ ملف نصي
 */
function downloadAsFile(content, filename = 'data.txt', mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

/**
 * نسخ نص إلى clipboard
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    console.log('✅ Copied to clipboard');
    return true;
  } catch (e) {
    console.error('❌ Copy failed:', e);
    return false;
  }
}

/**
 * قياس الأداء
 */
function measurePerformance(label) {
  performance.mark(label);
}

function endMeasurePerformance(label, name) {
  performance.measure(name, label);
  const measure = performance.getEntriesByName(name)[0];
  console.log(`⏱️ ${name}: ${measure.duration.toFixed(2)}ms`);
}

/**
 * تسجيل الأخطاء
 */
function logError(error, context = '') {
  console.error(`🔴 Error${context ? ' in ' + context : ''}:`, error);
  
  // يمكن إرسال الخطأ إلى خادم
  if (isOnlineConnection()) {
    // إرسال الخطأ إلى النظام
  }
}

/**
 * تحقق من ��لمتصفح
 */
function getBrowserInfo() {
  const ua = navigator.userAgent;
  let browser = 'Unknown';
  
  if (ua.match(/Firefox/i)) browser = 'Firefox';
  else if (ua.match(/Chrome/i)) browser = 'Chrome';
  else if (ua.match(/Safari/i)) browser = 'Safari';
  else if (ua.match(/Edge/i)) browser = 'Edge';
  
  return browser;
}

/**
 * التحقق من الميزات المدعومة
 */
function checkFeatures() {
  return {
    serviceWorker: 'serviceWorker' in navigator,
    notification: 'Notification' in window,
    geolocation: 'geolocation' in navigator,
    storage: 'localStorage' in window,
    clipboard: 'clipboard' in navigator,
    audioAPI: 'AudioContext' in window || 'webkitAudioContext' in window,
  };
}

/**
 * تعطيل اليمين الماوس
 */
function disableContextMenu() {
  document.addEventListener('contextmenu', (e) => e.preventDefault());
}

/**
 * إنشاء معرّف فريد
 */
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}