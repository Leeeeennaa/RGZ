from app import app, db
from models import User
from werkzeug.security import generate_password_hash

# Данные админа
admin_name = "AdminName"
admin_login = "AdminLogin"
admin_password = "123Super_#Admin#_Password123"

# Если запустить код без этой штуки, то будет написано её добавить 
with app.app_context():
    # Хэшируем пароль и даём админу
    hashed_password = generate_password_hash(admin_password)
    new_admin = User(name=admin_name, login=admin_login, password=hashed_password, role='admin')

    # Проверка на существует ли админ
    existing_admin = User.query.filter_by(login=admin_login).first()
    if existing_admin:
        print("Aдмин существует!")
    else:
        db.session.add(new_admin)
        db.session.commit()
        print(f"Admin {admin_name} сделан.")