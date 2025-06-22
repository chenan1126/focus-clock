import './style.css';

// Focus Clock Application
class FocusClock {
  constructor() {
    // Timer state
    this.isRunning = false;
    this.isPaused = false;
    this.isWorkSession = true;
    this.timeRemaining = 90 * 60; // 90 minutes in seconds
    this.totalSessionTime = 90 * 60;
    this.sessionCount = 0;
    
    // Eye rest functionality
    this.eyeRestInterval = null;
    this.eyeRestActive = false;
    this.eyeRestCountdown = 20;
    
    // Settings
    this.settings = {
      workDuration: 90, // minutes
      breakDuration: 20, // minutes
      soundEnabled: true,
      notificationsEnabled: true
    };
    
    // Audio context for notifications
    this.audioContext = null;
    
    // Timer intervals
    this.mainTimer = null;
    this.eyeRestTimer = null;
    this.nextEyeRestTimeout = null;
    
    this.init();
  }
    init() {
    this.loadSettings();
    // Initialize AdSense
    this.initializeAds();
    // Delay event binding to ensure DOM is ready
    setTimeout(() => {
      this.bindEvents();
    }, 50);
    this.updateDisplay();
    this.scheduleNextEyeRest();
    this.requestNotificationPermission();
  }
  
  initializeAds() {
    // Initialize AdSense ads after DOM is loaded
    setTimeout(() => {
      try {
        (adsbygoogle = window.adsbygoogle || []).push({});
        (adsbygoogle = window.adsbygoogle || []).push({});
        console.log('AdSense ads initialized');
      } catch (error) {
        console.log('AdSense not available or blocked');
      }
    }, 1000);
  }
  
  loadSettings() {
    const saved = localStorage.getItem('focusClockSettings');
    if (saved) {
      this.settings = { ...this.settings, ...JSON.parse(saved) };
    }
    this.applySettings();
  }
  
  saveSettings() {
    localStorage.setItem('focusClockSettings', JSON.stringify(this.settings));
  }
  
