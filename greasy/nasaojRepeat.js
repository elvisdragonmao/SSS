// ==UserScript==
// @name         NYCU NASA OJ Auto Click Submit Problem
// @namespace    https://tampermonkey.net/
// @version      1.1.1
// @description  Auto click submit-problem button with floating control panel and success notification
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

	let enabled = GM_getValue(STORAGE_KEYS.enabled, false);
	let intervalSec = Number(GM_getValue(STORAGE_KEYS.intervalSec, DEFAULT_INTERVAL_SEC));
	let panelMinimized = GM_getValue(STORAGE_KEYS.panelMinimized, false);
	let timer = null;

	// 避免同一輪成功一直通知
	let successNotified = false;

	// 記錄已處理過的 toast，避免 MutationObserver 重複掃到同一個
	const seenToasts = new WeakSet();

	if (!Number.isFinite(intervalSec)) {
		intervalSec = DEFAULT_INTERVAL_SEC;
	}

	function getTargetButton() {
		return document.querySelector('button[data-umami-event="submit-problem"]');
	}

	function updateStatus(text) {
		if (statusEl) statusEl.textContent = text;
	}

	async function requestNotificationPermissionIfNeeded() {
		if (!("Notification" in window)) return false;

		if (Notification.permission === "granted") return true;
		if (Notification.permission === "denied") return false;

		try {
			const permission = await Notification.requestPermission();
			return permission === "granted";
		} catch {
			return false;
		}
	}

	function sendBrowserNotification(title, body) {
		if (!("Notification" in window)) return;
		if (Notification.permission !== "granted") return;

		try {
			const notification = new Notification(title, {
				body,
				tag: "nasaoj-submit-success"
			});

			notification.onclick = () => {
				window.focus();
			};
		} catch (err) {
			console.error("[Auto Submit] Failed to send notification:", err);
		}
	}

	function normalizeText(text) {
		return String(text || "")
			.replace(/\s+/g, " ")
			.trim();
	}

	function isBusyMessage(text) {
		const normalized = normalizeText(text);
		return normalized.includes("Please either wait for the current submission to finish") || normalized.includes("Submission in cooldown, please try again after");
	}

	function isSuccessMessage(text, toastEl) {
		const normalized = normalizeText(text).toLowerCase();
		const toastType = toastEl?.getAttribute("data-type")?.toLowerCase();

		return toastType === "success" && normalized.startsWith("problem ") && normalized.endsWith(" submitted");
	}

	async function handleToastElement(toastEl) {
		if (!toastEl || seenToasts.has(toastEl)) return;
		seenToasts.add(toastEl);

		const titleEl = toastEl.querySelector("[data-title]");
		const contentEl = toastEl.querySelector("[data-content]");
		const text = normalizeText(titleEl?.textContent || contentEl?.textContent || toastEl.textContent || "");

		if (!text) return;

		console.log("[Auto Submit] Toast detected:", text);

		if (isBusyMessage(text)) {
			successNotified = false;
			updateStatus(`等待中：${text}`);
			return;
		}

		if (isSuccessMessage(text, toastEl)) {
			if (!successNotified) {
				successNotified = true;
				updateStatus(`送出成功：${text}`);
				sendBrowserNotification("NASA OJ Submit Success", text);
			} else {
				updateStatus(`成功但已通知過：${text}`);
			}
			return;
		}

		updateStatus(`訊息：${text}`);
	}

	function observeToasts() {
		const root = document.body || document.documentElement;
		if (!root) return;

		const observer = new MutationObserver(mutations => {
			for (const mutation of mutations) {
				for (const node of mutation.addedNodes) {
					if (!(node instanceof HTMLElement)) continue;

					if (node.matches?.("[data-sonner-toast]")) {
						handleToastElement(node);
					}

					const nestedToasts = node.querySelectorAll?.("[data-sonner-toast]");
					if (nestedToasts?.length) {
						for (const toastEl of nestedToasts) {
							handleToastElement(toastEl);
						}
					}
				}
			}
		});

		observer.observe(root, {
			childList: true,
			subtree: true
		});

		// 頁面上已存在的 toaster 也先掃一次
		document.querySelectorAll("[data-sonner-toast]").forEach(handleToastElement);
	}

	async function clickTargetButton() {
		const btn = getTargetButton();
		if (!btn) {
			updateStatus("找不到按鈕");
			return false;
		}

		if (btn.disabled) {
			updateStatus("按鈕已停用");
			return false;
		}

		await requestNotificationPermissionIfNeeded();

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
		if (!Number.isFinite(parsed)) return;

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
            <div class="tm-subtitle">By <a href="https://github.com/elvisdragonmao/SSS" target="_blank">Elvis Mao</a></div>
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
      gap: 16px;
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

	toggleBtn.addEventListener("click", async () => {
		if (!enabled) {
			await requestNotificationPermissionIfNeeded();
		}
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

	clickNowBtn.addEventListener("click", async () => {
		await clickTargetButton();
	});

	minimizeBtn.addEventListener("click", () => {
		setMinimized(!panelMinimized);
	});

	observeToasts();
	syncUI();
	startAutoClick();
})();
