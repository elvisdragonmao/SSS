// ==UserScript==
// @name         NYCU E3 UI Plus
// @name:en      NYCU E3 UI Plus
// @name:zh-CN   NYCU E3 介面優化
// @name:zh-TW   NYCU E3 介面最佳化
// @name:zh      NYCU E3 介面最佳化
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  強化 NYCU E3 全站介面與操作體驗。
// @description:en  Improve NYCU E3 full-site UI/UX.
// @description:zh-CN  强化 NYCU E3 全站介面与操作体验。
// @description:zh-TW  強化 NYCU E3 全站介面與操作體驗。
// @description:zh  強化 NYCU E3 全站介面與操作體驗。
// @author       Elvis Mao
// @match        https://e3p.nycu.edu.tw/*
// @icon         https://emtech.cc/static/icons/apple-touch-icon.png
// @grant        none
// @license      Apache-2.0
// @homepageURL  https://github.com/Edit-Mr/SSS/tree/main
// @supportURL   https://github.com/Edit-Mr/SSS/issues
// @run-at       document-idle
// ==/UserScript==

(function () {
	"use strict";

	if (location.pathname === "/my/") {
		const container = document.querySelector(".card-body.p-3");
		if (!container) return;

		const links = [...document.querySelectorAll("a.course-link")];

		const semesters = {};
		const seen = new Set();

		for (const link of links) {
			const href = link.href.trim();

			// 移除完全相同連結
			if (seen.has(href)) continue;
			seen.add(href);

			let text = link.textContent.replace(/\s+/g, " ").trim();

			const match = text.match(/【([^】]+)】(.+)/);
			if (!match) continue;

			const semester = match[1];
			let name = match[2];

			// 移除課號
			name = name.replace(/^\d+\s*/, "");

			// 移除英文名稱
			name = name.replace(/[A-Za-z].*$/, "").trim();

			if (!semesters[semester]) semesters[semester] = [];

			semesters[semester].push({
				name,
				href
			});
		}

		const style = `
<style>
.em-course{
    color:#4c566a;
    display:flex;
    gap:16px 16px;
    flex-wrap:wrap;
    margin-block: 12px 32px;
}
.em-course a{
    display:block;
    padding:8px 16px;
    background:#eceff4;
    border-radius:12px;
    text-decoration:none;
    color:#4c566a;
}

.em-course a:hover{
    background:#e5e9f0;
}

.em-course a:focus, .em-course a:active{
    box-shadow: none;
    background: #d2e8fb;
}

.card-body.p-3 {
    padding: 3rem!important;
}
</style>
`;

		let html = `<div class="card-body p-6">${style}`;

		for (const sem of Object.keys(semesters)) {
			html += `<h3>${sem}</h3><div class="em-course">`;

			for (const course of semesters[sem]) {
				html += `<a href="${course.href}">${course.name}</a>`;
			}

			html += `</div>`;
		}

		html += `</div>`;

		container.outerHTML = html;
	}
})();
