// ==UserScript==
// @name         NYCU NASA OJ Auto Click Submit Problem
// @namespace    https://tampermonkey.net/
// @version      1.0.1
// @description  Auto click submit-problem button with floating control panel
// @author       Elvis Mao
// @include      /^https:\/\/nasaoj-.*\.it\.cs\.nycu\.edu\.tw\/problems\/.*/
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function () {
	"use strict";

	const STORAGE_KEYS = {
		enabled: "autoSubmit_enabled",
		intervalSec: "autoSubmit_intervalSec",
		panelMinimized: "autoSubmit_panelMinimized"
	};

	const DEFAULT_INTERVAL_SEC = 5;
	const MIN_INTERVAL_SEC = 1;

	let enabled = GM_getValue(STORAGE_KEYS.enabled, false);
	let intervalSec = Number(GM_getValue(STORAGE_KEYS.intervalSec, DEFAULT_INTERVAL_SEC));
	let panelMinimized = GM_getValue(STORAGE_KEYS.panelMinimized, false);
	let timer = null;

	if (!Number.isFinite(intervalSec) || intervalSec < MIN_INTERVAL_SEC) {
		intervalSec = DEFAULT_INTERVAL_SEC;
	}

	function getTargetButton() {
		return document.querySelector('button[data-umami-event="submit-problem"]');
	}

	function clickTargetButton() {
		const btn = getTargetButton();
		if (!btn) {
			updateStatus("找不到按鈕");
			return false;
		}

		if (btn.disabled) {
			updateStatus("按鈕已停用");
			return false;
		}

		btn.click();
		updateStatus(`已點擊 ${new Date().toLocaleTimeString()}`);
		return true;
	}

	function clearRunningTimer() {
		if (timer) {
			clearInterval(timer);
			timer = null;
		}
	}

	function startAutoClick() {
		clearRunningTimer();

		if (!enabled) return;

		timer = setInterval(() => {
			clickTargetButton();
		}, intervalSec * 1000);

		updateStatus(`執行中，每 ${intervalSec} 秒`);
	}

	function saveState() {
		GM_setValue(STORAGE_KEYS.enabled, enabled);
		GM_setValue(STORAGE_KEYS.intervalSec, intervalSec);
		GM_setValue(STORAGE_KEYS.panelMinimized, panelMinimized);
	}

	function toggleEnabled(nextValue) {
		enabled = nextValue;
		saveState();
		syncUI();
		startAutoClick();
	}

	function setIntervalSec(nextValue) {
		const parsed = Number(nextValue);
		if (!Number.isFinite(parsed) || parsed < MIN_INTERVAL_SEC) return;

		intervalSec = parsed;
		saveState();
		syncUI();
		startAutoClick();
	}

	function setMinimized(nextValue) {
		panelMinimized = nextValue;
		saveState();
		syncUI();
	}

	const panel = document.createElement("div");
	panel.id = "tm-auto-submit-panel";

	panel.innerHTML = `
    <div class="tm-card">
      <div class="tm-header">
        <div class="tm-title-wrap">
          <div class="tm-dot"></div>
          <div>
            <div class="tm-title">Auto Submit</div>
            <div class="tm-subtitle">submit-problem button</div>
          </div>
        </div>
        <button class="tm-icon-btn" id="tm-minimize-btn" type="button" title="收合/展開">−</button>
      </div>

      <div class="tm-body" id="tm-body">
        <div class="tm-row">
          <span class="tm-label">狀態</span>
          <button class="tm-switch" id="tm-toggle-btn" type="button" aria-pressed="false">
            <span class="tm-switch-thumb"></span>
          </button>
        </div>

        <div class="tm-row tm-row-stack">
          <label class="tm-label" for="tm-interval-input">間隔秒數</label>
          <div class="tm-input-wrap">
            <input id="tm-interval-input" class="tm-input" type="number" min="1" step="1" />
            <button class="tm-btn" id="tm-apply-btn" type="button">套用</button>
          </div>
        </div>

        <div class="tm-row">
          <button class="tm-btn tm-btn-secondary" id="tm-click-now-btn" type="button">立即點一次</button>
        </div>

        <div class="tm-status" id="tm-status">初始化中...</div>
      </div>
    </div>
  `;

	const style = document.createElement("style");
	style.textContent = `
    #tm-auto-submit-panel {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 2147483647;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: hsl(222.2 84% 4.9%);
    }

    #tm-auto-submit-panel * {
      box-sizing: border-box;
    }

    #tm-auto-submit-panel .tm-card {
      width: 320px;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(12px);
      border: 1px solid hsl(214.3 31.8% 91.4%);
      border-radius: 16px;
      box-shadow:
        0 10px 30px rgba(0, 0, 0, 0.10),
        0 2px 8px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }

    #tm-auto-submit-panel .tm-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 14px 10px;
      border-bottom: 1px solid hsl(214.3 31.8% 91.4%);
    }

    #tm-auto-submit-panel .tm-title-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    #tm-auto-submit-panel .tm-dot {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: hsl(142.1 76.2% 36.3%);
      box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.12);
      flex-shrink: 0;
    }

    #tm-auto-submit-panel .tm-title {
      font-size: 14px;
      font-weight: 600;
      line-height: 1.2;
    }

    #tm-auto-submit-panel .tm-subtitle {
      font-size: 12px;
      color: hsl(215.4 16.3% 46.9%);
      margin-top: 2px;
    }

    #tm-auto-submit-panel .tm-icon-btn {
      border: 1px solid hsl(214.3 31.8% 91.4%);
      background: white;
      color: hsl(222.2 84% 4.9%);
      width: 30px;
      height: 30px;
      border-radius: 10px;
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
      transition: all 0.15s ease;
    }

    #tm-auto-submit-panel .tm-icon-btn:hover {
      background: hsl(210 40% 98%);
    }

    #tm-auto-submit-panel .tm-body {
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    #tm-auto-submit-panel .tm-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    #tm-auto-submit-panel .tm-row-stack {
      flex-direction: column;
      align-items: stretch;
    }

    #tm-auto-submit-panel .tm-label {
      font-size: 13px;
      font-weight: 500;
      color: hsl(222.2 47.4% 11.2%);
    }

    #tm-auto-submit-panel .tm-input-wrap {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    #tm-auto-submit-panel .tm-input {
      flex: 1;
      height: 38px;
      padding: 0 12px;
      border-radius: 10px;
      border: 1px solid hsl(214.3 31.8% 91.4%);
      background: white;
      font-size: 14px;
      outline: none;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    #tm-auto-submit-panel .tm-input:focus {
      border-color: hsl(221.2 83.2% 53.3%);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }

    #tm-auto-submit-panel .tm-btn {
      height: 38px;
      padding: 0 14px;
      border-radius: 10px;
      border: 1px solid hsl(214.3 31.8% 91.4%);
      background: hsl(222.2 47.4% 11.2%);
      color: white;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    #tm-auto-submit-panel .tm-btn:hover {
      opacity: 0.92;
    }

    #tm-auto-submit-panel .tm-btn-secondary {
      width: 100%;
      background: white;
      color: hsl(222.2 47.4% 11.2%);
    }

    #tm-auto-submit-panel .tm-switch {
      width: 50px;
      height: 30px;
      border: none;
      border-radius: 999px;
      background: hsl(214.3 31.8% 91.4%);
      position: relative;
      cursor: pointer;
      transition: background 0.2s ease;
      padding: 0;
    }

    #tm-auto-submit-panel .tm-switch[data-on="true"] {
      background: hsl(142.1 70.6% 45.3%);
    }

    #tm-auto-submit-panel .tm-switch-thumb {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 24px;
      height: 24px;
      border-radius: 999px;
      background: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      transition: transform 0.2s ease;
    }

    #tm-auto-submit-panel .tm-switch[data-on="true"] .tm-switch-thumb {
      transform: translateX(20px);
    }

    #tm-auto-submit-panel .tm-status {
      font-size: 12px;
      color: hsl(215.4 16.3% 46.9%);
      background: hsl(210 40% 98%);
      border: 1px solid hsl(214.3 31.8% 91.4%);
      border-radius: 10px;
      padding: 10px 12px;
      min-height: 38px;
      display: flex;
      align-items: center;
    }

    #tm-auto-submit-panel.tm-minimized .tm-body {
      display: none;
    }

    #tm-auto-submit-panel.tm-minimized .tm-header {
      border-bottom: none;
    }
  `;

	document.head.appendChild(style);
	document.body.appendChild(panel);

	const bodyEl = panel.querySelector("#tm-body");
	const toggleBtn = panel.querySelector("#tm-toggle-btn");
	const intervalInput = panel.querySelector("#tm-interval-input");
	const applyBtn = panel.querySelector("#tm-apply-btn");
	const clickNowBtn = panel.querySelector("#tm-click-now-btn");
	const statusEl = panel.querySelector("#tm-status");
	const minimizeBtn = panel.querySelector("#tm-minimize-btn");
	const dotEl = panel.querySelector(".tm-dot");

	function updateStatus(text) {
		if (statusEl) statusEl.textContent = text;
	}

	function syncUI() {
		intervalInput.value = String(intervalSec);

		toggleBtn.dataset.on = String(enabled);
		toggleBtn.setAttribute("aria-pressed", String(enabled));

		dotEl.style.background = enabled ? "hsl(142.1 76.2% 36.3%)" : "hsl(215.4 16.3% 46.9%)";

		dotEl.style.boxShadow = enabled ? "0 0 0 4px rgba(34, 197, 94, 0.12)" : "0 0 0 4px rgba(100, 116, 139, 0.12)";

		panel.classList.toggle("tm-minimized", panelMinimized);
		minimizeBtn.textContent = panelMinimized ? "+" : "−";

		if (enabled) {
			updateStatus(`執行中，每 ${intervalSec} 秒`);
		} else {
			updateStatus("已停止");
		}
	}

	toggleBtn.addEventListener("click", () => {
		toggleEnabled(!enabled);
	});

	applyBtn.addEventListener("click", () => {
		setIntervalSec(intervalInput.value);
	});

	intervalInput.addEventListener("keydown", event => {
		if (event.key === "Enter") {
			setIntervalSec(intervalInput.value);
		}
	});

	clickNowBtn.addEventListener("click", () => {
		clickTargetButton();
	});

	minimizeBtn.addEventListener("click", () => {
		setMinimized(!panelMinimized);
	});

	syncUI();
	startAutoClick();
})();
