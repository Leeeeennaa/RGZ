from app import app, db 
from models import Product

# Делаем кучу продуктов
products = [
    Product(name=f"Product {i}", quantity=100) for i in range(1, 110)
]

with app.app_context():
    db.session.bulk_save_objects(products)
    db.session.commit()
    print("Продукты сделаны")
