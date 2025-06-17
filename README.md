# Personal Financial Analysis Platform Based on Flask

A simple, modern web-based personal finance tracking system built with Flask, SQLite, Chart.js, and Bootstrap.  
The system allows users to record daily income and expenses, visualize financial data, and perform self-reflection using additional tags such as mood and desire/need indicators.

---

## 💡 Features

- 📋 Record income and expenses with custom fields:
  - Category
  - Description
  - Amount
  - Payment method
  - Tags
  - Mood
  - Need or Want

- 📈 Visualized reports with:
  - Monthly summary pie chart
  - Trend line chart for the past 6 months
  - Category-wise bar charts

- ✏️ Edit & delete records with in-page AJAX (no refresh)
- 🎨 Light/dark theme switch with consistent UI
- 🧾 Export monthly records as CSV
- 🔍 Filter by year/month
- 📱 Responsive layout using Bootstrap 5

---

## ⚙️ Tech Stack

| Layer      | Tools & Libraries                |
|------------|----------------------------------|
| Backend    | Python, Flask, SQLite3, Pandas   |
| Frontend   | HTML, Bootstrap 5, Chart.js      |
| JS Modules | Fetch API, AJAX, ES6 modules     |
| Data Logic | Transaction categorization, tag analysis |

---

## 🏁 Getting Started

### 📦 Requirements

- Python 3.9+
- pip

### 🔧 Installation

```bash
git clone https://github.com/a414414/Personal-Financial-Analysis-Platform-Based-on-Flask.git
cd Personal-Financial-Analysis-Platform-Based-on-Flask
pip install -r requirements.txt
python app.py