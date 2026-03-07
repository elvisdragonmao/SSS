// ==UserScript==
// @name         NYCU E3 UI Plus
// @name:en      NYCU E3 UI Plus
// @name:zh-CN   NYCU E3 介面優化
// @name:zh-TW   NYCU E3 介面最佳化
// @name:zh      NYCU E3 介面最佳化
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  強化 NYCU E3 全站介面與操作體驗。
// @description:en  Improve NYCU E3 full-site UI/UX.
// @description:zh-CN  强化 NYCU E3 全站介面与操作体验。
// @description:zh-TW  強化 NYCU E3 全站介面與操作體驗。
// @description:zh  強化 NYCU E3 全站介面與操作體驗。
// @author       Elvis Mao
// @match        https://e3p.nycu.edu.tw/*
// @icon         https://emtech.cc/static/icons/apple-touch-icon.png
// @license      Apache-2.0
// @homepageURL  https://github.com/Edit-Mr/SSS/tree/main
// @supportURL   https://github.com/Edit-Mr/SSS/issues
// @run-at       document-start
// @grant        GM_addStyle
// ==/UserScript==

(() => {
	"use strict";

	// 不再需要手動設定學期，自動偵測第一個出現的學期

	const CSS_VARS = `
    :root {
      --dawn-base: #faf4ed;
      --dawn-surface: #fffaf3;
      --dawn-overlay: #f2e9e1;
      --dawn-muted: #9893a5;
      --dawn-subtle: #797593;
      --dawn-text: #575279;
      --dawn-love: #b4637a;
      --dawn-gold: #ea9d34;
      --dawn-rose: #d7827e;
      --dawn-pine: #286983;
      --dawn-foam: #56949f;
      --dawn-iris: #907aa9;
      --dawn-highlight-low: #f4ede8;
      --dawn-highlight-med: #dfdad9;
      --dawn-highlight-high: #cecacd;
    }
  `;

	const path = location.pathname.replace(/\/+$/, "") || "/";
	const isDashboard = location.origin === "https://e3p.nycu.edu.tw" && (path === "/my" || path === "/my/index.php");

	if (isDashboard) {
		stripAllStylesheetsEarly();
		document.addEventListener("DOMContentLoaded", initDashboard, { once: true });
	} else {
		document.addEventListener("DOMContentLoaded", initSoftTheme, { once: true });
	}

	function stripAllStylesheetsEarly() {
		const removeNode = node => {
			if (!node) return;
			if (node.tagName === "LINK" && /stylesheet/i.test(node.rel || "")) {
				node.remove();
			}
		};

		document.querySelectorAll('link[rel*="stylesheet" i]').forEach(removeNode);

		const observer = new MutationObserver(mutations => {
			for (const mutation of mutations) {
				for (const node of mutation.addedNodes) {
					if (!(node instanceof Element)) continue;
					if (node.matches?.('link[rel*="stylesheet" i]')) {
						node.remove();
						continue;
					}
					node.querySelectorAll?.('link[rel*="stylesheet" i]').forEach(el => el.remove());
				}
			}
		});

		observer.observe(document.documentElement, { childList: true, subtree: true });

		window.addEventListener(
			"load",
			() => {
				document.querySelectorAll('link[rel*="stylesheet" i]').forEach(el => el.remove());
				setTimeout(() => observer.disconnect(), 3000);
			},
			{ once: true }
		);
	}

	function initDashboard() {
		injectDashboardCSS();

		// 在清空 body 前先把有 JS 事件的原始節點取出來
		const notifNode = document.querySelector("#nav-notification-popover-container");
		const langNodes = [...document.querySelectorAll("#usernavigation .popover-region.collapsed")].filter(el => {
			const a = el.querySelector("a.nav-link");
			return a && /^\s*(EN|TW)\s*$/.test(a.textContent);
		});
		const usermenuNode = document.querySelector('[data-region="usermenu"]');

		const data = extractDashboardData();
		const app = buildDashboardApp(data, { notifNode, langNodes, usermenuNode });

		document.body.innerHTML = "";
		document.body.appendChild(app);
	}

	function initSoftTheme() {
		GM_addStyle(`
      ${CSS_VARS}

      * {
        animation: none !important; /* 做不好就別做 */
      }

      html, body {
        background: var(--dawn-base) !important;
        color: var(--dawn-text) !important;
      }

      body, input, textarea, select, button {
        color: var(--dawn-text) !important;
      }

      a {
        color: var(--dawn-pine) !important;
      }

      a:hover {
        color: var(--dawn-foam) !important;
      }

      .navbar,
      .navbar.fixed-top,
      .secondary-navigation,
      .drawer,
      .card,
      .dropdown-menu,
      .popover-region-container,
      .modal-content,
      .list-group-item,
      .activity-item,
      .forumpost,
      .section,
      .block,
      .bg-white {
        background: var(--dawn-surface) !important;
        color: var(--dawn-text) !important;
        border-color: var(--dawn-highlight-med) !important;
      }

      .btn,
      .btn-secondary,
      .btn-light,
      .btn-outline-secondary,
      .page-link,
      .form-control,
      .custom-select,
      select,
      input,
      textarea {
        background: var(--dawn-overlay) !important;
        color: var(--dawn-text) !important;
        border-color: var(--dawn-highlight-high) !important;
        box-shadow: none !important;
      }

      .btn-primary,
      .btn-success,
      .badge-primary {
        background: var(--dawn-iris) !important;
        border-color: var(--dawn-iris) !important;
        color: var(--dawn-surface) !important;
      }

      .text-muted,
      .text-secondary,
      .text-body-secondary,
      small,
      .dimmed_text {
        color: var(--dawn-subtle) !important;
      }

      .border,
      .border-top,
      .border-bottom,
      .border-left,
      .border-right,
      hr {
        border-color: var(--dawn-highlight-med) !important;
      }

      .dropdown-item:hover,
      .list-group-item:hover,
      .page-link:hover,
      tr:hover td {
        background: var(--dawn-highlight-low) !important;
      }

      .usermenu .dropdown-toggle,
      .popover-region-toggle,
      .nav-link,
      .navbar-brand {
        color: var(--dawn-text) !important;
      }

      .count-container,
      .badge,
      .notification.badge {
        background: var(--dawn-love) !important;
        color: var(--dawn-surface) !important;
      }

      .card,
      .block,
      .section,
      .forumpost,
      .dropdown-menu,
      .popover-region-container,
      .modal-content {
        border-radius: 18px !important;
      }

			#page.drawers #topofscroll, .course-content, #region-main{
				background-color: transparent;
			}

      #theme_boost-drawers-courseindex {
        background: transparent !important;
      }

			#page.drawers div[role="main"] {
				padding: 0 !important;
			}

      .drawercontent{
        padding: 0 1rem;
      }

      @media (min-width: 992px) {
        #page-wrapper #page {
          margin-left:0;
        }

        #page{
          max-width: 1200px;
          width: 100%;
        }

        #page-wrapper{
          align-items: center;
        }
      }

      /* ── 重新樣式化 navbar ── */
      .navbar.fixed-top {
        height: 72px !important;
        backdrop-filter: blur(14px) !important;
        border-bottom: 1px solid var(--dawn-highlight-med) !important;
        background: color-mix(in srgb, var(--dawn-base) 88%, white 12%) !important;
        padding: 0 24px !important;
      }

      .navbar.fixed-top .navbar-brand img.logo {
        height: 42px !important;
        width: auto !important;
      }

      /* avatar 放大 */
      #user-menu-toggle .userpicture {
        width: 36px !important;
        height: 36px !important;
        border-radius: 999px !important;
        object-fit: cover !important;
      }

      /* 通知鈴鐺顏色 */
      .popover-region-toggle .fa-bell {
        color: var(--dawn-text) !important;
      }
    `);

		patchNavbar();
	}

	function patchNavbar() {
		const navbar = document.querySelector("nav.navbar.fixed-top");
		if (!navbar) return;

		// 移除空的 primary-navigation 和 page_heading_menu
		navbar.querySelector(".primary-navigation")?.remove();
		navbar.querySelector("ul.navbar-nav.d-none.d-md-flex")?.remove();
		navbar.querySelector(".navbar-toggler")?.remove();

		// 升級 Gravatar 解析度（頭像 img）
		const avatarImg = navbar.querySelector("#user-menu-toggle img.userpicture");
		if (avatarImg?.src) {
			avatarImg.src = avatarImg.src.replace(/^https?:\/\/[^/]*gravatar\.com\/avatar\/([^?]+).*$/, (_, hash) => `https://secure.gravatar.com/avatar/${hash}?s=200&d=mm`);
			avatarImg.removeAttribute("width");
			avatarImg.removeAttribute("height");
		}
	}

	function injectDashboardCSS() {
		GM_addStyle(`
      ${CSS_VARS}

      * {
        box-sizing: border-box;
      }

      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: var(--dawn-base) !important;
        color: var(--dawn-text) !important;
        font-family:
          "Inter",
          "SF Pro TC",
          "PingFang TC",
          "Noto Sans TC",
          "Segoe UI",
          sans-serif !important;
      }

      a {
        color: inherit;
        text-decoration: none;
      }

      .e3rp-app {
        min-height: 100vh;
        background: var(--dawn-base);
      }

      .e3rp-topbar {
        position: sticky;
        top: 0;
        z-index: 50;
        height: 94px;
        background: color-mix(in srgb, var(--dawn-base) 88%, white 12%);
        border-bottom: 1px solid var(--dawn-highlight-med);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 28px;
        backdrop-filter: blur(14px);
      }

      .e3rp-brand {
        display: flex;
        align-items: center;
        gap: 16px;
        min-width: 0;
      }

      .e3rp-brand img {
        width: 58px;
        height: 58px;
        object-fit: contain;
        border-radius: 14px;
      }

      .e3rp-brand-text {
        font-size: 20px;
        font-weight: 800;
        letter-spacing: 0.02em;
        color: var(--dawn-text);
      }

      .e3rp-topbar-right {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      /* ── 移植 Moodle 節點在 dashboard topbar 的樣式 ── */

      /* 通知鈴鐺 */
      .e3rp-topbar-right .popover-region-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 999px;
        background: var(--dawn-surface);
        border: 1px solid var(--dawn-highlight-med);
        color: var(--dawn-text) !important;
        cursor: pointer;
      }

      .e3rp-topbar-right .count-container {
        position: absolute;
        top: -5px;
        right: -4px;
        min-width: 18px;
        height: 18px;
        padding: 0 5px;
        border-radius: 999px;
        background: var(--dawn-love) !important;
        color: var(--dawn-surface) !important;
        font-size: 11px;
        font-weight: 800;
        display: grid;
        place-items: center;
      }

      /* 語言切換 */
      .e3rp-topbar-right .popover-region.collapsed > a.nav-link {
        font-weight: 700;
        color: var(--dawn-text) !important;
        opacity: 0.9;
        padding: 4px 6px;
        text-decoration: none;
      }

      .e3rp-topbar-right .popover-region.collapsed > a.semi-transparent {
        opacity: 0.45;
      }

      /* usermenu 頭像按鈕 */
      .e3rp-topbar-right .usermenu-container {
        display: flex;
        align-items: center;
      }

      .e3rp-topbar-right #user-menu-toggle {
        padding: 0 !important;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
      }

      .e3rp-topbar-right #user-menu-toggle .userpicture {
        width: 40px !important;
        height: 40px !important;
        border-radius: 999px !important;
        object-fit: cover !important;
        border: 1.5px solid var(--dawn-highlight-high);
        display: block;
      }

      /* dropdown 選單 */
      .e3rp-topbar-right .dropdown-menu {
        background: var(--dawn-surface) !important;
        border: 1px solid var(--dawn-highlight-med) !important;
        border-radius: 14px !important;
        padding: 8px !important;
        min-width: 160px;
      }

      .e3rp-topbar-right .dropdown-item {
        color: var(--dawn-text) !important;
        border-radius: 8px !important;
        padding: 8px 12px !important;
      }

      .e3rp-topbar-right .dropdown-item:hover {
        background: var(--dawn-highlight-low) !important;
      }

      .e3rp-topbar-right .dropdown-divider {
        border-color: var(--dawn-highlight-med) !important;
        margin: 4px 0 !important;
      }

      .e3rp-main {
        width: min(1220px, calc(100vw - 48px));
        margin: 34px auto 56px;
        display: grid;
        grid-template-columns: 1.2fr 1fr;
        gap: 34px;
      }

      .e3rp-col {
        display: flex;
        flex-direction: column;
        gap: 42px;
        min-width: 0;
      }

      .e3rp-section {
        min-width: 0;
      }

      .e3rp-section-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 18px;
      }

      .e3rp-section-title {
        margin: 0;
        font-size: 22px;
        line-height: 1.2;
        font-weight: 900;
        letter-spacing: 0.01em;
        color: var(--dawn-text);
      }

      .e3rp-pill {
        padding: 8px 14px;
        border-radius: 999px;
        background: var(--dawn-overlay);
        color: var(--dawn-subtle);
        font-size: 14px;
        font-weight: 700;
      }

      .e3rp-term-dropdown {
        position: relative;
      }

      .e3rp-pill-btn {
        cursor: pointer;
        border: none;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: background 0.15s ease;
      }

      .e3rp-pill-btn:hover {
        background: var(--dawn-highlight-med);
      }

      .e3rp-pill-caret {
        font-size: 11px;
        opacity: 0.7;
      }

      .e3rp-term-menu {
        display: none;
        position: absolute;
        top: calc(100% + 6px);
        right: 0;
        background: var(--dawn-surface);
        border: 1px solid var(--dawn-highlight-med);
        border-radius: 14px;
        padding: 6px;
        margin: 0;
        list-style: none;
        min-width: 110px;
        z-index: 100;
        box-shadow: 0 4px 16px rgba(0,0,0,0.08);
      }

      .e3rp-term-menu.open {
        display: block;
      }

      .e3rp-term-option {
        padding: 8px 12px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 700;
        color: var(--dawn-subtle);
        white-space: nowrap;
      }

      .e3rp-term-option:hover {
        background: var(--dawn-highlight-low);
        color: var(--dawn-text);
      }

      .e3rp-term-option.active {
        background: var(--dawn-highlight-low);
        color: var(--dawn-text);
      }

      .e3rp-card {
        background: var(--dawn-surface);
        border: 1px solid var(--dawn-highlight-med);
        border-radius: 24px;
      }

      .e3rp-course-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .e3rp-course-chip {
        display: block;
        padding: 14px 16px;
        border-radius: 14px;
        background: var(--dawn-overlay);
        color: var(--dawn-text);
        font-weight: 800;
        line-height: 1.25;
        border: 1px solid transparent;
        transition: transform 0.15s ease, border-color 0.15s ease, background 0.15s ease;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .e3rp-course-chip:hover {
        transform: translateY(-1px);
        border-color: var(--dawn-highlight-high);
        background: var(--dawn-highlight-low);
      }

      .e3rp-announcements {
        padding: 24px;
				max-height: 400px;
				overflow-y: auto;
      }

      .e3rp-announcement {
        padding: 14px 16px;
        border-radius: 16px;
        background: rgba(255,255,255,0.28);
        border: 1px solid transparent;
      }

      .e3rp-announcement + .e3rp-announcement {
        margin-top: 12px;
      }

      .e3rp-announcement-meta {
        color: var(--dawn-subtle);
        font-size: 13px;
        margin-bottom: 4px;
      }

      .e3rp-announcement-course {
        font-weight: 800;
        color: var(--dawn-text);
      }

      .e3rp-announcement-title {
        font-size: 15px;
        font-weight: 900;
        color: var(--dawn-text);
        margin-bottom: 4px;
      }

      .e3rp-announcement-desc {
        font-size: 14px;
        line-height: 1.45;
        color: var(--dawn-subtle);
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
      }

      .e3rp-profile-card {
        padding: 26px 30px;
        display: grid;
        grid-template-columns: 90px 1fr;
        gap: 22px;
        align-items: center;
      }

      .e3rp-profile-pic {
        width: 72px;
        height: 72px;
        border-radius: 999px;
        overflow: hidden;
        background: var(--dawn-highlight-med);
        border: 1px solid var(--dawn-highlight-high);
      }

      .e3rp-profile-pic img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .e3rp-profile-name {
        font-size: 22px;
        font-weight: 900;
        margin-bottom: 8px;
      }

      .e3rp-profile-line {
        font-size: 15px;
        line-height: 1.55;
        color: var(--dawn-subtle);
      }

      .e3rp-profile-line b {
        color: var(--dawn-text);
      }

      .e3rp-events {
        padding: 18px;
      }

      .e3rp-event {
        display: flex;
        gap: 14px;
        padding: 14px 16px;
        border-radius: 16px;
        background: rgba(255,255,255,0.28);
      }

      .e3rp-event + .e3rp-event {
        margin-top: 12px;
      }

      .e3rp-event-icon {
        width: 34px;
        height: 34px;
        border-radius: 12px;
        background: color-mix(in srgb, var(--dawn-iris) 18%, white 82%);
        color: var(--dawn-iris);
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        font-size: 18px;
      }

      .e3rp-event-title {
        font-size: 16px;
        font-weight: 900;
        color: var(--dawn-text);
        margin-bottom: 4px;
      }

      .e3rp-event-time {
        font-size: 14px;
        color: var(--dawn-subtle);
      }

      .e3rp-empty {
        padding: 18px;
        border-radius: 16px;
        background: var(--dawn-overlay);
        color: var(--dawn-subtle);
        font-weight: 700;
      }

      @media (max-width: 980px) {
        .e3rp-main {
          grid-template-columns: 1fr;
        }

        .e3rp-course-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 640px) {
        .e3rp-topbar {
          padding: 0 16px;
          height: 78px;
        }

        .e3rp-brand img {
          width: 42px;
          height: 42px;
        }

        .e3rp-brand-text {
          font-size: 18px;
        }

        .e3rp-main {
          width: min(100vw - 20px, 1220px);
          margin-top: 22px;
          gap: 22px;
        }

        .e3rp-section-title {
          font-size: 20px;
        }

        .e3rp-profile-card {
          grid-template-columns: 1fr;
        }
      }
    `);
	}

	function extractDashboardData() {
		const siteLogo = document.querySelector(".navbar-brand img")?.src || document.querySelector(".drawerheader a img")?.src || "";

		const avatarRaw = document.querySelector("#user-menu-toggle img")?.src || document.querySelector(".myprofileitem.picture img")?.src || "";
		// Gravatar 預設 s=35 畫質很差，換成 200
		const avatar = avatarRaw.replace(/^https?:\/\/[^/]*gravatar\.com\/avatar\/([^?]+).*$/, (_, hash) => `https://secure.gravatar.com/avatar/${hash}?s=200&d=mm`);

		const notificationCount = cleanText(document.querySelector("#nav-notification-popover-container .count-container")?.textContent) || "";

		const lang = cleanText([...document.querySelectorAll("#usernavigation a.nav-link")].map(el => el.textContent).find(t => /\bTW\b/i.test(t))) || "TW";

		const profileName = cleanText(document.querySelector("#inst82730 .myprofileitem.fullname")?.textContent) || "已登入使用者";

		const country = cleanText(document.querySelector("#inst82730 .myprofileitem.country")?.textContent).replace(/^國家:\s*/, "");

		const englishName = cleanText(document.querySelectorAll("#inst82730 .myprofileitem.city")[0]?.textContent).replace(/^英文姓名:\s*/, "");

		const email = cleanText(document.querySelectorAll("#inst82730 .myprofileitem.city")[1]?.textContent).replace(/^電子郵件信箱:\s*/, "");

		const courses = parseCourses();
		const announcements = parseAnnouncements();
		const events = parseEvents();

		// Collect unique terms in DOM order (newest first); courses without a term go under "其他"
		const allTerms = [...new Set(courses.map(c => c.term).filter(Boolean))];
		if (courses.some(c => !c.term)) allTerms.push("其他");
		const currentTerm = allTerms[0] || "";

		return {
			siteLogo,
			avatar,
			notificationCount,
			lang,
			profileName,
			country,
			englishName,
			email,
			currentTerm,
			allTerms,
			courses,
			announcements,
			events
		};
	}

	function parseCourses() {
		const nodes = [...document.querySelectorAll("#layer2_right_current_course_stu a.course-link")];
		const seen = new Set();
		const items = [];

		for (const a of nodes) {
			const href = normalizeHref(a.getAttribute("href"));
			const raw = cleanText(a.textContent);
			if (!href || !raw || seen.has(href)) continue;
			seen.add(href);

			const termMatch = raw.match(/【([^】]+)】/);
			const term = termMatch ? termMatch[1] : "";

			let title = raw
				.replace(/^\s*【[^】]+】\s*/, "")
				.replace(/^\d+\s*/, "")
				.replace(/\s+[A-Za-z][\s\S]*$/, "")
				.trim();

			if (!title) title = raw;

			items.push({ title, href, term });
		}

		return items;
	}

	function parseAnnouncements() {
		const posts = [...document.querySelectorAll("#inst20 .post")];
		return posts.map(post => {
			const dateLine = cleanText(post.querySelector(".date")?.textContent);
			const courseRaw = cleanText(post.querySelector(".date b")?.textContent);
			const title = cleanText(post.querySelector(".name")?.textContent);
			const info = cleanText(post.querySelector(".info")?.textContent);
			const link = normalizeHref(post.querySelector(".info a")?.getAttribute("href"));

			const time = dateLine.replace(courseRaw, "").trim();

			// 格式：1142.515501.離散數學 Discrete Mathematics → 離散數學
			// 先去掉「學期代碼.課號.」前綴，再去掉英文名稱
			const course = courseRaw
				.replace(/^\d+\.\d+\./, "") // 去掉 "1142.515501."
				.replace(/\s+[A-Za-z][\s\S]*$/, "") // 去掉英文名稱
				.trim() || courseRaw;

			return {
				course,
				time,
				title,
				info,
				href: link || "#"
			};
		});
	}

	function parseEvents() {
		const items = [...document.querySelectorAll('#inst11984 [data-region="event-item"]')];
		return items.slice(0, 4).map(item => {
			const title = cleanText(item.querySelector("h6 a")?.textContent);
			const href = normalizeHref(item.querySelector("h6 a")?.getAttribute("href"));
			const time = cleanText(item.querySelector(".date")?.textContent);
			return { title, href, time };
		});
	}

	function buildDashboardApp(data, nodes = {}) {
		const app = document.createElement("div");
		app.className = "e3rp-app";

		app.innerHTML = `
      <header class="e3rp-topbar">
        <div class="e3rp-brand">
          ${data.siteLogo ? `<a href="/my/"><img src="${escapeAttr(data.siteLogo)}" alt="E3@NYCU"></a>` : ""}
          <div class="e3rp-brand-text">E3@NYCU</div>
        </div>
        <div class="e3rp-topbar-right" id="e3rp-topbar-right"></div>
      </header>

      <main class="e3rp-main">
        <div class="e3rp-col">
          <section class="e3rp-section">
            <div class="e3rp-section-head">
              <h2 class="e3rp-section-title">課程列表</h2>
              ${
								data.allTerms.length > 1
									? `<div class="e3rp-term-dropdown" id="e3rp-term-dropdown">
                      <button class="e3rp-pill e3rp-pill-btn" id="e3rp-term-btn" aria-haspopup="true" aria-expanded="false">
                        ${escapeHTML(data.currentTerm)} <span class="e3rp-pill-caret">▾</span>
                      </button>
                      <ul class="e3rp-term-menu" id="e3rp-term-menu" role="listbox">
                        ${data.allTerms
													.map(t => {
														const val = t === "其他" ? "" : t;
														return `<li class="e3rp-term-option${t === data.currentTerm ? " active" : ""}" role="option" data-term="${escapeAttr(val)}">${escapeHTML(t)}</li>`;
													})
													.join("")}
                      </ul>
                    </div>`
									: data.currentTerm
									? `<div class="e3rp-pill">${escapeHTML(data.currentTerm)}</div>`
									: ""
							}
            </div>
            ${
							data.courses.length
								? `<div class="e3rp-course-grid" id="e3rp-course-grid">
                    ${data.courses
											.map(
												course => `
                          <a class="e3rp-course-chip" href="${escapeAttr(course.href)}" data-term="${escapeAttr(course.term)}"${course.term !== data.currentTerm ? ' style="display:none"' : ""}>
                            ${escapeHTML(course.title)}
                          </a>
                        `
											)
											.join("")}
                  </div>`
								: `<div class="e3rp-empty">沒有抓到課程資料</div>`
						}
          </section>

          <section class="e3rp-section">
            <div class="e3rp-section-head">
              <h2 class="e3rp-section-title">已登入使用者</h2>
            </div>
            <div class="e3rp-card e3rp-profile-card">
              <div class="e3rp-profile-pic">
                ${data.avatar ? `<img src="${escapeAttr(data.avatar)}" alt="profile">` : ""}
              </div>
              <div>
                <div class="e3rp-profile-name">已登入使用者</div>
                ${data.country ? `<div class="e3rp-profile-line"><b>國家:</b> ${escapeHTML(data.country)}</div>` : ""}
                ${data.englishName ? `<div class="e3rp-profile-line"><b>英文姓名:</b> ${escapeHTML(data.englishName)}</div>` : ""}
                ${data.email ? `<div class="e3rp-profile-line"><b>電子郵件信箱:</b> ${escapeHTML(data.email)}</div>` : ""}
              </div>
            </div>
          </section>
        </div>

        <div class="e3rp-col">
          <section class="e3rp-section">
            <div class="e3rp-section-head">
              <h2 class="e3rp-section-title">課程公告</h2>
            </div>
            <div class="e3rp-card e3rp-announcements">
              ${
								data.announcements.length
									? data.announcements
											.map(
												item => `
                          <a class="e3rp-announcement" href="${escapeAttr(item.href)}">
                            <div class="e3rp-announcement-meta">
                              <span class="e3rp-announcement-course">${escapeHTML(item.course)}</span>
                              ${item.time ? ` / ${escapeHTML(item.time)}` : ""}
                            </div>
                            <div class="e3rp-announcement-title">${escapeHTML(item.title)}</div>
                            <div class="e3rp-announcement-desc">${escapeHTML(item.info)}</div>
                          </a>
                        `
											)
											.join("")
									: `<div class="e3rp-empty">沒有抓到公告資料</div>`
							}
            </div>
          </section>

          <section class="e3rp-section">
            <div class="e3rp-section-head">
              <h2 class="e3rp-section-title">未來事件</h2>
            </div>
            <div class="e3rp-card e3rp-events">
              ${
								data.events.length
									? data.events
											.map(
												event => `
                          <a class="e3rp-event" href="${escapeAttr(event.href)}">
                            <div class="e3rp-event-icon">🎓</div>
                            <div>
                              <div class="e3rp-event-title">${escapeHTML(event.title)}</div>
                              <div class="e3rp-event-time">${escapeHTML(event.time)}</div>
                            </div>
                          </a>
                        `
											)
											.join("")
									: `<div class="e3rp-empty">沒有抓到未來事件</div>`
							}
            </div>
          </section>
        </div>
      </main>
    `;

		// 把原始有 JS 事件的節點搬進 topbar-right
		const topbarRight = app.querySelector("#e3rp-topbar-right");
		if (topbarRight) {
			if (nodes.notifNode) topbarRight.appendChild(nodes.notifNode);
			for (const lang of (nodes.langNodes || [])) topbarRight.appendChild(lang);
			if (nodes.usermenuNode) {
				// 升級 avatar 圖片畫質
				const avatarImg = nodes.usermenuNode.querySelector("#user-menu-toggle img.userpicture");
				if (avatarImg?.src) {
					avatarImg.src = avatarImg.src.replace(
						/^https?:\/\/[^/]*gravatar\.com\/avatar\/([^?]+).*$/,
						(_, hash) => `https://secure.gravatar.com/avatar/${hash}?s=200&d=mm`
					);
					avatarImg.removeAttribute("width");
					avatarImg.removeAttribute("height");
				}
				topbarRight.appendChild(nodes.usermenuNode);
			}
		}

		// Term dropdown interaction
		const termBtn = app.querySelector("#e3rp-term-btn");
		const termMenu = app.querySelector("#e3rp-term-menu");
		const courseGrid = app.querySelector("#e3rp-course-grid");
		if (termBtn && termMenu && courseGrid) {
			let activeTerm = data.currentTerm;

			const applyTerm = term => {
				activeTerm = term;

				// Update pill label
				const label = term === "" ? "其他" : term;
				termBtn.childNodes[0].textContent = label + " ";

				// Show/hide chips
				courseGrid.querySelectorAll(".e3rp-course-chip").forEach(chip => {
					const t = chip.dataset.term;
					chip.style.display = (t === term) ? "" : "none";
				});

				// Update active state in menu
				termMenu.querySelectorAll(".e3rp-term-option").forEach(opt => {
					opt.classList.toggle("active", opt.dataset.term === term);
				});
			};

			termBtn.addEventListener("click", e => {
				e.stopPropagation();
				const open = termMenu.classList.toggle("open");
				termBtn.setAttribute("aria-expanded", String(open));
			});

			termMenu.addEventListener("click", e => {
				const option = e.target.closest(".e3rp-term-option");
				if (!option) return;
				applyTerm(option.dataset.term);
				termMenu.classList.remove("open");
				termBtn.setAttribute("aria-expanded", "false");
			});

			// Close on outside click
			document.addEventListener("click", () => {
				termMenu.classList.remove("open");
				termBtn.setAttribute("aria-expanded", "false");
			});
		}

		return app;
	}

	function normalizeHref(href) {
		if (!href) return "";
		try {
			return new URL(href, location.origin).href;
		} catch {
			return href;
		}
	}

	function cleanText(value) {
		return (value || "")
			.replace(/\u00a0/g, " ")
			.replace(/\s+/g, " ")
			.trim();
	}

	function escapeHTML(str) {
		return String(str).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
	}

	function escapeAttr(str) {
		return escapeHTML(str);
	}
})();
