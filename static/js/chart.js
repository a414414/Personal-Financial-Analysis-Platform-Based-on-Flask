/**
 * chart.js
 * -------------------------------
 * 📊 功能說明：
 * 此檔案用於繪製財務視覺化圖表，包含：
 * ✅ 收入 / 支出分類圓餅圖
 * ✅ 近六個月收支趨勢折線圖
 * ✅ 當月總收支圓餅圖（收入 vs 支出）
 * ✅ 切換至「分析頁」時自動載入圖表資料
 */

import { showAlert } from './utils.js'; // 載入提示訊息顯示函式

// 儲存 Chart.js 的圖表實例（避免重複繪製）
let expenseChart, incomeChart, trendChart, summaryChart;

/**
 * ✅ 繪製分類圓餅圖
 * @param {string} type - "expense" 或 "income"
 * @param {Array} data - [{category, total}]
 */
function drawPieChart(type, data) {
    const ctx = document.getElementById(`${type}PieChart`).getContext("2d");

    // 若已有圖表，先銷毀避免重疊
    if (type === "expense" && expenseChart) expenseChart.destroy();
    if (type === "income" && incomeChart) incomeChart.destroy();

    const labels = data.map(item => item.category); // 取得所有類別名稱
    const values = data.map(item => item.total);    // 對應金額

    const chart = new Chart(ctx, {
        type: "pie",
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    "#007bff", "#28a745", "#ffc107", "#dc3545", "#6c757d", "#17a2b8"
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                title: {
                    display: true,
                }
            }
        }
    });

    // 儲存實例以利後續銷毀更新
    if (type === "expense") expenseChart = chart;
    if (type === "income") incomeChart = chart;
}

/**
 * ✅ 繪製最近六個月的收支折線圖
 * @param {Object} data - { labels: [...], income: [...], expense: [...] }
 */
function drawTrendChart(data) {
    const ctx = document.getElementById("trendChart").getContext("2d");

    if (trendChart) trendChart.destroy(); // 若已有，先銷毀

    trendChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: "支出",
                    data: data.expense,
                    borderColor: "#dc3545",
                    fill: false
                },
                {
                    label: "收入",
                    data: data.income,
                    borderColor: "#28a745",
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // 保持與 CSS 高度一致
            plugins: {
                legend: {
                    position: "bottom" // ✅ 原本是 'top'，改成 'bottom'
                },
                title: {
                    display: true,
                }
            }
        }
    });
}

/**
 * ✅ 繪製「收入 / 支出」的總佔比圖（當月）
 * @param {Array} data - [{type: '收入' | '支出', total}]
 */
function drawSummaryChart(data) {
    const ctx = document.getElementById("summaryPieChart").getContext("2d");

    if (summaryChart) summaryChart.destroy();

    const labels = data.map(item => item.type);
    const values = data.map(item => item.total);

    summaryChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: ["#28a745", "#dc3545"]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: "bottom" },
                title: { display: true }
            }
        }
    });
}

/**
 * ✅ 呼叫 API 並重繪所有圖表
 */
export function refreshCharts() {
    fetch("/chart_data")
        .then(res => res.json())
        .then(data => {
            if (!data.success || !data.expense_data || !data.income_data || !data.summary_data) {
                showAlert("無法載入圖表資料，請稍後再試。", "danger", "alert_chart");
                return;
            }

            // 清除可能存在的提示訊息
            const alertBox = document.getElementById("alert_chart");
            if (alertBox) alertBox.innerHTML = "";

            // 繪製四種圖表
            drawPieChart("expense", data.expense_data);
            drawPieChart("income", data.income_data);
            drawTrendChart(data.trend_data);
            drawSummaryChart(data.summary_data);
        })
        .catch(err => {
            console.error("圖表載入失敗：", err);
            showAlert("圖表載入失敗，請確認網路或稍後再試。", "danger", "alert_chart");
        });
}

/**
 * ✅ 切換分析頁時，自動更新圖表
 */
document.addEventListener("DOMContentLoaded", () => {
    const analysisTab = document.querySelector('button[data-bs-target="#analysisSection"]');

    if (analysisTab) {
        analysisTab.addEventListener("shown.bs.tab", () => {
            refreshCharts();
        });
    }

    // 若初始就顯示分析區，也立即載入一次圖表
    if (document.querySelector("#analysisSection")?.classList.contains("active")) {
        refreshCharts();
    }
});
