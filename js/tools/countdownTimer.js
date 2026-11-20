/**
 * Countdown Timer — focus timer with Pause/Resume, visual progress bar, sound alert & full cleanup
 */

const PRESETS = [
  { label: '5 phút', hours: 0, minutes: 5, seconds: 0 },
  { label: '15 phút', hours: 0, minutes: 15, seconds: 0 },
  { label: '25 phút', hours: 0, minutes: 25, seconds: 0 },
  { label: '45 phút', hours: 0, minutes: 45, seconds: 0 },
  { label: '1 giờ', hours: 1, minutes: 0, seconds: 0 },
  { label: '1 giờ 30 phút', hours: 1, minutes: 30, seconds: 0 },
];

const SOUND_OPTIONS = [1, 2, 3, 5, 10];

const clampInt = (value, min, max) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
};

const pad = (value) => String(value).padStart(2, '0');

const formatTime = (totalSeconds) => {
  const safeTotal = Math.max(0, Math.ceil(totalSeconds));
  const hours = Math.floor(safeTotal / 3600);
  const minutes = Math.floor((safeTotal % 3600) / 60);
  const seconds = safeTotal % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

const toSeconds = (hours, minutes, seconds) => hours * 3600 + minutes * 60 + seconds;

export function getHtml() {
  return `
    <div class="tool-header">
      <h1>Countdown Timer</h1>
      <p>Đồng hồ đếm ngược tập trung với Preset nhanh, Tạm dừng/Tiếp tục, thanh tiến trình và âm báo kết thúc.</p>
    </div>

    <div class="split-editor" style="align-items:stretch;">
      <div class="card" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:space-between;">
        <div>
          <div style="display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:12px; margin-bottom:16px;">
            <div>
              <label class="field-label" for="ctHours">Giờ</label>
              <input type="number" id="ctHours" min="0" max="99" value="0" />
            </div>
            <div>
              <label class="field-label" for="ctMinutes">Phút</label>
              <input type="number" id="ctMinutes" min="0" max="59" value="25" />
            </div>
            <div>
              <label class="field-label" for="ctSeconds">Giây</label>
              <input type="number" id="ctSeconds" min="0" max="59" value="0" />
            </div>
          </div>

          <div class="field">
            <span class="field-label">Preset nhanh</span>
            <div class="preset-strip" id="ctPresets">
              ${PRESETS.map(
                (preset) => `
                  <button
                    class="btn btn-secondary btn-sm ct-preset-btn"
                    type="button"
                    data-hours="${preset.hours}"
                    data-minutes="${preset.minutes}"
                    data-seconds="${preset.seconds}"
                  >
                    ${preset.label}
                  </button>
                `,
              ).join('')}
            </div>
          </div>

          <div class="field">
            <label class="field-label" for="ctSoundDuration">Độ dài âm báo khi hết giờ</label>
            <select id="ctSoundDuration">
              ${SOUND_OPTIONS.map((seconds) => `<option value="${seconds}"${seconds === 3 ? ' selected' : ''}>${seconds} giây</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="d-flex align-center justify-between gap-2 flex-wrap mt-2">
          <span id="ctStatus" class="badge badge-green">Sẵn sàng</span>
          <div class="d-flex align-center gap-2">
            <button class="btn btn-ghost" type="button" id="ctReset">Đặt lại</button>
            <button class="btn btn-secondary" type="button" id="ctPause" style="display:none;">Tạm dừng</button>
            <button class="btn btn-primary" type="button" id="ctStart">Bắt đầu</button>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:16px; min-height:260px;">
        <div class="field-label" style="margin:0; text-transform:uppercase; letter-spacing:0.08em;">Thời gian còn lại</div>
        <div id="ctDisplay" style="font-size:clamp(40px, 7vw, 66px); font-weight:700; line-height:1; font-family:var(--font-mono); color:var(--accent); text-align:center;">00:25:00</div>
        <div style="width:100%; max-width:320px; height:6px; border-radius:999px; background:var(--surface-2); overflow:hidden;">
          <div id="ctProgress" style="height:100%; width:100%; background:var(--accent); transition:width 200ms linear;"></div>
        </div>
      </div>
    </div>
  `;
}

export function init() {
  const hoursInput = document.getElementById('ctHours');
  const minutesInput = document.getElementById('ctMinutes');
  const secondsInput = document.getElementById('ctSeconds');
  const soundDurationInput = document.getElementById('ctSoundDuration');
  const statusEl = document.getElementById('ctStatus');
  const displayEl = document.getElementById('ctDisplay');
  const progressEl = document.getElementById('ctProgress');
  const resetBtn = document.getElementById('ctReset');
  const pauseBtn = document.getElementById('ctPause');
  const startBtn = document.getElementById('ctStart');

  let initialTotal = toSeconds(0, 25, 0);
  let remainingMs = initialTotal * 1000;
  let intervalId = null;
  let endSoundTimer = null;
  let lastTickAt = null;
  let audioContext = null;
  let isRunning = false;
  let isPaused = false;

  const getInputs = () => ({
    hours: clampInt(hoursInput.value, 0, 99),
    minutes: clampInt(minutesInput.value, 0, 59),
    seconds: clampInt(secondsInput.value, 0, 59),
  });

  const syncInputs = (totalSeconds) => {
    const safeTotal = Math.max(0, Math.floor(totalSeconds));
    hoursInput.value = String(Math.floor(safeTotal / 3600));
    minutesInput.value = String(Math.floor((safeTotal % 3600) / 60));
    secondsInput.value = String(safeTotal % 60);
  };

  const setStatus = (text, badgeClass = 'badge-green') => {
    statusEl.textContent = text;
    statusEl.className = `badge ${badgeClass}`;
  };

  const updateDisplay = () => {
    displayEl.textContent = formatTime(remainingMs / 1000);
    const pct = initialTotal > 0 ? Math.max(0, Math.min(100, (remainingMs / (initialTotal * 1000)) * 100)) : 0;
    progressEl.style.width = `${pct.toFixed(1)}%`;
  };

  const stopSound = () => {
    if (endSoundTimer) {
      clearTimeout(endSoundTimer);
      endSoundTimer = null;
    }
    if (audioContext) {
      audioContext.close().catch(() => {});
      audioContext = null;
    }
  };

  const playEndSound = (durationSeconds) => {
    const totalDuration = Math.max(0, Number(durationSeconds) || 0);
    if (!totalDuration) return;
    stopSound();

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return;

    audioContext = new AudioContextCtor();
    const gainNode = audioContext.createGain();
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'triangle';
    oscillator.frequency.value = 523.25;
    gainNode.gain.value = 0.0001;
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();

    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(0.06, now + 0.08);
    gainNode.gain.setValueAtTime(0.06, now + Math.max(0.08, totalDuration - 0.2));
    gainNode.gain.linearRampToValueAtTime(0.0001, now + totalDuration);

    endSoundTimer = window.setTimeout(() => {
      try {
        oscillator.stop();
      } catch {}
      audioContext?.close().catch(() => {});
      audioContext = null;
      endSoundTimer = null;
    }, totalDuration * 1000);
  };

  const clearTimer = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    isRunning = false;
    isPaused = false;
    lastTickAt = null;
    pauseBtn.style.display = 'none';
    startBtn.style.display = '';
    startBtn.disabled = false;
  };

  const finishTimer = () => {
    clearTimer();
    remainingMs = 0;
    updateDisplay();
    setStatus('Đã kết thúc', 'badge-red');
    playEndSound(soundDurationInput.value);
  };

  const tick = () => {
    if (!isRunning || isPaused) return;
    const now = Date.now();
    const delta = now - lastTickAt;
    lastTickAt = now;
    remainingMs = Math.max(0, remainingMs - delta);
    updateDisplay();
    if (remainingMs <= 0) finishTimer();
  };

  const reset = () => {
    clearTimer();
    stopSound();
    const values = getInputs();
    initialTotal = toSeconds(values.hours, values.minutes, values.seconds);
    remainingMs = initialTotal * 1000;
    syncInputs(initialTotal);
    updateDisplay();
    setStatus(initialTotal > 0 ? 'Sẵn sàng' : 'Chưa có thời lượng', initialTotal > 0 ? 'badge-green' : 'badge-gray');
    startBtn.disabled = initialTotal <= 0;
  };

  const start = () => {
    if (isRunning) return;
    const values = getInputs();
    initialTotal = toSeconds(values.hours, values.minutes, values.seconds);
    if (initialTotal <= 0) {
      setStatus('Nhập thời lượng > 0', 'badge-red');
      return;
    }
    remainingMs = initialTotal * 1000;
    syncInputs(initialTotal);
    updateDisplay();
    setStatus('Đang chạy...', 'badge-blue');
    isRunning = true;
    isPaused = false;
    lastTickAt = Date.now();
    startBtn.style.display = 'none';
    pauseBtn.style.display = '';
    pauseBtn.textContent = 'Tạm dừng';
    intervalId = window.setInterval(tick, 200);
  };

  pauseBtn.addEventListener('click', () => {
    if (!isRunning) return;
    if (!isPaused) {
      tick();
      isPaused = true;
      pauseBtn.textContent = 'Tiếp tục';
      setStatus('Đang tạm dừng', 'badge-amber');
    } else {
      isPaused = false;
      lastTickAt = Date.now();
      pauseBtn.textContent = 'Tạm dừng';
      setStatus('Đang chạy...', 'badge-blue');
    }
  });

  document.querySelectorAll('.ct-preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (isRunning) return;
      hoursInput.value = btn.dataset.hours || '0';
      minutesInput.value = btn.dataset.minutes || '0';
      secondsInput.value = btn.dataset.seconds || '0';
      reset();
    });
  });

  [hoursInput, minutesInput, secondsInput].forEach((input) => {
    input.addEventListener('input', () => {
      if (!isRunning) reset();
    });
  });

  resetBtn.addEventListener('click', reset);
  startBtn.addEventListener('click', start);

  reset();

  return () => {
    clearTimer();
    stopSound();
  };
}