  applySettings() {
    // Update UI elements
    document.getElementById('soundEnabled').checked = this.settings.soundEnabled;
    document.getElementById('notificationsEnabled').checked = this.settings.notificationsEnabled;
    document.getElementById('workDuration').value = this.settings.workDuration;
    document.getElementById('breakDuration').value = this.settings.breakDuration;
    
    // Update timer if not running
    if (!this.isRunning) {
      if (this.isWorkSession) {
        this.timeRemaining = this.settings.workDuration * 60;
        this.totalSessionTime = this.settings.workDuration * 60;
      } else {
        this.timeRemaining = this.settings.breakDuration * 60;
        this.totalSessionTime = this.settings.breakDuration * 60;
      }
      this.updateDisplay();
    }  }
  bindEvents() {
    // Helper function to safely add event listeners
    const safeAddEventListener = (id, event, handler) => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener(event, handler);
        console.log(`Event listener added for ${id}`);
        return true;
      } else {
        console.warn(`Element with ID '${id}' not found`);
        return false;
      }
    };

    // Main controls
    safeAddEventListener('startPauseBtn', 'click', () => this.toggleTimer());
    safeAddEventListener('resetBtn', 'click', () => this.resetTimer());
    safeAddEventListener('settingsBtn', 'click', () => this.openSettings());
    
    // Instructions toggle
    safeAddEventListener('instructionsHeader', 'click', () => this.toggleInstructions());
    safeAddEventListener('toggleInstructions', 'click', (e) => {
      e.stopPropagation();
      this.toggleInstructions();
    });
    
    // Settings modal events
    safeAddEventListener('closeSettings', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Close settings button clicked');
      this.closeSettings();
    });
    
    safeAddEventListener('closeSettingsX', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Close settings X button clicked');
      this.closeSettings();
    });
    
    // Settings form controls
    safeAddEventListener('soundEnabled', 'change', (e) => {
      this.settings.soundEnabled = e.target.checked;
      this.saveSettings();
    });
    
    safeAddEventListener('notificationsEnabled', 'change', (e) => {
      this.settings.notificationsEnabled = e.target.checked;
      this.saveSettings();
    });
    
    safeAddEventListener('workDuration', 'change', (e) => {
      this.settings.workDuration = parseInt(e.target.value);
      this.saveSettings();
      this.applySettings();
    });
    
    safeAddEventListener('breakDuration', 'change', (e) => {
      this.settings.breakDuration = parseInt(e.target.value);
      this.saveSettings();
      this.applySettings();
    });
      // Eye rest modal
    safeAddEventListener('skipEyeRest', 'click', () => this.skipEyeRest());
    
    // Share functionality
    safeAddEventListener('shareProgress', 'click', () => this.toggleShareOptions());
    safeAddEventListener('shareTwitter', 'click', () => this.shareToTwitter());
    safeAddEventListener('shareFacebook', 'click', () => this.shareToFacebook());
    safeAddEventListener('shareLinkedIn', 'click', () => this.shareToLinkedIn());
    safeAddEventListener('copyShareLink', 'click', () => this.copyShareLink());
    
    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal') && !e.target.closest('.modal-content')) {
        e.target.classList.add('hidden');
      }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.target.matches('input, select, button')) {
        e.preventDefault();
        this.toggleTimer();
      } else if (e.code === 'Escape') {
        this.closeAllModals();
      }
    });
  }
  
  toggleTimer() {
    if (this.isRunning) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
  }
  
  startTimer() {
    this.isRunning = true;
    this.isPaused = false;
    
    // Update UI
    document.getElementById('startPauseBtn').textContent = '暫停';
    document.querySelector('.timer-circle').classList.add('active');
    
    // Start main timer
    this.mainTimer = setInterval(() => {
      this.timeRemaining--;
      this.updateDisplay();
      
      if (this.timeRemaining <= 0) {
        this.completeSession();
      }
    }, 1000);
    
    // Schedule eye rest reminders only during work sessions
    if (this.isWorkSession) {
      this.scheduleNextEyeRest();
    }
  }
  
  pauseTimer() {
    this.isRunning = false;
    this.isPaused = true;
    
    // Update UI
    document.getElementById('startPauseBtn').textContent = '繼續';
    document.querySelector('.timer-circle').classList.remove('active');
    
    // Clear timers
    if (this.mainTimer) {
      clearInterval(this.mainTimer);
      this.mainTimer = null;
    }
    
    if (this.nextEyeRestTimeout) {
      clearTimeout(this.nextEyeRestTimeout);
      this.nextEyeRestTimeout = null;
    }
  }
  
  resetTimer() {
    this.isRunning = false;
    this.isPaused = false;
    
    // Clear all timers
    if (this.mainTimer) {
      clearInterval(this.mainTimer);
      this.mainTimer = null;
    }
    if (this.nextEyeRestTimeout) {
      clearTimeout(this.nextEyeRestTimeout);
      this.nextEyeRestTimeout = null;
    }
    
    // Reset time
    if (this.isWorkSession) {
      this.timeRemaining = this.settings.workDuration * 60;
      this.totalSessionTime = this.settings.workDuration * 60;
    } else {
      this.timeRemaining = this.settings.breakDuration * 60;
      this.totalSessionTime = this.settings.breakDuration * 60;
    }
    
    // Update UI
    document.getElementById('startPauseBtn').textContent = '開始';
    document.querySelector('.timer-circle').classList.remove('active');
    this.updateDisplay();
  }
  
  completeSession() {
    this.isRunning = false;
    
    // Clear timers
    if (this.mainTimer) {
      clearInterval(this.mainTimer);
      this.mainTimer = null;
    }
    
    if (this.isWorkSession) {
      // Work session completed
      this.sessionCount++;
      this.isWorkSession = false;
      this.timeRemaining = this.settings.breakDuration * 60;
      this.totalSessionTime = this.settings.breakDuration * 60;
      
      this.showNotification('工作時間結束！', '時間休息一下吧 🎉');
      this.playNotificationSound();
    } else {
      // Break completed
      this.isWorkSession = true;
      this.timeRemaining = this.settings.workDuration * 60;
      this.totalSessionTime = this.settings.workDuration * 60;
      
      this.showNotification('休息結束！', '準備開始新的工作週期 💪');
      this.playNotificationSound();
    }
    
    // Update UI
    document.getElementById('startPauseBtn').textContent = '開始';
    document.querySelector('.timer-circle').classList.remove('active');
    this.updateDisplay();
    this.updateProgress();
  }
    scheduleNextEyeRest() {
    if (!this.isWorkSession || !this.isRunning) return;
    
    // Random interval between 3-5 minutes (180-300 seconds)
    const randomInterval = Math.floor(Math.random() * (300 - 180 + 1)) + 180;
    
    this.nextEyeRestTimeout = setTimeout(() => {
      if (this.isRunning && this.isWorkSession) {
        this.showEyeRest();
      }
    }, randomInterval * 1000);
    
    // 移除顯示下次休息時間，保持隨機的驚喜感
  }
  
  showEyeRest() {
    if (this.eyeRestActive) return;
    
    this.eyeRestActive = true;
    this.eyeRestCountdown = 20;
    
    // Show modal
    document.getElementById('eyeRestModal').classList.remove('hidden');
    document.getElementById('eyeRestCountdown').textContent = this.eyeRestCountdown;
    
    // Play notification sound
    this.playNotificationSound();
    
    // Show browser notification
    this.showNotification('護眼休息時間！', '請閉上眼睛休息 20 秒 👁️');
    
    // Start countdown
    this.eyeRestTimer = setInterval(() => {
      this.eyeRestCountdown--;
      document.getElementById('eyeRestCountdown').textContent = this.eyeRestCountdown;
      
      if (this.eyeRestCountdown <= 0) {
        this.endEyeRest();
      }
    }, 1000);
  }
  
  endEyeRest() {
    this.eyeRestActive = false;
    
    // Clear timer
    if (this.eyeRestTimer) {
      clearInterval(this.eyeRestTimer);
      this.eyeRestTimer = null;
    }
    
    // Hide modal
    document.getElementById('eyeRestModal').classList.add('hidden');
    
    // Schedule next eye rest
    this.scheduleNextEyeRest();
  }
  
  skipEyeRest() {
    this.endEyeRest();
  }
  
  updateDisplay() {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    document.getElementById('timeDisplay').textContent = timeString;
    
    // Update session type and phase
    const sessionType = this.isWorkSession ? '專注時間' : '休息時間';
    const phase = this.isRunning ? (this.isWorkSession ? '工作中' : '休息中') : '準備中';
    
    document.getElementById('sessionType').textContent = sessionType;
    document.getElementById('phaseDisplay').textContent = phase;
    
    // Update session type styling
    const sessionElement = document.getElementById('sessionType');
    sessionElement.style.background = this.isWorkSession ? 'var(--primary-color)' : 'var(--secondary-color)';
    
    // Update document title
    document.title = `${timeString} - ${sessionType} - 專注時鐘`;
  }
  
  updateProgress() {
    document.getElementById('completedSessions').textContent = this.sessionCount;
    
    // Calculate daily goal progress (assume 4 work sessions per day)
    const dailyGoal = 4;
    const progressPercentage = Math.min((this.sessionCount / dailyGoal) * 100, 100);
    document.getElementById('progressFill').style.width = `${progressPercentage}%`;
  }
    openSettings() {
    document.getElementById('settingsModal').classList.remove('hidden');
  }
  closeSettings() {
    console.log('closeSettings method called');
    const modal = document.getElementById('settingsModal');
    
    if (modal) {
      modal.classList.add('hidden');
      console.log('Settings modal closed successfully');
    } else {
      console.error('Settings modal not found!');
    }
  }
  
  closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.classList.add('hidden');
    });
  }
  
  async requestNotificationPermission() {
    if ('Notification' in window && this.settings.notificationsEnabled) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    }
  }
  
  showNotification(title, body) {
    if (!this.settings.notificationsEnabled) return;
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: body,
        icon: '/clock.svg',
        tag: 'focus-clock'
      });
    }
  }
    async playNotificationSound() {
    if (!this.settings.soundEnabled) return;
    
    try {
      // Initialize audio context if needed
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      // Create a gentle notification sound
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // 使用更溫和的頻率和音量
      oscillator.frequency.setValueAtTime(520, this.audioContext.currentTime); // 降低頻率 (原800->520)
      gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime); // 降低音量 (原0.1->0.05)
      gainNode.gain.exponentialRampToValueAtTime(0.005, this.audioContext.currentTime + 0.8); // 更長的淡出
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.8); // 更長的持續時間
    } catch (error) {
      console.log('Audio not available:', error);
    }
  }
    toggleInstructions() {
    const content = document.getElementById('instructionsContent');
    const toggleBtn = document.getElementById('toggleInstructions');
    
    if (content.classList.contains('expanded')) {
      content.classList.remove('expanded');
      toggleBtn.textContent = '展開';
    } else {
      content.classList.add('expanded');
      toggleBtn.textContent = '收起';
    }
  }
  
  // Share functionality methods
  toggleShareOptions() {
    const shareOptions = document.getElementById('shareOptions');
    if (shareOptions) {
      shareOptions.classList.toggle('hidden');
    }
  }
  
  generateShareText() {
    const completedSessions = this.sessionCount;
    const totalMinutes = completedSessions * this.settings.workDuration;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    let timeText = '';
    if (hours > 0) {
      timeText = `${hours}小時${minutes > 0 ? minutes + '分鐘' : ''}`;
    } else {
      timeText = `${minutes}分鐘`;
    }
    
    const messages = [
      `今天我用專注時鐘完成了 ${completedSessions} 個工作週期，總共專注了 ${timeText}！💪`,
      `🎯 專注打卡！今日已完成 ${completedSessions} 個90分鐘專注週期，累積專注時間 ${timeText} 📚`,
      `⏰ 專注時鐘幫我今天保持專注 ${timeText}，完成了 ${completedSessions} 個工作週期！效率滿分 🔥`,
      `💡 今日專注成果：${completedSessions} 個工作週期 | ${timeText} 專注時間 | 專注時鐘讓我更高效！✨`
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  shareToTwitter() {
    const text = this.generateShareText();
    const url = window.location.href;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=專注時鐘,番茄鐘,專注,效率`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
    this.toggleShareOptions();
  }
  
  shareToFacebook() {
    const url = window.location.href;
    const text = this.generateShareText();
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    this.toggleShareOptions();
  }
  
  shareToLinkedIn() {
    const text = this.generateShareText();
    const url = window.location.href;
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`;
    window.open(linkedInUrl, '_blank', 'width=600,height=400');
    this.toggleShareOptions();
  }
  
  async copyShareLink() {
    const text = this.generateShareText();
    const url = window.location.href;
    const shareText = `${text}\n\n🔗 ${url}`;
    
    try {
      await navigator.clipboard.writeText(shareText);
      // 顯示複製成功提示
      const copyBtn = document.getElementById('copyShareLink');
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = '<span class="share-platform-icon">✅</span>已複製';
      copyBtn.style.background = 'var(--secondary-color)';
      
      setTimeout(() => {
        copyBtn.innerHTML = originalText;
        copyBtn.style.background = '';
      }, 2000);
    } catch (err) {
      // 備用方案：創建臨時文本區域
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      // 顯示提示
      alert('分享內容已複製到剪貼板！');
    }
    
    this.toggleShareOptions();
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing FocusClock...');
  setTimeout(() => {
    const app = new FocusClock();
    window.app = app;
    console.log('FocusClock initialized successfully');
  }, 100);
  
  // Global function for debugging
  window.closeSettingsModal = function() {
    console.log('Global close function called');
    const modal = document.getElementById('settingsModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
      console.log('Modal closed via global function');
    }
  };
});

// Service Worker registration for PWA capabilities
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(console.error);
}
