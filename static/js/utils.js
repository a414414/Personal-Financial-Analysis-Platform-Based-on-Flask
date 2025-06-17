/**
 * utils.js
 * ----------------
 * 📌 功能說明：
 * 本檔案集中管理記帳系統中常用的「工具函式（utility functions）」，
 * 可於多個模組中共用，避免重複撰寫。
 * 
 * ✅ 提供功能：
 * - 金額快捷加總（如 +100, +500 按鈕）
 * - 清除金額欄位
 * - 顯示 Bootstrap alert 提示訊息
 */

/**
 * ✅ addAmount(val)
 * 將金額欄位的值加上指定數字（val），用於金額快捷鍵功能。
 */
export function addAmount(val) {
    const input = document.querySelector('input[name="amount"]');
    if (input) {
        const current = parseFloat(input.value) || 0;
        input.value = (current + val).toFixed(2);
    }
}

/**
 * ✅ clearAmount()
 * 清空金額欄位，用於「清除」按鈕功能。
 */
export function clearAmount() {
    const input = document.querySelector('input[name="amount"]');
    if (input) {
        input.value = '';
    }
}

/**
 * ✅ showAlert(message, type, containerId)
 * 顯示提示訊息（使用 Bootstrap 的 alert）
 * - message：提示內容
 * - type：提示類型（success, danger, warning...）
 * - containerId：要顯示的 alert 容器 DOM ID
 */
export function showAlert(message, type = "success", containerId = "alert_add") {
    const container = document.getElementById(containerId);
    if (!container) return;

    const alert = document.createElement("div");
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.role = "alert";
    alert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
    container.innerHTML = "";
    container.appendChild(alert);

    // 自動淡出與移除
    setTimeout(() => {
        alert.classList.remove("show");
        alert.classList.add("fade");
        setTimeout(() => alert.remove(), 500);
    }, 3000);
}
