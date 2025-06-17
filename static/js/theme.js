/**
 * theme.js
 * ----------------
 * 📌 功能說明：
 * - 管理整個網站的主題切換（淺色 / 深色）
 * - 使用者透過下拉選單選擇主題後，會即時套用至整體頁面（透過 data-bs-theme 控制）
 * - 使用 localStorage 記錄使用者的主題偏好，下次重新載入頁面時自動套用
 */

document.addEventListener("DOMContentLoaded", () => {
    const themeSelect = document.getElementById("themeSelect"); // 主題選擇下拉選單
    const htmlEl = document.documentElement; // <html> 元素，用來設置 data-bs-theme

    // ✅ 預設載入時，如果 localStorage 有記錄主題，就套用它
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
        htmlEl.setAttribute("data-bs-theme", savedTheme); // 套用主題屬性
        themeSelect.value = savedTheme; // 同步下拉選單顯示
    }

    // ✅ 當使用者手動切換主題
    themeSelect.addEventListener("change", () => {
        const selectedTheme = themeSelect.value;
        htmlEl.setAttribute("data-bs-theme", selectedTheme); // 套用到頁面
        localStorage.setItem("theme", selectedTheme); // 存到 localStorage
    });
});
