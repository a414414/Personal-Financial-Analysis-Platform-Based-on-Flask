/**
 * edit_record.js
 * ----------------
 * 📌 功能說明：
 * - 管理編輯模式下的「儲存」與「刪除」功能
 * - 儲存：將修改後的資料送出至後端 `/edit_record` API
 * - 刪除：從資料列中發送刪除請求，並透過 Bootstrap Modal 確認
 * - 執行成功後即時更新畫面並退出編輯模式
 */

document.addEventListener("DOMContentLoaded", () => {

    /**
     * ✅ 顯示提示訊息（根據資料類型決定顯示位置）
     */
    function showAlert(message, type = "success", dataType = "expense") {
        const targetId = dataType === "income" ? "alert_income" : "alert_expense";
        const container = document.getElementById(targetId);
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

        // 3 秒後自動淡出與移除
        setTimeout(() => {
            alert.classList.remove("show");
            alert.classList.add("fade");
            setTimeout(() => alert.remove(), 500);
        }, 3000);
    }

    /**
     * ✅ 儲存按鈕事件處理
     * 將該列所有欄位收集後送出至後端 PATCH API
     */
    document.body.addEventListener("click", (e) => {
        if (e.target.classList.contains("save-btn")) {
            const row = e.target.closest("tr");
            const id = row.dataset.rowId;
            const type = row.dataset.type;

            const inputs = row.querySelectorAll(".edit-input");
            const spans = row.querySelectorAll(".view-mode");

            // 依欄位順序抓值
            const date = inputs[0].value;
            const category = inputs[1].value;
            const description = inputs[2].value;
            const amount = inputs[3].value;

            const payload = { id, type, date, category, description, amount };

            // 若為支出類型，補上額外欄位
            if (type === "expense") {
                payload.payment_method = inputs[4].value;
                payload.tags = inputs[5].value;
                payload.mood = inputs[6].value;
                payload.need_or_want = inputs[7]?.value || row.querySelector("select").value;
            }

            // 金額驗證
            const parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                showAlert("金額必須是大於 0 的數字", "danger", type);
                return;
            }

            // 發送 PATCH 請求進行更新
            fetch("/edit_record", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        // 更新欄位內容（即時顯示）
                        spans[0].textContent = date;
                        spans[1].textContent = category;
                        spans[2].textContent = description;
                        spans[3].textContent = parseFloat(amount).toFixed(2);

                        if (type === "expense") {
                            spans[4].textContent = payload.payment_method;
                            spans[5].textContent = payload.tags;
                            spans[6].textContent = payload.mood;
                            spans[7].textContent = payload.need_or_want;
                        }

                        // 離開編輯模式（自動按下「完成」）
                        document.getElementById("doneBtn")?.click();

                        showAlert("交易已更新！", "success", type);
                    } else {
                        alert("❌ 更新失敗！");
                    }
                })
                .catch(err => {
                    console.error("更新錯誤：", err);
                    alert("⚠️ 發生連線錯誤！");
                });
        }
    });

    /**
     * ✅ 刪除按鈕事件處理
     * 彈出確認刪除 Modal 並送出刪除請求
     */
    document.body.addEventListener("click", (e) => {
        if (e.target.classList.contains("delete-btn")) {
            const row = e.target.closest("tr");
            const id = row.dataset.rowId;
            const type = row.dataset.type;

            const modal = document.getElementById("confirmDeleteModal");
            const confirmBtn = document.getElementById("confirmDeleteBtn");

            // 將欲刪除資料存入 modal 屬性
            modal.setAttribute("data-id", id);
            modal.setAttribute("data-type", type);
            modal.setAttribute("data-row-selector", `[data-row-id='${id}']`);

            // 顯示 Bootstrap Modal
            const modalInstance = bootstrap.Modal.getOrCreateInstance(modal);
            modalInstance.show();

            // 替換按鈕（避免重複綁定）
            const newBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);

            newBtn.addEventListener("click", () => {
                fetch("/delete_record", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id, type })
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            const selector = modal.getAttribute("data-row-selector");
                            document.querySelector(selector)?.remove();
                            modalInstance.hide();
                            showAlert("交易已刪除！", "success", type);
                            document.getElementById("doneBtn")?.click();
                        } else {
                            alert("刪除失敗！");
                        }
                    })
                    .catch(() => alert("⚠️ 刪除失敗，請檢查網路"));
            });
        }
    });

});
