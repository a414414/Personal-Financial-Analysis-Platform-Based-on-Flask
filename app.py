# app.py

from flask import Flask, render_template, request, redirect, url_for, jsonify, send_file
import sqlite3
import os
import pandas as pd
from io import BytesIO
from datetime import datetime, timedelta

app = Flask(__name__)

# 設定資料庫路徑
DB_PATH = os.path.join(os.path.dirname(__file__), 'data', 'finance.db')

# 從資料庫中取得指定年月的支出與收入資料
def get_expense_income(year_month):
    with sqlite3.connect(DB_PATH) as conn:
        c = conn.cursor()

        # 取得支出資料
        c.execute("""
            SELECT id, date, category, description, amount, payment_method, tags, mood, need_or_want
            FROM expense
            WHERE date LIKE ?
            ORDER BY date DESC
        """, (year_month + '%',))
        expenses = c.fetchall()

        # 取得收入資料
        c.execute("""
            SELECT id, date, category, description, amount
            FROM income
            WHERE date LIKE ?
            ORDER BY date DESC
        """, (year_month + '%',))
        incomes = c.fetchall()

    return expenses, incomes

# 首頁路由：顯示記帳資料與處理新增資料
@app.route('/', methods=['GET', 'POST'])
def index():
    now = datetime.now()

    # 若使用者從月份選擇欄輸入，則以該年月為主，否則預設使用現在時間
    month_input = request.args.get('month_select')
    if month_input:
        year, month = month_input.split('-')
    else:
        year = request.args.get('year', str(now.year))
        month = request.args.get('month', str(now.month).zfill(2))

    # 處理新增交易（POST 請求）
    if request.method == 'POST':
        form_type = request.form['form_type']
        date = request.form['date']
        category = request.form.get('category')
        description = request.form.get('description')
        amount = request.form.get('amount')

        with sqlite3.connect(DB_PATH) as conn:
            c = conn.cursor()
            if form_type == 'expense':
                # 若為支出，還需額外欄位
                payment_method = request.form.get('payment_method')
                tags = request.form.get('tags')
                mood = request.form.get('mood')
                need_or_want = request.form.get('need_or_want')
                c.execute('''
                    INSERT INTO expense (amount, date, category, description, payment_method, tags, mood, need_or_want)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (amount, date, category, description, payment_method, tags, mood, need_or_want))
            elif form_type == 'income':
                # 若為收入
                c.execute('''
                    INSERT INTO income (amount, date, category, description)
                    VALUES (?, ?, ?, ?)
                ''', (amount, date, category, description))
            conn.commit()

        return redirect(url_for('index', year=year, month=month))

    # 取得該月支出與收入資料
    expenses, incomes = get_expense_income(f"{year}-{month.zfill(2)}")

    # 渲染頁面
    return render_template('index.html',
                           year=year,
                           month=month,
                           expenses=expenses,
                           incomes=incomes)

# API：回傳圖表所需的統計資料
@app.route('/chart_data')
def chart_data():
    try:
        now = datetime.now()
        month_str = now.strftime("%Y-%m")

        with sqlite3.connect(DB_PATH) as conn:
            c = conn.cursor()

            # 總收入 & 支出
            c.execute("SELECT SUM(amount) FROM income WHERE date LIKE ?", (month_str + '%',))
            total_income = c.fetchone()[0] or 0

            c.execute("SELECT SUM(amount) FROM expense WHERE date LIKE ?", (month_str + '%',))
            total_expense = c.fetchone()[0] or 0

            # 收入依類別統計
            c.execute("""
                SELECT category, SUM(amount)
                FROM income
                WHERE date LIKE ?
                GROUP BY category
            """, (month_str + '%',))
            income_by_category = c.fetchall()

            # 支出依類別統計
            c.execute("""
                SELECT category, SUM(amount)
                FROM expense
                WHERE date LIKE ?
                GROUP BY category
            """, (month_str + '%',))
            expense_by_category = c.fetchall()

            # 收支趨勢資料（近六個月）
            trend_data = {'labels': [], 'income': [], 'expense': []}
            for i in range(5, -1, -1):
                target = (now.replace(day=1) - timedelta(days=30 * i)).strftime("%Y-%m")
                trend_data['labels'].append(target)
                c.execute("SELECT SUM(amount) FROM income WHERE date LIKE ?", (target + '%',))
                trend_data['income'].append(c.fetchone()[0] or 0)
                c.execute("SELECT SUM(amount) FROM expense WHERE date LIKE ?", (target + '%',))
                trend_data['expense'].append(c.fetchone()[0] or 0)

        # 將資料以 JSON 格式傳回給前端
        return jsonify({
            'success': True,
            'summary_data': [
                {'type': '收入', 'total': total_income},
                {'type': '支出', 'total': total_expense}
            ],
            'income_data': [
                {'category': row[0] or '未分類', 'total': row[1]} for row in income_by_category
            ],
            'expense_data': [
                {'category': row[0] or '未分類', 'total': row[1]} for row in expense_by_category
            ],
            'trend_data': trend_data
        })

    except Exception as e:
        # 若發生錯誤，回傳錯誤訊息與 500 狀態碼
        return jsonify({'success': False, 'error': '取得圖表資料時發生錯誤', 'detail': str(e)}), 500




# API：刪除特定紀錄（收入或支出）
# API：刪除特定紀錄（收入或支出）
@app.route('/delete_record', methods=['POST'])
def delete_record():
    try:
        data = request.get_json()  # 從前端取得 JSON 格式的資料
        record_id = data.get('id')  # 取得要刪除的紀錄 ID
        record_type = data.get('type')  # 確認是支出還是收入

        # 檢查必要欄位是否齊全
        if not record_id or not record_type:
            return jsonify({'success': False, 'error': '缺少參數'}), 400

        # 根據類型決定操作哪個資料表
        table = 'expense' if record_type == 'expense' else 'income' if record_type == 'income' else None
        if not table:
            return jsonify({'success': False, 'error': '類型錯誤'}), 400

        # 執行刪除操作
        with sqlite3.connect(DB_PATH) as conn:
            c = conn.cursor()
            c.execute(f"DELETE FROM {table} WHERE id = ?", (record_id,))
            conn.commit()

        return jsonify({'success': True})

    except Exception as e:
        app.logger.error(f"刪除錯誤：{e}")
        return jsonify({'success': False, 'error': '伺服器錯誤'}), 500



# API：編輯特定收入或支出紀錄
# API：編輯特定收入或支出紀錄
@app.route('/edit_record', methods=['PATCH'])
def edit_record():
    try:
        data = request.get_json()  # 取得前端送來的資料
        t_id = data.get('id')
        t_type = data.get('type')  # 'income' 或 'expense'
        date = data.get('date')
        category = data.get('category')
        description = data.get('description')
        amount = data.get('amount')
        payment_method = data.get('payment_method')
        tags = data.get('tags')
        mood = data.get('mood')
        need_or_want = data.get('need_or_want')

        # 檢查必要欄位是否完整
        if not all([t_id, t_type, date, amount]):
            return jsonify({'success': False, 'error': '欄位不完整'}), 400

        # 驗證金額為有效正數
        try:
            amount = float(amount)
            if amount <= 0:
                return jsonify({'success': False, 'error': '金額必須大於 0'}), 400
        except (ValueError, TypeError):
            return jsonify({'success': False, 'error': '金額格式錯誤'}), 400

        # 更新資料庫中對應紀錄
        with sqlite3.connect(DB_PATH) as conn:
            c = conn.cursor()
            if t_type == 'expense':
                c.execute('''
                    UPDATE expense
                    SET date = ?, category = ?, description = ?, amount = ?,
                        payment_method = ?, tags = ?, mood = ?, need_or_want = ?
                    WHERE id = ?
                ''', (date, category, description, amount, payment_method, tags, mood, need_or_want, t_id))
            else:  # income
                c.execute('''
                    UPDATE income
                    SET date = ?, category = ?, description = ?, amount = ?
                    WHERE id = ?
                ''', (date, category, description, amount, t_id))
            conn.commit()

        return jsonify({'success': True})

    except Exception as e:
        app.logger.error(f"Edit error: {e}")
        return jsonify({'success': False, 'error': '伺服器錯誤'}), 500




# 匯出指定月份的收支資料為 CSV
@app.route("/export_csv")
def export_csv():
    try:
        year = request.args.get("year")
        month = request.args.get("month")
        if not year or not month:
            return jsonify({"error": "缺少 year 或 month 參數"}), 400

        year_month = f"{year}-{month.zfill(2)}"

        with sqlite3.connect(DB_PATH) as conn:
            c = conn.cursor()

            # 查詢收入與支出資料
            c.execute("SELECT date, category, description, amount FROM income WHERE date LIKE ?", (year_month + '%',))
            income_data = c.fetchall()
            c.execute("SELECT date, category, description, amount FROM expense WHERE date LIKE ?", (year_month + '%',))
            expense_data = c.fetchall()

        # 轉換成 Pandas DataFrame，加上類型欄位
        df_income = pd.DataFrame(income_data, columns=["日期", "類別", "描述", "金額"])
        df_income["類型"] = "收入"
        df_expense = pd.DataFrame(expense_data, columns=["日期", "類別", "描述", "金額"])
        df_expense["類型"] = "支出"

        # 合併並排序資料
        df = pd.concat([df_income, df_expense])
        df.sort_values(by="日期", inplace=True)

        # 將 DataFrame 轉成 CSV 並存入記憶體
        buffer = BytesIO()
        df.to_csv(buffer, index=False, encoding="utf-8-sig")
        buffer.seek(0)

        filename = f"財務報表_{year_month}.csv"
        return send_file(buffer,
                         as_attachment=True,
                         download_name=filename,
                         mimetype="text/csv")

    except Exception as e:
        return jsonify({"error": "匯出報表失敗", "detail": str(e)}), 500



# API：以非同步方式新增收入或支出紀錄
@app.route("/add_record", methods=["POST"])
def add_record():
    try:
        data = request.get_json()

        # 驗證金額格式與正值
        try:
            amount = float(data.get("amount", 0))
            if amount <= 0:
                return jsonify(success=False, error="金額必須大於 0"), 400
        except (ValueError, TypeError):
            return jsonify(success=False, error="金額格式錯誤"), 400

        # 擷取必要與選填欄位資料
        date = data.get("date")
        record_type = data.get("type")  # 'income' or 'expense'
        category = data.get("category") or None
        description = data.get("description") or None
        payment_method = data.get("payment_method") or None
        tags = data.get("tags") or None
        mood = data.get("mood") or None
        need_or_want = data.get("need_or_want") or None

        if not date or not amount or not record_type:
            return jsonify(success=False, error="缺少必要欄位"), 400

        # 根據類型插入資料
        with sqlite3.connect(DB_PATH) as conn:
            c = conn.cursor()
            if record_type == "expense":
                c.execute("""
                    INSERT INTO expense (date, category, description, amount, payment_method, tags, mood, need_or_want)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (date, category, description, amount, payment_method, tags, mood, need_or_want))
            elif record_type == "income":
                c.execute("""
                    INSERT INTO income (date, category, description, amount)
                    VALUES (?, ?, ?, ?)
                """, (date, category, description, amount))
            else:
                return jsonify(success=False, error="類型錯誤"), 400

            conn.commit()
            new_id = c.lastrowid

        # 回傳新增後的資料內容
        return jsonify(success=True, data={
            "id": new_id,
            "date": date,
            "category": category,
            "description": description,
            "amount": float(amount),
            "type": record_type,
            "payment_method": payment_method,
            "tags": tags,
            "mood": mood,
            "need_or_want": need_or_want
        })

    except Exception as e:
        app.logger.error(f"Add error: {e}")
        return jsonify(success=False, error="伺服器錯誤"), 500

if __name__ == '__main__':
    app.run(debug=True)
