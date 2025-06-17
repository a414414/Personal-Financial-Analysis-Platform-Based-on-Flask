/**
 * add_record.js
 * -------------------------------
 * 📌 功能說明：
 * 此檔案用於處理「新增交易」的前端互動邏輯，包括：
 * ✅ 表單欄位驗證與送出
 * ✅ 新增資料後更新圖表
 * ✅ 若資料為目前月份，立即插入至對應表格
 * ✅ 使用者體驗最佳化：自動補日期、重設欄位、顯示提示訊息
 */

// 載入共用工具函式（顯示提示訊息）與圖表刷新函式
import { showAlert } from './utils.js';
import { refreshCharts } from './chart.js';

// 等待 DOM 載入完成
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("addTransactionForm");     // 表單本體
  const typeSelect = document.getElementById("typeSelect");       // 收支類型選擇
  const dateInput = document.getElementById("transactionDate");   // 日期欄位
  const categoryField = document.getElementById("categoryField"); // 類別欄位

  if (!form || !typeSelect) return;

  // ✅ 驗證表單資料是否完整
  function validateForm(data) {
    if (!data.date) {
      showAlert("請選擇日期", "danger", "alert_add");
      return false;
    }
    if (!data.type) {
      showAlert("請選擇收支類型", "danger", "alert_add");
      return false;
    }
    const amount = parseFloat(data.amount);
    if (!data.amount || isNaN(amount) || amount <= 0) {
      showAlert("請輸入大於 0 的有效金額", "danger", "alert_add");
      return false;
    }
    return true;
  }

  // ✅ 新增成功後插入該筆紀錄到對應表格
  function insertRow(data) {
    const tbody = document.querySelector(`tbody[data-type="${data.type}"]`);
    if (!tbody) return;

    const tr = document.createElement("tr");
    tr.setAttribute("data-row-id", data.id);
    tr.setAttribute("data-type", data.type);

    // 支出紀錄的表格 HTML
    if (data.type === "expense") {
      tr.innerHTML = `
        <td><span class="view-mode">${data.date}</span><input type="date" class="form-control edit-input d-none" value="${data.date}"></td>
        <td><span class="view-mode">${data.category || ""}</span><input type="text" class="form-control edit-input d-none" value="${data.category || ""}"></td>
        <td><span class="view-mode">${data.description || ""}</span><input type="text" class="form-control edit-input d-none" value="${data.description || ""}"></td>
        <td class="expense"><span class="view-mode">${parseFloat(data.amount).toFixed(2)}</span><input type="number" class="form-control edit-input d-none" value="${parseFloat(data.amount).toFixed(2)}"></td>
        <td><span class="view-mode">${data.payment_method || ""}</span><input type="text" class="form-control edit-input d-none" value="${data.payment_method || ""}"></td>
        <td><span class="view-mode">${data.tags || ""}</span><input type="text" class="form-control edit-input d-none" value="${data.tags || ""}"></td>
        <td><span class="view-mode">${data.mood || ""}</span><input type="text" class="form-control edit-input d-none" value="${data.mood || ""}"></td>
        <td>
          <span class="view-mode">${data.need_or_want || ""}</span>
          <select class="form-select edit-input d-none">
            <option value="">請選擇</option>
            <option value="need" ${data.need_or_want === "need" ? "selected" : ""}>Need</option>
            <option value="want" ${data.need_or_want === "want" ? "selected" : ""}>Want</option>
          </select>
          <div class="d-flex justify-content-center gap-2 mt-2">
            <button type="button" class="btn btn-success btn-sm save-btn d-none">儲存</button>
            <button type="button" class="btn btn-danger btn-sm delete-btn d-none" data-row-id="${data.id}" data-type="expense">刪除</button>
          </div>
        </td>
      `;
    }

    // 收入紀錄的表格 HTML
    else if (data.type === "income") {
      tr.innerHTML = `
        <td><span class="view-mode">${data.date}</span><input type="date" class="form-control edit-input d-none" value="${data.date}"></td>
        <td><span class="view-mode">${data.category || ""}</span><input type="text" class="form-control edit-input d-none" value="${data.category || ""}"></td>
        <td><span class="view-mode">${data.description || ""}</span><input type="text" class="form-control edit-input d-none" value="${data.description || ""}"></td>
        <td class="income">
          <span class="view-mode">${parseFloat(data.amount).toFixed(2)}</span>
          <input type="number" class="form-control edit-input d-none" value="${parseFloat(data.amount).toFixed(2)}">
          <div class="d-flex justify-content-center gap-2 mt-2">
            <button type="button" class="btn btn-success btn-sm save-btn d-none">儲存</button>
            <button type="button" class="btn btn-danger btn-sm delete-btn d-none" data-row-id="${data.id}" data-type="income">刪除</button>
          </div>
        </td>
      `;
    }

    // 插入表格最上方（最新）
    tbody.prepend(tr);
  }

  // ✅ 表單送出事件（改為非同步 fetch）
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries()); // 將 FormData 轉為 JS 物件

    if (!validateForm(data)) return;

    try {
      const res = await fetch("/add_record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!result.success) {
        showAlert(result.error || "新增失敗", "danger", "alert_add");
        return;
      }

      // ✅ 新增成功：重設表單與欄位
      form.reset();
      typeSelect.value = "";
      typeSelect.dispatchEvent(new Event("change")); // 觸發收支切換事件（清除欄位）

      // 自動填入今天日期
      if (dateInput) {
        dateInput.value = new Date().toISOString().split("T")[0];
      }

      // 清空類別欄位
      if (categoryField) {
        categoryField.innerHTML = `<option value="">請選擇</option>`;
      }

      // 刷新圖表、顯示成功訊息
      refreshCharts();
      showAlert("新增成功", "success", "alert_add");

      // ✅ 若新增的資料是目前月份，則即時插入表格中
      const currentMonth = document.getElementById("dateInput")?.value;
      const recordMonth = result.data.date?.slice(0, 7); // yyyy-mm
      if (currentMonth && recordMonth && currentMonth === recordMonth) {
        insertRow(result.data);
      }

    } catch (err) {
      console.error(err);
      showAlert("發生錯誤，請稍後再試", "danger", "alert_add");
    }
  });
});
