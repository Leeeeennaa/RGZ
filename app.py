from flask import Flask, render_template, request, redirect, url_for, session
from flask_jsonrpc import JSONRPC
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, Product, Order, Invoice, InvoiceItem

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:postgres@localhost/rgz'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = 'your_secret_key'

db.init_app(app)
jsonrpc = JSONRPC(app, '/api', enable_web_browsable_api=True)

#Проверка на админа
def is_admin(user_id):
    user = db.session.get(User, user_id)
    return user and user.role == 'admin'

#Проверка на кладовщик
def proverka_kladovchik(user_id):
    user = db.session.get(User, user_id)
    return user and user.role == 'kladovchik'


@jsonrpc.method('App.login')
#Функции имеют типизацию т.к. модуль JSONRPC обязывает типизировать функции
# Аргументы login и пароль превращаются в строку
# А функция возвращает словарь dictionary 
def login(login: str, password: str) -> dict:
    #Логин для кладовщика
    user = User.query.filter_by(login=login).first()
    if user and check_password_hash(user.password, password):
        session['user_id'] = user.id
        return {"status": "success", "user_id": user.id}
    return {"status": "error", "message": "Не правильно введены данные"}

@jsonrpc.method('App.register')
def register(name: str, login: str, password: str) -> dict:
    #Проверка на админа т.к. только он может регать кладовщиков
    if not is_admin(session.get('user_id')):
        return {"status": "error", "message": "Только админы могут регестрировать."}

    existing_user = User.query.filter_by(login=login).first()
    if existing_user:
        return {"status": "error", "message": "Логин уже есть"}

    hashed_password = generate_password_hash(password)
    new_user = User(name=name, login=login, password=hashed_password, role='kladovchik')
    db.session.add(new_user)
    db.session.commit()
    return {"status": "success", "message": "Кладовщик зарегистрирован"}

@jsonrpc.method('App.addOrUpdateProduct')
def add_or_update_product(name: str, quantity) -> dict:
    try:
        quantity = int(quantity)
        product = Product.query.filter_by(name=name).first()
        
        if product:
            # Обновляем количество, но не позволяем ему уйти в минус
            new_quantity = product.quantity + quantity
            if new_quantity < 0:
                new_quantity = 0  # Установите количество в 0, если оно становится отрицательным

            product.quantity = new_quantity
            
            # Удаляем продукт, если его количество равно 0
            if product.quantity == 0:
                db.session.delete(product)
        else:
            # Создаем новый продукт, если количество больше 0
            if quantity > 0:
                product = Product(name=name, quantity=quantity)
                db.session.add(product)
        
        db.session.commit()
        return {"status": "success", "message": "Продукт обновлен или удален при необходимости"}
    
    except Exception as e:
        db.session.rollback()
        return {"status": "error", "message": str(e)}
@jsonrpc.method('App.deleteProduct')
def delete_product(product_id: int) -> dict:
    try:
        product = Product.query.get(product_id)
        if product:
            # Проверка на наличие связанных элементов накладной
            related_items = InvoiceItem.query.filter_by(product_id=product_id).all()
            if related_items:
                # Если есть связанные элементы, сначала их нужно удалить или обработать
                return {"status": "error", "message": "Продукт связан с элементами накладной и не может быть удален."}
            else:
                db.session.delete(product)
                db.session.commit()
                return {"status": "success", "message": "Продукт удален"}
        else:
            return {"status": "error", "message": "Продукт не найден"}
    except Exception as e:
        db.session.rollback()
        return {"status": "error", "message": str(e)}

