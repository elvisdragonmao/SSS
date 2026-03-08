// ==UserScript==
// @name         國光客運自動訂票
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Kingbus autofill
// @author       Elvis Mao
// @match        https://order.kingbus.com.tw/ORD/ORD_M_1510_OrderGo.aspx
// @match        https://order.kingbus.com.tw/ORD/ORD_M_1520_OrderGo.aspx
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
	"use strict";

	const stations = {
		宜蘭: "U03",
		羅東: "U04",
		基隆: "A07",
		台北轉運: "A03",
		三重: "A19",
		板橋: "A21",
		桃園: "A11",
		中壢: "A12",
		新竹: "A14",
		清大: "D23",
		頭份: "A15",
		竹南: "D25",
		苗栗: "F04",
		台中: "G67",
		水湳: "H01",
		朝馬: "H26",
		彰化: "F10",
		員林: "F11",
		草屯: "F15",
		南投: "F17",
		埔里: "F20",
		日月潭: "F19",
		嘉義: "K06"
	};

	function get(key, def = "") {
		return GM_getValue(key, def);
	}

	function set(key, val) {
		GM_setValue(key, val);
	}

	function openSettings() {
		const panel = document.createElement("div");

		panel.style = `
position:fixed;
top:20px;
right:20px;
background:white;
border:1px solid #ccc;
padding:20px;
z-index:999999;
font-size:14px;
`;

		panel.innerHTML = `
<h3>Kingbus Script Settings</h3>

姓名<br>
<input id="kb_name" value="${get("name")}"><br><br>

身分證<br>
<input id="kb_id" value="${get("id")}"><br><br>

手機<br>
<input id="kb_phone" value="${get("phone")}"><br><br>

Email<br>
<input id="kb_email" value="${get("email")}"><br><br>

出發站<br>
<select id="kb_from"></select><br><br>

目的地<br>
<select id="kb_to"></select><br><br>

<button id="kb_save">Save</button>
<button id="kb_close">Close</button>
`;

		document.body.appendChild(panel);

		const fromSelect = panel.querySelector("#kb_from");
		const toSelect = panel.querySelector("#kb_to");

		Object.keys(stations).forEach(name => {
			const opt1 = document.createElement("option");
			opt1.value = name;
			opt1.textContent = name;
			fromSelect.appendChild(opt1);

			const opt2 = document.createElement("option");
			opt2.value = name;
			opt2.textContent = name;
			toSelect.appendChild(opt2);
		});

		fromSelect.value = get("from");
		toSelect.value = get("to");

		panel.querySelector("#kb_save").onclick = () => {
			set("name", panel.querySelector("#kb_name").value);
			set("id", panel.querySelector("#kb_id").value);
			set("phone", panel.querySelector("#kb_phone").value);
			set("email", panel.querySelector("#kb_email").value);

			set("from", fromSelect.value);
			set("to", toSelect.value);

			alert("Saved!");
		};

		panel.querySelector("#kb_close").onclick = () => {
			panel.remove();
		};
	}

	GM_registerMenuCommand("設定訂票資訊", openSettings);

	////////////////////////////////////////////////////////////
	// Wait helper
	////////////////////////////////////////////////////////////

	function wait(selector) {
		return new Promise(resolve => {
			const check = () => {
				const el = document.querySelector(selector);

				if (el) resolve(el);
				else requestAnimationFrame(check);
			};

			check();
		});
	}

	////////////////////////////////////////////////////////////
	// Step 1
	////////////////////////////////////////////////////////////

	(async function () {
		const idInput = await wait("#ctl00_ContentPlaceHolder1_txtCustomer_ID");

		document.querySelector("#ctl00_ContentPlaceHolder1_txtCustomer_ID").value = get("id");
		document.querySelector("#ctl00_ContentPlaceHolder1_txtPhone").value = get("phone");
		document.querySelector("#ctl00_ContentPlaceHolder1_txtCustomer_N").value = get("name");
		document.querySelector("#ctl00_ContentPlaceHolder1_txtE_mail").value = get("email");

		document.querySelector("#ctl00_ContentPlaceHolder1_btnStep1_OK").click();
	})();

	////////////////////////////////////////////////////////////
	// Step 2
	////////////////////////////////////////////////////////////

	(async function () {
		const fromSelect = await wait("#ctl00_ContentPlaceHolder1_ddlStation_ID_From");

		setTimeout(() => {
			const fromName = get("from");
			const toName = get("to");

			fromSelect.value = stations[fromName];

			fromSelect.dispatchEvent(new Event("change", { bubbles: true }));

			wait('select[name="ctl00$ContentPlaceHolder1$ddlStation_ID_To"]').then(() => {
				const toSelect = document.querySelector('select[name="ctl00$ContentPlaceHolder1$ddlStation_ID_To"]');

				toSelect.value = stations[toName];

				const today = new Date(Date.now() + 2.5 * 60 * 60 * 1000);

				const yyyy = today.getFullYear();
				const mm = String(today.getMonth() + 1).padStart(2, "0");
				const dd = String(today.getDate()).padStart(2, "0");

				let hour = today.getHours();
				let minute = today.getMinutes();

				minute = Math.ceil(minute / 10) * 10;

				if (minute === 60) {
					minute = 0;
					hour = (hour + 1) % 24;
				}

				document.querySelector("#ctl00_ContentPlaceHolder1_txtOut_Dt").value = `${yyyy}/${mm}/${dd}`;

				document.querySelector("#ctl00_ContentPlaceHolder1_ddlHour").value = hour.toString().padStart(2, "0");

				document.querySelector("#ctl00_ContentPlaceHolder1_ddlMinute").value = minute.toString().padStart(2, "0");

				document.querySelector("#ctl00_ContentPlaceHolder1_btnStep2_OK").click();
			});
		}, 200);
	})();
})();
