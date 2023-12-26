from app import app, db 
from models import Product

products = [
    Product(name=f"Product {i}", quantity=100, reserved=0) for i in range(1, 110)
]

with app.app_context():
    # Удаляем все прошлые продукты
    # db.drop_all()
    db.create_all()
    db.session.bulk_save_objects(products)
    db.session.commit()

    print("Products сделаны.")