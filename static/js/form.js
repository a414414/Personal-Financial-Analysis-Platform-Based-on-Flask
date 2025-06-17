/**
 * form.js
 * ----------------
 * 📌 功能說明：
 * - 控制新增交易表單的欄位顯示與互動邏輯
 * - 根據使用者選擇的收支類型（income/expense）動態切換欄位與分類選單
 * - 初始化日期、類型、金額快捷按鈕與清除按鈕功能
 * - 管理匯出報表時自動補上選擇的年月
 */

import { addAmount, clearAmount } from './utils.js';

document.addEventListener("DOMContentLoaded", () => {
    const typeSelect = document.getElementById("typeSelect");
    const dateInput = document.getElementById("transactionDate");

    // ✅ 預設將日期設為今天
    if (dateInput && dateInput.getAttribute("type") === "date") {
        const today = new Date().toISOString().split("T")[0];
        dateInput.value = today;
        console.log("[初始化] 強制設定日期為今天：", dateInput.value);
    }

    // ✅ 預設類型為「支出」
    if (typeSelect && !typeSelect.value) {
        typeSelect.value = "expense";
    }

    // ⏬ 取得欄位群組 DOM
    const commonFields = document.getElementById("commonFields");
    const commonCategory = document.getElementById("commonCategory");
    const commonDesc = document.getElementById("commonDesc");
    const commonAmount = document.getElementById("commonAmount");
    const amountButtons = document.getElementById("amountButtons");
    const categorySelect = document.getElementById("categoryField");

    const expenseFields = document.getElementById("expenseFields");
    const expenseTags = document.getElementById("expenseTags");
    const expenseMood = document.getElementById("expenseMood");
    const expenseNeed = document.getElementById("expenseNeed");

    // 收入 / 支出的分類選項
    const categories = {
        income: ["薪水", "獎助學金", "家人", "投資", "其他"],
        expense: ["交通", "飲食", "娛樂", "學習", "日用品", "其他"]
    };

    // ✅ 根據選擇的類型切換表單欄位顯示
    if (typeSelect) {
        typeSelect.addEventListener("change", () => {
            const type = typeSelect.value;
            const showCommon = (type === "income" || type === "expense");

            console.log("[DEBUG] 使用者選擇的類型：", type);
            console.log("[DEBUG] showCommon：", showCommon);
            console.log("[DEBUG] dateInput.value 初始值：", dateInput?.value);

            // 顯示／隱藏「通用欄位」
            commonFields.style.display = showCommon ? "block" : "none";
            commonCategory.style.display = showCommon ? "block" : "none";
            commonDesc.style.display = showCommon ? "block" : "none";
            commonAmount.style.display = showCommon ? "block" : "none";
            amountButtons.style.display = showCommon ? "flex" : "none";

            // 額外支出欄位顯示條件
            const showExpense = (type === "expense");
            expenseFields.style.display = showExpense ? "block" : "none";
            expenseTags.style.display = showExpense ? "block" : "none";
            expenseMood.style.display = showExpense ? "block" : "none";
            expenseNeed.style.display = showExpense ? "block" : "none";

            // 若轉換為非支出，清空這些欄位的值
            if (!showExpense) {
                [expenseFields, expenseTags, expenseMood, expenseNeed].forEach(group => {
                    if (group) {
                        group.querySelectorAll("input, select").forEach(el => el.value = "");
                    }
                });
            }

            // 依據類型切換分類選單
            if (categorySelect && categories[type]) {
                categorySelect.innerHTML = `<option value="">請選擇</option>` +
                    categories[type].map(cat => `<option value="${cat}">${cat}</option>`).join("");
            }

            // ✅ 自動填入今天日期（格式錯誤才補填）
            if (showCommon && dateInput) {
                const isValidDateFormat = /^\d{4}-\d{2}-\d{2}$/.test(dateInput.value);
                if (!isValidDateFormat) {
                    const today = new Date().toISOString().split("T")[0];
                    dateInput.value = today;
                    dateInput.dispatchEvent(new Event("input"));
                }
            }
        });

        // ✅ 一進入頁面時觸發一次切換（初始化）
        typeSelect.dispatchEvent(new Event("change"));
    }

    // ✅ 金額快捷按鈕（+100 / +500 等）
    document.querySelectorAll(".amount-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const val = parseInt(btn.dataset.val);
            addAmount(val);
        });
    });

    // ✅ 清除金額按鈕
    document.querySelectorAll(".clear-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            clearAmount();
        });
    });

    // ✅ 支援收支類型為 radio 欄位時的欄位顯示切換
    const typeRadios = document.querySelectorAll('input[name="type"]');
    const incomeFields = document.getElementById("incomeFields");
    const quickBtns = document.querySelectorAll(".quick-btn");

    function toggleFields() {
        const selected = document.querySelector('input[name="type"]:checked')?.value;
        if (selected === "income") {
            incomeFields?.classList.remove("d-none");
            expenseFields?.classList.add("d-none");
        } else if (selected === "expense") {
            incomeFields?.classList.add("d-none");
            expenseFields?.classList.remove("d-none");
        }
    }

    typeRadios.forEach(radio => radio.addEventListener("change", toggleFields));
    toggleFields(); // 初始化一次

    // ✅ 快速設定金額的按鈕（常見金額如 100、200）
    quickBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const value = btn.getAttribute("data-value");
            const amountInput = document.getElementById("amount");
            if (amountInput) amountInput.value = value;
        });
    });
});

document.addEventListener("DOMContentLoaded", () => {
    // ✅ 匯出報表功能，補齊年月資訊
    const exportForm = document.getElementById("exportForm");
    const exportYearInput = document.getElementById("exportYear");
    const exportMonthInput = document.getElementById("exportMonth");

    const dateInput = document.getElementById("dateInput");

    if (exportForm) {
        exportForm.addEventListener("submit", (e) => {
            const dateValue = dateInput?.value; // 預期格式 yyyy-mm
            if (!dateValue || !/^\d{4}-\d{2}$/.test(dateValue)) {
                e.preventDefault();
                alert("請先選擇正確的年月！");
                return;
            }

            const [year, month] = dateValue.split("-");
            exportYearInput.value = year;
            exportMonthInput.value = month;
        });
    }
});
