/**
 * Countdown Timer — study / work focus timer with preset durations and end beep
 */

const PRESETS = [
  { label: '5 phút', hours: 0, minutes: 5, seconds: 0 },
  { label: '15 phút', hours: 0, minutes: 15, seconds: 0 },
  { label: '25 phút', hours: 0, minutes: 25, seconds: 0 },
  { label: '45 phút', hours: 0, minutes: 45, seconds: 0 },
  { label: '1 giờ', hours: 1, minutes: 0, seconds: 0 },
  { label: '1 giờ 30 phút', hours: 1, minutes: 30, seconds: 0 },
  { label: '2 giờ', hours: 2, minutes: 0, seconds: 0 },
];

const SOUND_OPTIONS = [1, 2, 3, 5, 10];

const clampInt = (value, min, max) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
};

const pad = (value) => String(value).padStart(2, '0');

const formatTime = (totalSeconds) => {
  const safeTotal = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeTotal / 3600);
  const minutes = Math.floor((safeTotal % 3600) / 60);
  const seconds = safeTotal % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

const toSeconds = (hours, minutes, seconds) => hours * 3600 + minutes * 60 + seconds;

export function getHtml() {
  return `
    <style>
      @media (max-width: 820px) {
        .ct-layout {
          grid-template-columns: 1fr !important;
        }

        .ct-options,
        .ct-display {
          padding: 18px !important;
        }

        .ct-options [data-role='preset-list'] {
          gap: 8px;
        }

        .ct-options .btn-group {
          justify-content: flex-start !important;
        }

        .ct-display {
          min-height: auto !important;
        }
      }

      @media (max-width: 560px) {
        .ct-input-grid {
          grid-template-columns: 1fr !important;
        }

        .ct-sound-grid {
          grid-template-columns: 1fr !important;
        }

        .ct-meta-row {
          grid-template-columns: 1fr !important;
          gap: 10px !important;
        }

        .ct-status {
          text-align: left !important;
        }

        .ct-display-value {
          font-size: clamp(34px, 16vw, 54px) !important;
        }

        .ct-actions {
          width: 100%;
        }

        .ct-actions .btn {
          flex: 1 1 0;
        }
      }
    </style>

    <div class="tool-header">
      <h1>Countdown Timer</h1>
      <p>Đồng hồ đếm ngược cho các phiên tập trung. Thiết lập theo giờ/phút/giây, dùng preset sẵn có và âm báo kết thúc tùy chọn.</p>
    </div>

    <div class="ct-layout" style="display:grid; grid-template-columns:minmax(0, 1fr) minmax(0, 0.95fr); gap:16px; align-items:start;">
      <div class="card ct-options">
        <div class="ct-input-grid" style="display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin-bottom:16px;">
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

        <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:16px;">
          <div>
            <div class="field-label">Preset nhanh</div>
            <div class="btn-group" id="ctPresets" data-role="preset-list" style="margin-top:0;">
              ${PRESETS.map(
                (preset) => `
                  <button class="btn btn-secondary btn-sm ct-preset-btn" type="button"
                    data-hours="${preset.hours}" data-minutes="${preset.minutes}" data-seconds="${preset.seconds}">
                    ${preset.label}
                  </button>
                `,
              ).join('')}
            </div>
          </div>
        </div>

        <div class="ct-sound-grid" style="margin-bottom:14px;">
          <div>
            <label class="field-label" for="ctSoundDuration">Độ dài âm báo khi hết giờ</label>
            <select id="ctSoundDuration">
              ${SOUND_OPTIONS.map((seconds) => `<option value="${seconds}"${seconds === 3 ? ' selected' : ''}>${seconds} giây</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="ct-meta-row" style="display:grid; grid-template-columns:minmax(0, 1fr) auto; gap:12px; align-items:center; margin-bottom:8px;">
          <div id="ctStatus" class="ct-status" style="font-size:13px; color:var(--success); text-align:left;">Sẵn sàng</div>
          <div class="btn-group ct-actions" style="justify-content:flex-end; margin-top:0; margin-bottom:0;">
            <button class="btn btn-ghost" type="button" id="ctReset">Đặt lại</button>
            <button class="btn btn-primary" type="button" id="ctStart">Bắt đầu</button>
          </div>
        </div>
      </div>

      <div class="card ct-display" style="display:flex; flex-direction:column; justify-content:center; align-items:center;">
        <div style="font-size:12px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:var(--text-3); margin-bottom:10px;">Đồng hồ đếm ngược</div>
        <div id="ctDisplay" class="ct-display-value" style="font-size:clamp(42px, 8vw, 72px); font-weight:700; line-height:1; font-family:var(--font-mono); color:var(--accent); text-align:center;">00:25:00</div>
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
  const resetBtn = document.getElementById('ctReset');
  const startBtn = document.getElementById('ctStart');

  let initialTotal = toSeconds(0, 25, 0);
  let remainingSeconds = initialTotal;
  let intervalId = null;
  let endSoundTimer = null;
  let startedAt = null;
  let audioContext = null;
  let isRunning = false;

  const getInputs = () => ({
    hours: clampInt(hoursInput.value, 0, 99),
    minutes: clampInt(minutesInput.value, 0, 59),
    seconds: clampInt(secondsInput.value, 0, 59),
  });

  const syncInputs = (totalSeconds) => {
    const safeTotal = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(safeTotal / 3600);
    const minutes = Math.floor((safeTotal % 3600) / 60);
    const seconds = safeTotal % 60;
    hoursInput.value = String(hours);
    minutesInput.value = String(minutes);
    secondsInput.value = String(seconds);
  };

  const setStatus = (text, color = 'var(--success)') => {
    statusEl.textContent = text;
    statusEl.style.color = color;
  };

  const updateDisplay = () => {
    displayEl.textContent = formatTime(remainingSeconds);
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
      oscillator.stop();
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
    startedAt = null;
    isRunning = false;
    startBtn.disabled = false;
  };

  const finishTimer = () => {
    clearTimer();
    remainingSeconds = 0;
    updateDisplay();
    setStatus('Đã kết thúc', 'var(--danger)');
    playEndSound(soundDurationInput.value);
  };

  const tick = () => {
    const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
    remainingSeconds = Math.max(0, initialTotal - elapsedSeconds);
    updateDisplay();
    if (remainingSeconds <= 0) finishTimer();
  };

  const reset = () => {
    clearTimer();
    stopSound();
    const values = getInputs();
    initialTotal = toSeconds(values.hours, values.minutes, values.seconds);
    remainingSeconds = initialTotal;
    syncInputs(initialTotal);
    updateDisplay();
    setStatus(initialTotal > 0 ? 'Sẵn sàng' : 'Chưa có thời lượng');
    startBtn.disabled = initialTotal <= 0;
  };

  const start = () => {
    if (isRunning) return;

    const values = getInputs();
    initialTotal = toSeconds(values.hours, values.minutes, values.seconds);
    if (initialTotal <= 0) {
      setStatus('Hãy nhập thời lượng lớn hơn 0', 'var(--danger)');
      startBtn.disabled = true;
      return;
    }

    remainingSeconds = initialTotal;
    syncInputs(initialTotal);
    updateDisplay();
    setStatus('Đang đếm ngược...', 'var(--accent)');
    startedAt = Date.now();
    isRunning = true;
    startBtn.disabled = true;
    intervalId = window.setInterval(tick, 250);
    tick();
  };

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
      if (isRunning) return;
      reset();
    });
    input.addEventListener('blur', () => {
      if (isRunning) return;
      const current = getInputs();
      hoursInput.value = String(current.hours);
      minutesInput.value = String(current.minutes);
      secondsInput.value = String(current.seconds);
      reset();
    });
  });

  soundDurationInput.addEventListener('change', () => {
    if (!isRunning && remainingSeconds > 0) setStatus('Sẵn sàng');
  });

  resetBtn.addEventListener('click', reset);
  startBtn.addEventListener('click', start);

  reset();
}
