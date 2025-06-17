/**
 * edit_mode.js
 * ----------------
 * 📌 功能說明：
 * - 管理整頁的「編輯模式」開啟與關閉邏輯
 * - 點擊「編輯」按鈕後，讓所有資料列進入可編輯狀態（顯示 input 欄位、操作按鈕）
 * - 點擊「完成」按鈕後，還原所有欄位為只讀模式
 * - 可支援收入與支出兩區資料同時切換編輯狀態
 */

document.addEventListener("DOMContentLoaded", () => {
    // 取得編輯模式按鈕與完成按鈕
    const editBtn = document.querySelector(".edit-buttons .btn-outline-primary");
    const doneBtn = document.getElementById("doneBtn");

    /**
     * ✅ 切換所有列的顯示狀態
     * @param {boolean} isEditing - 是否啟用編輯模式
     */
    function toggleEditMode(isEditing) {
        const rows = document.querySelectorAll("tr[data-row-id]"); // 取得所有可編輯列

        rows.forEach(row => {
            // 切換：顯示或隱藏純文字顯示區（view-mode）
            row.querySelectorAll(".view-mode").forEach(el => {
                el.classList.toggle("d-none", isEditing);
            });

            // 切換：顯示或隱藏輸入欄位（edit-input）
            row.querySelectorAll(".edit-input").forEach(el => {
                el.classList.toggle("d-none", !isEditing);
            });

            // 切換：儲存按鈕
            row.querySelector(".save-btn")?.classList.toggle("d-none", !isEditing);

            // 切換：刪除按鈕（同時使用於確認刪除）
            row.querySelector(".delete-btn")?.classList.toggle("d-none", !isEditing);
        });

        // 按鈕本身也要切換（編輯 -> 完成）
        editBtn.style.display = isEditing ? "none" : "inline-block";
        doneBtn.style.display = isEditing ? "inline-block" : "none";
    }

    // 綁定點擊事件：開啟編輯模式
    if (editBtn) {
        editBtn.addEventListener("click", () => toggleEditMode(true));
    }

    // 綁定點擊事件：關閉編輯模式
    if (doneBtn) {
        doneBtn.addEventListener("click", () => toggleEditMode(false));
    }
});
