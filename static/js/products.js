let currentPage = 1; // Текущая страница
const perPage = 50;  // Товаров на страницу

function renderProduct(product) {
    return `<div>${product.name} - Quantity: ${product.quantity} 
                <button onclick="deleteProduct(${product.id})">Удалить</button>
            </div>`;
}

// Загрузка страницы с товарами 
function loadProducts(page) {
    const productsList = document.getElementById('productsList');
    if (!productsList) {
        console.error('Продукт лист div не найден.');
        return;
    }
    
    jsonRpcRequest('/api', 'App.getProductsPaginated', {page: page, per_page: perPage}, function(response) {        
        if (response && Array.isArray(response.products)) {
            response.products.forEach(product => {
                productsList.innerHTML += renderProduct(product);  // Добавляем новые продукты к существующему списку
            });

            if (response.has_more) {
                document.getElementById('moreButton').style.display = 'block';
            } else {
                document.getElementById('moreButton').style.display = 'none';
            }
        } else {
            console.error('Ошибка загрузки товаров:', response);
            productsList.innerHTML += '<p>Ошибка загрузи</p>';  // Добавляем сообщение об ошибке к существующему списку
        }
    });
}


function loadMoreProducts() {
    loadProducts(++currentPage);
}

function addOrUpdateProduct(name, quantity) {
    jsonRpcRequest('/api', 'App.addOrUpdateProduct', {name: name, quantity: parseInt(quantity)}, function(response) {
        if (response && response.status === 'success') {
            alert('Продукт изменён!');
            // Перезагружаем все продукты, чтобы отразить изменения
            currentPage = 1; // Сброс текущей страницы на первую
            document.getElementById('productsList').innerHTML = ''; // Очистка списка продуктов
            loadProducts(currentPage); // Перезагрузка продуктов
        } else {
            console.error('Ошибка добавления:', response);
            alert('Ошибка изменения продукта.');
        }
    });
}


function deleteProduct(productId) {
    jsonRpcRequest('/api', 'App.deleteProduct', {product_id: productId}, function(response) {
        if (response && response.status === 'success') {
            alert('Продукт удалён!');
            loadProducts(currentPage); 
        } else {
            console.error('Ошибка удаления:', response);
            alert('Ошибка удаления');
        }
    });
}

// На загрузку страницы добавляем вызов функции
document.addEventListener('DOMContentLoaded', function() {
    loadProducts(currentPage);
});
