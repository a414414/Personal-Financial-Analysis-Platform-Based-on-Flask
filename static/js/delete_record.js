/**
 * delete_record.js
 * ----------------
 * 📌 功能說明：
 * - 管理交易紀錄的刪除流程
 * - 綁定每筆交易列的刪除按鈕（使用事件委派）
 * - 觸發 Bootstrap Modal 進行刪除確認
 * - 確認後透過 fetch 傳送刪除請求給 Flask 後端
 * - 成功刪除後從畫面移除該筆資料、更新圖表並提示成功
 * - 自動退出編輯模式以避免殘留狀態
 */
import { showAlert } from './utils.js';
import { refreshCharts } from './chart.js';

document.addEventListener("DOMContentLoaded", () => {
    // 取得 Bootstrap Modal 元素與實例
    const modalEl = document.getElementById("confirmDeleteModal");
    const modalInstance = new bootstrap.Modal(modalEl);

    // 確認刪除按鈕
    const confirmBtn = document.getElementById("confirmDeleteBtn");

    // 儲存待刪除的 ID 與類型（income/expense）
    let deleteId = null;
    let deleteType = null;

    /**
     * ✅ 綁定所有刪除按鈕（使用事件委派處理動態資料列）
     * 當任何 delete-btn 被點擊時，存下 row-id 與類型並顯示 Modal
     */
    document.body.addEventListener("click", (e) => {
        if (e.target.classList.contains("delete-btn")) {
            deleteId = e.target.dataset.rowId;
            deleteType = e.target.dataset.type;
            modalInstance.show(); // 開啟確認刪除視窗
        }
    });

    // ✅ 確認刪除後送出請求
    confirmBtn.addEventListener("click", () => {
        fetch("/delete_record", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: deleteId, type: deleteType })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // 成功：移除 DOM 中該筆資料列
                    const row = document.querySelector(`tr[data-row-id="${deleteId}"][data-type="${deleteType}"]`);
                    if (row) row.remove();

                    // 關閉 Modal
                    modalInstance.hide();

                    // 顯示提示訊息（根據是支出/收入選 alert_expense 或 alert_income）
                    showAlert("交易已刪除！", "success", deleteType);

                    // 刷新圖表（例如圓餅圖與趨勢圖）
                    refreshCharts();

                    // 自動退出編輯模式（若仍處於編輯狀態）
                    document.getElementById("doneBtn")?.click();
                } else {
                    // 回傳錯誤訊息
                    showAlert(data.error || "刪除失敗，請稍後再試。", "danger", deleteType);
                }
            })
            .catch(() => {
                // 網路或伺服器錯誤
                showAlert("連線錯誤，請稍後再試。", "danger", deleteType);
            });
    });
});