@jsonrpc.method('App.getProductsPaginated')
# Функция отвечает за то чтобы было видно 50 продуктов при переходе на страницу с продуктами
def get_products_paginated(page: int = 1, per_page: int = 50) -> dict:
    try:
        # Если параметры переданы как строки, это преобразует их в int
        page = int(page)
        per_page = int(per_page)
    except ValueError:
        # Возвращает ошибку, если параметры не могут быть преобразованы в int
        return {"status": "error", "message": "page или per_page должны быть числами"}

    try:
        paginated_products = Product.query.paginate(page=page, per_page=per_page, error_out=False)
        products = paginated_products.items
        return {
            "products": [{"id": p.id, "name": p.name, "quantity": p.quantity} for p in products],
            "has_more": paginated_products.has_next
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@jsonrpc.method('App.createOrder')
#Функция создания заказа
def create_order(user_id: int, product_ids: list) -> dict:
    order = Order(user_id=user_id, paid=False)
    for pid in product_ids:
        product = Product.query.get(pid)
        if product and product.quantity > 0:
            order.products.append(product)
            product.quantity -= 1  # Уменьшаем количество товара на складе
    db.session.add(order)
    db.session.commit()
    return {"status": "success", "message": "Заказ создан"}

@jsonrpc.method('App.payOrder')
def pay_order(order_id: int) -> dict:
    order = Order.query.get(order_id)
    if order and not order.paid:
        order.paid = True
        db.session.commit()
        return {"status": "success", "message": "Заказ оплачен"}
    return {"status": "error", "message": "Заказ не найден или оплачен"}

@jsonrpc.method('App.getProducts')
#Функция выводящая все продукты из базы даных
def get_products() -> list:
    products = Product.query.all()
    return [{"id": p.id, "name": p.name, "quantity": p.quantity} for p in products]

@jsonrpc.method('App.updateOrderStatus')
def update_order_status_api(order_id: int, new_status: str) -> dict:
    if not proverka_kladovchik(session.get('user_id')):
        return {"status": "error", "message": "Только кладовщик может менять заказ"}
    order = Order.query.get(order_id)
    if order:
        order.status = new_status
        db.session.commit()
        return {"status": "success", "message": "Статус заказа обнавлён"}
    return {"status": "error", "message": "Заказ не найден"}

@jsonrpc.method('App.addToInvoice')
def add_to_invoice(user_id: int, product_name: str, quantity: int) -> dict:
    try:
        # Проверка пользователя
        user = User.query.get(user_id)
        if not user:
            return {"status": "error", "message": "Пользователь не найден"}

        # Проверка продукта
        product = Product.query.filter_by(name=product_name).first()
        if not product:
            return {"status": "error", "message": "Продукт не найден"}


        # Проверка наличия товара на складе
        if quantity <= 0 or quantity > product.quantity:
            return {"status": "error", "message": "Некорректное количество товара"}

        # Проверка или создание накладной
        invoice = Invoice.query.filter_by(user_id=user_id, finalized=False).first()
        if not invoice:
            invoice = Invoice(user_id=user_id, finalized=False)
            db.session.add(invoice)

        # Добавление или обновление продукта в накладной
        invoice_item = InvoiceItem.query.filter_by(invoice_id=invoice.id, product_id=product.id).first()
        if invoice_item:
            invoice_item.quantity += quantity
        else:
            invoice_item = InvoiceItem(invoice_id=invoice.id, product_id=product.id, quantity=quantity)
            db.session.add(invoice_item)

        # Обновление количества на складе и зарезервированного количества
        product.quantity -= quantity
        product.reserved += quantity

        # Сохранение изменений
        db.session.commit()
        return {"status": "success", "message": "Товар добавлен в накладную"}

    except Exception as e:
        db.session.rollback()
        return {"status": "error", "message": str(e)}


@jsonrpc.method('App.adjustProductQuantity')
def adjust_product_quantity(product_id: int, quantity: int) -> dict:
    product = Product.query.get(product_id)
    if product:
        product.quantity -= quantity
        db.session.commit()
        return {"status": "success", "message": "Количество продукта изменено"}
    return {"status": "error", "message": "Продукт не найден"}

@jsonrpc.method('App.viewOrders')
def view_orders() -> dict:
    if not proverka_kladovchik(session.get('user_id')):
        return {"status": "error", "message": "Только кладовщик может смотреть заказы."}
    all_orders = Order.query.all()
    orders_data = [{"id": order.id, "status": order.status} for order in all_orders]
    return {"status": "success", "orders": orders_data}

@jsonrpc.method('App.removeFromInvoice')
def remove_from_invoice(invoice_item_id: int) -> dict:
    invoice_item = InvoiceItem.query.get(invoice_item_id)
    if invoice_item:
        db.session.delete(invoice_item)
        db.session.commit()
        return {"status": "success", "message": "Убран из накладной"}
    return {"status": "error", "message": "Не найден"}


@jsonrpc.method('App.getInvoiceItems')
def get_invoice_items(user_id: int) -> dict:
    invoice = Invoice.query.filter_by(user_id=user_id, finalized=False).first()
    if invoice:
        items = InvoiceItem.query.filter_by(invoice_id=invoice.id).all()
        return {"status": "success", "items": [{"productName": Product.query.get(item.product_id).name, "quantity": item.quantity} for item in items]}
    return {"status": "error", "message": "Нету активного итема для накладной"}

@jsonrpc.method('App.finalizeInvoice')
def finalize_invoice(user_id: int) -> dict:
    try:
        # Получение накладной пользователя
        invoice = Invoice.query.filter_by(user_id=user_id, finalized=False).first()
        if not invoice:
            return {"status": "error", "message": "Активная накладная не найдена"}

        # Создание нового заказа
        order = Order(user_id=user_id, status='Не оплачен')

        # Перемещение товаров из накладной в заказ
        for item in invoice.items:
            product = Product.query.get(item.product_id)

            # Проверка и установка значения по умолчанию для 'reserved', если оно None
            if product.reserved is None:
                product.reserved = 0

            if product and item.quantity <= product.reserved:
                # Уменьшение количества зарезервированных товаров
                product.reserved -= item.quantity
                # Добавление товара в заказ
                order.products.append(product)
            else:
                db.session.rollback()
                return {"status": "error", "message": f"Недостаточно товара на складе для {product.name}"}

        # Завершение накладной
        invoice.finalized = True
   # Сохранение изменений
        db.session.add(order)
        db.session.commit()

        return {"status": "success", "message": "Накладная завершена, заказ создан"}

    except Exception as e:
        db.session.rollback()
        return {"status": "error", "message": str(e)}

@jsonrpc.method('App.getOrderDetails')
def get_order_details(order_id: int) -> dict:
    try:
        order = Order.query.get(order_id)
        if not order:
            return {"status": "error", "message": "Заказ не найден"}

        product_details = []

        # Проходим по всем продуктам в заказе
        for product in order.products:
            # Находим все элементы накладной для этого продукта
            invoice_items = InvoiceItem.query.filter_by(product_id=product.id).all()

            total_quantity = 0
            # Считаем общее количество продукта из всех накладных
            for item in invoice_items:
                total_quantity += item.quantity

            product_details.append({
                "id": product.id,
                "name": product.name,
                "quantity": total_quantity  # Общее количество из накладных
            })

        return {
            "status": "success",
            "order_id": order_id,
            "products": product_details
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.route('/')
def index():
    user_role = None
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        user_role = user.role if user else None
    return render_template('index.html', user_role=user_role)

@app.route('/admin')
def admin_panel():
    if not is_admin(session.get('user_id')):
        return redirect(url_for('login_page'))
    return render_template('admin_panel.html')

@app.route('/products')
def product_page():
    if not session.get('user_id') or not proverka_kladovchik(session.get('user_id')):
        return redirect(url_for('login_page'))  
    
    user_id = session.get('user_id')
    return render_template('products.html', user_id=user_id)

@app.route('/orders')
def order_page():
    if not session.get('user_id') or not proverka_kladovchik(session.get('user_id')):
        return redirect(url_for('login_page'))  

    user_id = session.get('user_id')
    return render_template('orders.html', user_id=user_id)

@app.route('/invoice')
def invoice_page():
    if not session.get('user_id') or not proverka_kladovchik(session.get('user_id')):
        return redirect(url_for('login_page'))  
    user_id = session.get('user_id')
    return render_template('invoice.html', user_id=user_id)


@app.route('/login')
def login_page():
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('user_id', None)  # Убираем из сессии
    return redirect(url_for('login_page'))


if __name__ == '__main__':
    app.run(debug=True)
    