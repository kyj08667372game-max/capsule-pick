/**
 * 오늘의 운명, 피할 수 없습니다. - 미래 과학 연구소 캡슐 추첨 시스템 로직
 * 순수 Vanilla JavaScript / CSP-RNG 공정 추첨 / 정밀 애니메이션 타임라인
 */

(function () {
  'use strict';

  // =========================================================================
  // 상태 관리 (State)
  // =========================================================================
  const state = {
    participants: [], // 참가자 문자열 배열 (최대 12)
    maxParticipants: 12,
    isDrawing: false, // 추첨 진행 중 여부
    hasDrawn: false, // 추첨 1회 이상 완료 여부
    winnerIndex: null, // 당첨자 인덱스
    soundEnabled: true, // 사운드 효과 활성화 여부
  };

  // 캡슐별 미래 연구소 테마 색상 팔레트 (12가지 세련된 샘플 튜브 틴트)
  const CAPSULE_PALETTES = [
    { start: 'rgba(0, 229, 255, 0.4)', mid: 'rgba(12, 35, 55, 0.85)', end: 'rgba(0, 150, 220, 0.4)', glow: 'rgba(0, 229, 255, 0.35)', dot: '#00e5ff' },
    { start: 'rgba(157, 78, 221, 0.4)', mid: 'rgba(35, 18, 55, 0.85)', end: 'rgba(110, 45, 175, 0.4)', glow: 'rgba(157, 78, 221, 0.35)', dot: '#9d4edd' },
    { start: 'rgba(255, 93, 143, 0.4)', mid: 'rgba(50, 16, 32, 0.85)', end: 'rgba(200, 50, 100, 0.4)', glow: 'rgba(255, 93, 143, 0.35)', dot: '#ff5d8f' },
    { start: 'rgba(56, 189, 248, 0.4)', mid: 'rgba(15, 30, 50, 0.85)', end: 'rgba(30, 100, 180, 0.4)', glow: 'rgba(56, 189, 248, 0.35)', dot: '#38bdf8' },
    { start: 'rgba(74, 222, 128, 0.4)', mid: 'rgba(16, 45, 30, 0.85)', end: 'rgba(35, 140, 80, 0.4)', glow: 'rgba(74, 222, 128, 0.35)', dot: '#4ade80' },
    { start: 'rgba(251, 146, 60, 0.4)', mid: 'rgba(48, 25, 15, 0.85)', end: 'rgba(190, 85, 30, 0.4)', glow: 'rgba(251, 146, 60, 0.35)', dot: '#fb923c' },
    { start: 'rgba(192, 132, 252, 0.4)', mid: 'rgba(38, 20, 60, 0.85)', end: 'rgba(140, 70, 210, 0.4)', glow: 'rgba(192, 132, 252, 0.35)', dot: '#c084fc' },
    { start: 'rgba(45, 212, 191, 0.4)', mid: 'rgba(12, 40, 42, 0.85)', end: 'rgba(20, 140, 130, 0.4)', glow: 'rgba(45, 212, 191, 0.35)', dot: '#2dd4bf' },
    { start: 'rgba(244, 114, 182, 0.4)', mid: 'rgba(45, 18, 38, 0.85)', end: 'rgba(180, 60, 130, 0.4)', glow: 'rgba(244, 114, 182, 0.35)', dot: '#f472b6' },
    { start: 'rgba(96, 165, 250, 0.4)', mid: 'rgba(18, 30, 58, 0.85)', end: 'rgba(50, 100, 200, 0.4)', glow: 'rgba(96, 165, 250, 0.35)', dot: '#60a5fa' },
    { start: 'rgba(250, 204, 21, 0.4)', mid: 'rgba(45, 38, 12, 0.85)', end: 'rgba(180, 140, 15, 0.4)', glow: 'rgba(250, 204, 21, 0.35)', dot: '#facc15' },
    { start: 'rgba(167, 139, 250, 0.4)', mid: 'rgba(32, 24, 55, 0.85)', end: 'rgba(120, 90, 200, 0.4)', glow: 'rgba(167, 139, 250, 0.35)', dot: '#a78bfa' },
  ];

  // =========================================================================
  // DOM 요소 캐싱
  // =========================================================================
  const DOM = {
    // 캡슐 기계 부품
    capsuleMachine: document.getElementById('capsuleMachine'),
    capsulesChamber: document.getElementById('capsulesChamber'),
    quantumCore: document.getElementById('quantumCore'),
    scanLaser: document.getElementById('scanLaser'),
    gaugePressure: document.getElementById('gaugePressure'),
    
    // 상태 및 결과
    statusBanner: document.getElementById('statusBanner'),
    statusMessage: document.getElementById('statusMessage'),
    statusIcon: document.getElementById('statusIcon'),
    fateResultCard: document.getElementById('fateResultCard'),
    winnerName: document.getElementById('winnerName'),
    winnerCapsuleTag: document.getElementById('winnerCapsuleTag'),
    
    // 버튼
    drawBtn: document.getElementById('drawBtn'),
    drawBtnText: document.getElementById('drawBtnText'),
    drawConditionHint: document.getElementById('drawConditionHint'),
    soundToggleBtn: document.getElementById('soundToggleBtn'),
    soundIconOn: document.querySelector('.sound-icon-on'),
    soundIconOff: document.querySelector('.sound-icon-off'),
    soundLabel: document.querySelector('.sound-label'),
    
    // 참가자 관리
    participantForm: document.getElementById('participantForm'),
    participantInput: document.getElementById('participantInput'),
    addParticipantBtn: document.getElementById('addParticipantBtn'),
    participantsList: document.getElementById('participantsList'),
    participantCountBadge: document.getElementById('participantCountBadge'),
    emptyPlaceholder: document.getElementById('emptyPlaceholder'),
    inputFeedback: document.getElementById('inputFeedback'),
    
    // 프리셋 버튼
    presetLunchBtn: document.getElementById('presetLunchBtn'),
    presetDutyBtn: document.getElementById('presetDutyBtn'),
    presetResetBtn: document.getElementById('presetResetBtn'),

    // 파티클 캔버스
    particleCanvas: document.getElementById('particleCanvas'),
  };

  // =========================================================================
  // Web Audio API 사운드 신시사이저 (외부 파일 의존 없음)
  // =========================================================================
  let audioCtx = null;

  function initAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  const SoundFX = {
    // 1단계: 양자 와류 모터 가속 험
    playVortexHum() {
      if (!state.soundEnabled || !audioCtx) return;
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(320, audioCtx.currentTime + 1.2);
        
        // 저역 통과 필터로 부드러운 험 연출
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, audioCtx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 1.2);

        gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.3);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 1.2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 1.25);
      } catch (e) {
        console.warn('Audio error:', e);
      }
    },

    // 2단계: 스캔 레이저 이동 사운드
    playLaserSweep() {
      if (!state.soundEnabled || !audioCtx) return;
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 1.5);

        gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.2);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 1.55);
      } catch (e) {
        console.warn('Audio error:', e);
      }
    },

    // 3단계: 타겟 록온 톤
    playLockOnTone() {
      if (!state.soundEnabled || !audioCtx) return;
      try {
        [0, 0.12].forEach((delay) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1174.66, audioCtx.currentTime + delay); // D6
          gain.gain.setValueAtTime(0.15, audioCtx.currentTime + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + 0.18);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(audioCtx.currentTime + delay);
          osc.stop(audioCtx.currentTime + delay + 0.2);
        });
      } catch (e) {
        console.warn('Audio error:', e);
      }
    },

    // 4단계: 캡슐 추출 시 덜컹거리는 기계 서스펜스 럼블 사운드
    playMechanicalThud() {
      if (!state.soundEnabled || !audioCtx) return;
      try {
        // 저음 메카닉 충격음
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(35, audioCtx.currentTime + 0.35);

        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.38);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } catch (e) {
        console.warn('Audio error:', e);
      }
    },

    // 4단계 & 5단계: 최종 당첨 공개 챠임 (우아한 메이저 아르페지오)
    playWinnerReveal() {
      if (!state.soundEnabled || !audioCtx) return;
      try {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.1);
          gain.gain.setValueAtTime(0.15, audioCtx.currentTime + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.1 + 0.8);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(audioCtx.currentTime + idx * 0.1);
          osc.stop(audioCtx.currentTime + idx * 0.1 + 0.85);
        });
      } catch (e) {
        console.warn('Audio error:', e);
      }
    },

    // 클릭 일반 사운드
    playClick() {
      if (!state.soundEnabled || !audioCtx) return;
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(700, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.06);
      } catch (e) {
        console.warn('Audio error:', e);
      }
    }
  };

  // =========================================================================
  // 공정 난수 추출 함수 (Rejection Sampling으로 편향 완전 제거)
  // crypto.getRandomValues 사용
  // =========================================================================
  function getSecureRandomIndex(max) {
    if (max <= 1) return 0;
    // 32비트 부호없는 정수 최대값: 0xFFFFFFFF (4294967295)
    // 잉여 편향(modulo bias)을 배제하기 위해 한계값 계산
    const limit = Math.floor(0xffffffff / max) * max;
    const array = new Uint32Array(1);
    let rand;
    do {
      window.crypto.getRandomValues(array);
      rand = array[0];
    } while (rand >= limit);
    return rand % max;
  }

  // =========================================================================
  // 참가자 관리 기능 (추가, 삭제, 유효성 검사, 동기화)
  // =========================================================================

  function showFeedback(message, isError = true) {
    DOM.inputFeedback.textContent = message;
    DOM.inputFeedback.style.color = isError ? 'var(--accent-pink)' : 'var(--accent-cyan)';
    DOM.inputFeedback.style.opacity = '1';
    
    // 3초 후 페이드아웃
    clearTimeout(DOM.inputFeedback._timer);
    DOM.inputFeedback._timer = setTimeout(() => {
      DOM.inputFeedback.style.opacity = '0';
    }, 3200);
  }

  function clearFeedback() {
    DOM.inputFeedback.textContent = '';
    DOM.inputFeedback.style.opacity = '0';
  }

  function addParticipant(rawName) {
    if (state.isDrawing) return;

    const name = (rawName || '').trim();

    // 1. 공백 및 빈 값 검사
    if (!name) {
      showFeedback('참가자 이름을 입력해 주세요.');
      DOM.participantInput.focus();
      return;
    }

    // 2. 최대 참가자 수 (12명) 검사
    if (state.participants.length >= state.maxParticipants) {
      showFeedback(`최대 ${state.maxParticipants}명까지만 등록할 수 있습니다.`);
      return;
    }

    // 3. 중복 이름 검사
    if (state.participants.includes(name)) {
      showFeedback(`"${name}" 님은 이미 등록되어 있습니다.`);
      DOM.participantInput.select();
      return;
    }

    // 참가자 등록
    state.participants.push(name);
    DOM.participantInput.value = '';
    clearFeedback();
    SoundFX.playClick();

    // 화면 갱신
    renderParticipants();
    renderCapsules();
    updateDrawButtonState();

    // 이전 추첨 결과가 있다면 초기화
    resetPreviousResult();
  }

  function removeParticipant(index) {
    if (state.isDrawing) return;
    if (index < 0 || index >= state.participants.length) return;

    const removedName = state.participants.splice(index, 1)[0];
    clearFeedback();
    SoundFX.playClick();

    renderParticipants();
    renderCapsules();
    updateDrawButtonState();
    resetPreviousResult();
  }

  function resetPreviousResult() {
    DOM.capsuleMachine.classList.remove('is-rumbling', 'is-heavy-shake');
    if (state.hasDrawn) {
      state.hasDrawn = false;
      state.winnerIndex = null;
      DOM.fateResultCard.style.display = 'none';
      DOM.statusBanner.style.display = 'inline-flex';
      DOM.statusBanner.classList.remove('is-analyzing');
      DOM.statusMessage.textContent = '참가자 목록이 변경되었습니다. 추첨 버튼을 눌러주세요.';
      DOM.statusIcon.textContent = '◈';
      DOM.drawBtnText.textContent = '캡슐 뽑기';
    }
  }

  // 참가자 목록 DOM 렌더링
  function renderParticipants() {
    const count = state.participants.length;
    DOM.participantCountBadge.textContent = `${count} / ${state.maxParticipants}명`;
    
    if (count >= state.maxParticipants) {
      DOM.participantCountBadge.classList.add('is-full');
      DOM.participantInput.disabled = true;
      DOM.addParticipantBtn.disabled = true;
    } else {
      DOM.participantCountBadge.classList.remove('is-full');
      DOM.participantInput.disabled = state.isDrawing;
      DOM.addParticipantBtn.disabled = state.isDrawing;
    }

    if (count === 0) {
      DOM.participantsList.innerHTML = '';
      DOM.emptyPlaceholder.style.display = 'flex';
      return;
    }

    DOM.emptyPlaceholder.style.display = 'none';
    DOM.participantsList.innerHTML = '';

    state.participants.forEach((name, index) => {
      const palette = CAPSULE_PALETTES[index % CAPSULE_PALETTES.length];
      const chip = document.createElement('div');
      chip.className = 'participant-chip';
      chip.setAttribute('role', 'listitem');
      chip.style.setProperty('--chip-color', palette.dot);
      chip.style.setProperty('--chip-border', palette.start);

      chip.innerHTML = `
        <span class="chip-color-dot" aria-hidden="true"></span>
        <span class="chip-name" title="${escapeHtml(name)}">${escapeHtml(name)}</span>
        <button type="button" class="chip-remove-btn" data-index="${index}" aria-label="${escapeHtml(name)} 삭제" ${state.isDrawing ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      `;

      DOM.participantsList.appendChild(chip);
    });
  }

  // =========================================================================
  // 캡슐 기계 내부 캡슐 렌더링 (참가자와 1:1 완벽 동기화)
  // =========================================================================
  function renderCapsules() {
    DOM.capsulesChamber.innerHTML = '';
    DOM.capsulesChamber.className = 'capsules-chamber';

    state.participants.forEach((name, index) => {
      const palette = CAPSULE_PALETTES[index % CAPSULE_PALETTES.length];
      const capsule = document.createElement('div');
      capsule.className = 'quantum-capsule';
      capsule.id = `capsule-${index}`;
      capsule.dataset.index = index;

      // 물리적 부유감 분산값
      const idleRot = (index % 2 === 0 ? 1 : -1) * (3 + (index * 4) % 15);
      const floatDelay = -(index * 0.45);
      const floatY = -(5 + (index * 3) % 8);
      const mixX = (index % 2 === 0 ? 18 : -18) + (index * 2);
      const mixY = (index % 3 === 0 ? -14 : 14);

      capsule.style.setProperty('--capsule-tint-start', palette.start);
      capsule.style.setProperty('--capsule-tint-mid', palette.mid);
      capsule.style.setProperty('--capsule-tint-end', palette.end);
      capsule.style.setProperty('--capsule-glow', palette.glow);
      capsule.style.setProperty('--capsule-border', palette.start);
      capsule.style.setProperty('--idle-rot', `${idleRot}deg`);
      capsule.style.setProperty('--float-delay', `${floatDelay}s`);
      capsule.style.setProperty('--float-y', `${floatY}px`);
      capsule.style.setProperty('--mix-x', `${mixX}px`);
      capsule.style.setProperty('--mix-y', `${mixY}px`);

      capsule.innerHTML = `
        <span class="capsule-label" title="${escapeHtml(name)}">${escapeHtml(name)}</span>
      `;

      DOM.capsulesChamber.appendChild(capsule);
    });
  }

  // 추첨 버튼 활성화/비활성화 상태 제어
  function updateDrawButtonState() {
    const count = state.participants.length;

    if (state.isDrawing) {
      DOM.drawBtn.disabled = true;
      DOM.drawConditionHint.textContent = '양자 캡슐 추첨이 진행 중입니다...';
      return;
    }

    if (count < 2) {
      DOM.drawBtn.disabled = true;
      DOM.drawConditionHint.textContent = count === 0 
        ? '참가자를 최소 2명 이상 등록해야 캡슐을 뽑을 수 있습니다.' 
        : '공정한 추첨을 위해 참가자를 1명 더 추가해 주세요. (현재 1명)';
    } else {
      DOM.drawBtn.disabled = false;
      DOM.drawConditionHint.textContent = state.hasDrawn 
        ? '언제든지 다시 공정하게 재추첨할 수 있습니다.' 
        : `준비 완료: 등록된 ${count}명의 참가자 중 1명을 무작위 선발합니다.`;
    }
  }

  // =========================================================================
  // 정밀 7단계 추첨 애니메이션 시퀀스 (총 약 4.5초)
  // =========================================================================
  function startCapsuleLottery() {
    if (state.isDrawing || state.participants.length < 2) return;

    initAudioContext();
    SoundFX.playClick();

    // 1. 공정 무작위 선정: 추첨 시작 시점에 즉시 암호학적 난수로 공정하게 당첨자 선정!
    const winnerIndex = getSecureRandomIndex(state.participants.length);
    const winnerName = state.participants[winnerIndex];
    state.winnerIndex = winnerIndex;
    state.isDrawing = true;

    // UI 상태 잠금
    setUIInteractionsEnabled(false);
    DOM.fateResultCard.style.display = 'none';
    DOM.statusBanner.style.display = 'inline-flex';
    DOM.statusBanner.classList.add('is-analyzing');
    DOM.drawBtnText.textContent = '운명 분석 중...';
    updateDrawButtonState();

    // -----------------------------------------------------------------------
    // [1단계] 추첨 시작 (0.0s ~ 1.2s): 양자 코어 가속 및 캡슐 와류 회전
    // -----------------------------------------------------------------------
    DOM.statusMessage.textContent = '양자 확률 코어 가동... 캡슐 와류 혼합 중';
    DOM.statusIcon.textContent = '⚡';
    DOM.quantumCore.classList.add('is-active');
    DOM.capsuleMachine.classList.remove('is-heavy-shake');
    DOM.capsuleMachine.classList.add('is-rumbling'); // 기계 진동 시작
    DOM.capsulesChamber.className = 'capsules-chamber is-mixing';
    DOM.gaugePressure.textContent = '148.6 kPa';
    SoundFX.playVortexHum();

    // -----------------------------------------------------------------------
    // [2단계] 캡슐 스캔 (1.2s ~ 2.7s): 시안 블루 레이저 하강 및 감속
    // -----------------------------------------------------------------------
    setTimeout(() => {
      DOM.statusMessage.textContent = '운명을 분석하는 중...';
      DOM.statusIcon.textContent = '◈';
      DOM.capsulesChamber.className = 'capsules-chamber is-scanning';
      DOM.gaugePressure.textContent = '103.2 kPa';

      // 레이저 빔 애니메이션 실행
      DOM.scanLaser.style.transition = 'none';
      DOM.scanLaser.style.top = '0px';
      DOM.scanLaser.style.opacity = '1';
      SoundFX.playLaserSweep();

      // 강제 리플로우
      void DOM.scanLaser.offsetWidth;

      DOM.scanLaser.style.transition = 'top 1.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease';
      DOM.scanLaser.style.top = '360px';

      // 레이저가 지나갈 때 캡슐 반사광 효과
      const capsules = DOM.capsulesChamber.querySelectorAll('.quantum-capsule');
      capsules.forEach((cap, i) => {
        setTimeout(() => {
          cap.classList.add('laser-hit');
          setTimeout(() => cap.classList.remove('laser-hit'), 350);
        }, 300 + i * 80);
      });
    }, 1200);

    // -----------------------------------------------------------------------
    // [3단계] 당첨 캡슐 타겟 록온 (2.7s ~ 3.3s): 타겟 록온 및 순간 정적
    // -----------------------------------------------------------------------
    setTimeout(() => {
      DOM.scanLaser.style.opacity = '0';
      DOM.statusMessage.textContent = '타겟 캡슐 고정... 확률 매트릭스 수렴';
      DOM.statusIcon.textContent = '◉';

      // 록온 순간 일시적으로 진동 멈춤 (숨막히는 정적)
      DOM.capsuleMachine.classList.remove('is-rumbling');
      DOM.gaugePressure.textContent = '175.4 kPa';

      DOM.capsulesChamber.classList.remove('is-mixing', 'is-scanning');
      DOM.capsulesChamber.classList.add('has-selection');

      // 미리 선정된 당첨 캡슐 요소 타겟팅
      const winnerCapsule = document.getElementById(`capsule-${winnerIndex}`);
      if (winnerCapsule) {
        winnerCapsule.classList.add('is-winner');
      }

      SoundFX.playLockOnTone();
    }, 2700);

    // -----------------------------------------------------------------------
    // [4단계] 당첨 캡슐 추출 (3.3s ~ 4.2s): 기계가 덜컹거리며 강력하게 요동치는 서스펜스 흔들림
    // -----------------------------------------------------------------------
    setTimeout(() => {
      DOM.statusMessage.textContent = '선택된 캡슐 추출 파이프라인 개방';
      DOM.statusIcon.textContent = '✦';

      // 긴장감을 최고조로 올리는 강력한 기계 흔들림 & 충격음
      DOM.capsuleMachine.classList.add('is-heavy-shake');
      DOM.gaugePressure.textContent = '198.8 kPa';
      SoundFX.playMechanicalThud();

      const winnerCapsule = document.getElementById(`capsule-${winnerIndex}`);
      if (winnerCapsule) {
        winnerCapsule.classList.add('is-extracted');
      }
    }, 3300);

    // -----------------------------------------------------------------------
    // [5단계 & 6단계] 결과 공개 및 파티클 방사 (4.2s ~ 4.6s)
    // -----------------------------------------------------------------------
    setTimeout(() => {
      state.isDrawing = false;
      state.hasDrawn = true;

      // 기계 흔들림 정지 및 코어 안정화
      DOM.capsuleMachine.classList.remove('is-rumbling', 'is-heavy-shake');
      DOM.quantumCore.classList.remove('is-active');
      DOM.gaugePressure.textContent = '101.3 kPa';

      // 상태 배너 숨기고 결과 발표 카드 표시
      DOM.statusBanner.style.display = 'none';
      DOM.winnerName.textContent = winnerName;
      DOM.winnerCapsuleTag.textContent = `SPECIMEN #${String(winnerIndex + 1).padStart(2, '0')}`;
      DOM.fateResultCard.style.display = 'block';

      // 6단계 은은한 파티클 연출
      spawnSubtleParticles();
      SoundFX.playWinnerReveal();

      // [7단계] 다시 추첨 버튼 활성화
      DOM.drawBtnText.textContent = '다시 추첨하기';
      setUIInteractionsEnabled(true);
      updateDrawButtonState();
    }, 4300);
  }

  // 추첨 진행 중 참가자 조작 비활성화/활성화 함수
  function setUIInteractionsEnabled(enabled) {
    DOM.participantInput.disabled = !enabled || (state.participants.length >= state.maxParticipants);
    DOM.addParticipantBtn.disabled = !enabled || (state.participants.length >= state.maxParticipants);
    
    // 삭제 버튼들
    const removeButtons = DOM.participantsList.querySelectorAll('.chip-remove-btn');
    removeButtons.forEach(btn => btn.disabled = !enabled);

    // 프리셋 버튼들
    DOM.presetLunchBtn.disabled = !enabled;
    DOM.presetDutyBtn.disabled = !enabled;
    DOM.presetResetBtn.disabled = !enabled;
  }

  // =========================================================================
  // 파티클 시스템 (시안, 퍼플, 소프트 핑크 스파크 및 자동 리소스 정리)
  // =========================================================================
  function spawnSubtleParticles() {
    const canvas = DOM.particleCanvas;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // 기계 중앙 추출 위치 추정
    const machineRect = DOM.capsulesChamber.getBoundingClientRect();
    const originX = machineRect.left + machineRect.width / 2;
    const originY = machineRect.top + machineRect.height / 2;

    const particles = [];
    const colors = ['#00e5ff', '#9d4edd', '#ff5d8f', '#ffffff'];
    const particleCount = 45; // 요구사항: 과도하지 않은 정갈한 수량

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5.5;
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5, // 위쪽으로 약간 상승
        radius: 1.5 + Math.random() * 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 0.016 + Math.random() * 0.02,
      });
    }

    let animationFrameId;

    function render() {
      ctx.clearRect(0, 0, width, height);

      let activeParticles = 0;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.alpha <= 0) continue;

        activeParticles++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04; // 미세한 중력
        p.vx *= 0.98;
        p.alpha -= p.decay;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (activeParticles > 0) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        // 애니메이션 완료 후 캔버스 정리
        ctx.clearRect(0, 0, width, height);
        cancelAnimationFrame(animationFrameId);
      }
    }

    render();
  }

  // =========================================================================
  // 빠른 테스트 프리셋 데이터
  // =========================================================================
  function loadPreset(names) {
    if (state.isDrawing) return;
    state.participants = [...names];
    DOM.participantInput.value = '';
    clearFeedback();
    SoundFX.playClick();
    renderParticipants();
    renderCapsules();
    updateDrawButtonState();
    resetPreviousResult();
  }

  // =========================================================================
  // 유틸리티 및 이벤트 리스너 등록
  // =========================================================================
  function escapeHtml(string) {
    const div = document.createElement('div');
    div.textContent = string;
    return div.innerHTML;
  }

  function initEventListeners() {
    // 폼 제출 (참가자 추가)
    DOM.participantForm.addEventListener('submit', (e) => {
      e.preventDefault();
      addParticipant(DOM.participantInput.value);
    });

    // 참가자 개별 삭제 (이벤트 위임)
    DOM.participantsList.addEventListener('click', (e) => {
      const btn = e.target.closest('.chip-remove-btn');
      if (btn && !state.isDrawing) {
        const index = parseInt(btn.dataset.index, 10);
        if (!isNaN(index)) {
          removeParticipant(index);
        }
      }
    });

    // 추첨 버튼 클릭
    DOM.drawBtn.addEventListener('click', () => {
      startCapsuleLottery();
    });

    // 사운드 토글
    DOM.soundToggleBtn.addEventListener('click', () => {
      initAudioContext();
      state.soundEnabled = !state.soundEnabled;
      DOM.soundIconOn.style.display = state.soundEnabled ? 'block' : 'none';
      DOM.soundIconOff.style.display = state.soundEnabled ? 'none' : 'block';
      DOM.soundLabel.textContent = state.soundEnabled ? 'AUDIO: ON' : 'AUDIO: OFF';
      DOM.soundToggleBtn.style.borderColor = state.soundEnabled ? 'var(--glass-border)' : 'var(--text-muted)';
      if (state.soundEnabled) {
        SoundFX.playClick();
      }
    });

    // 프리셋 버튼
    DOM.presetLunchBtn.addEventListener('click', () => {
      loadPreset(['김민수', '이서연', '박준혁', '최유진']);
    });

    DOM.presetDutyBtn.addEventListener('click', () => {
      loadPreset(['정재원', '한소희', '윤도현', '강지민', '오승훈', '배수지']);
    });

    DOM.presetResetBtn.addEventListener('click', () => {
      if (state.isDrawing) return;
      loadPreset([]);
    });

    // 창 크기 리사이즈 시 파티클 캔버스 초기화
    window.addEventListener('resize', () => {
      const canvas = DOM.particleCanvas;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    });
  }

  // =========================================================================
  // 초기화 (App Initialization)
  // =========================================================================
  function init() {
    initEventListeners();

    // 사용자가 첫 방문 시 바로 사용해볼 수 있도록 기본 4인 참가자 세팅
    loadPreset(['김민수', '이서연', '박준혁', '최유진']);
  }

  // DOM 로드 완료 시 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
