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
    this.bindEvents();
    this.updateDisplay();
    this.scheduleNextEyeRest();
    this.requestNotificationPermission();
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
    }
  }
  
  bindEvents() {
    // Main controls
    document.getElementById('startPauseBtn').addEventListener('click', () => this.toggleTimer());
    document.getElementById('resetBtn').addEventListener('click', () => this.resetTimer());
    document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
    
    // Settings modal
    document.getElementById('closeSettings').addEventListener('click', () => this.closeSettings());
    document.getElementById('soundEnabled').addEventListener('change', (e) => {
      this.settings.soundEnabled = e.target.checked;
      this.saveSettings();
    });
    document.getElementById('notificationsEnabled').addEventListener('change', (e) => {
      this.settings.notificationsEnabled = e.target.checked;
      this.saveSettings();
    });
    document.getElementById('workDuration').addEventListener('change', (e) => {
      this.settings.workDuration = parseInt(e.target.value);
      this.saveSettings();
      this.applySettings();
    });
    document.getElementById('breakDuration').addEventListener('change', (e) => {
      this.settings.breakDuration = parseInt(e.target.value);
      this.saveSettings();
      this.applySettings();
    });
    
    // Eye rest modal
    document.getElementById('skipEyeRest').addEventListener('click', () => this.skipEyeRest());
    
    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
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
    
    // Update next break time display
    const nextBreakMinutes = Math.ceil(randomInterval / 60);
    document.getElementById('nextBreakTime').textContent = `約 ${nextBreakMinutes} 分鐘內`;
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
    document.getElementById('settingsModal').classList.add('hidden');
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
      
      // Create a simple notification beep
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio not available:', error);
    }
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new FocusClock();
});

// Service Worker registration for PWA capabilities
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(console.error);
}
