      // js/admin.js - النسخة المحدثة مع Firebase
document.addEventListener('DOMContentLoaded', function() {
    const productForm = document.getElementById('productForm');
    const productsList = document.getElementById('productsList');
    const ordersList = document.getElementById('ordersList');

    // تحميل المنتجات عند فتح الصفحة
    loadProducts();
    loadOrders();

    // إضافة منتج جديد
    productForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const productData = {
            name: document.getElementById('productName').value,
            price: document.getElementById('productPrice').value,
            image: document.getElementById('productImage').value,
            category: document.getElementById('productCategory').value,
            description: document.getElementById('productDescription').value
        };

        const result = await firebaseService.addProduct(productData);
        if (result.success) {
            alert('تم إضافة المنتج بنجاح!');
            productForm.reset();
            loadProducts(); // إعادة تحميل القائمة
        } else {
            alert('خطأ في إضافة المنتج: ' + result.error);
        }
    });

    // تحميل وعرض المنتجات
    async function loadProducts() {
        const products = await firebaseService.getProducts();
        displayProducts(products);
    }

    function displayProducts(products) {
        productsList.innerHTML = '';
        
        products.forEach(product => {
            const productItem = document.createElement('div');
            productItem.className = 'product-item';
            productItem.innerHTML = `
                <img src="${product.image}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>${product.price}</p>
                <p>${product.category}</p>
                <button onclick="editProduct('${product.id}')">تعديل</button>
                <button onclick="deleteProduct('${product.id}')">حذف</button>
            `;
            productsList.appendChild(productItem);
        });
    }

    // تحميل وعرض طلبات التوصيل
    async function loadOrders() {
        const orders = await firebaseService.getDeliveryOrders();
        displayOrders(orders);
    }

    function displayOrders(orders) {
        ordersList.innerHTML = '';
        
        orders.forEach(order => {
            const orderItem = document.createElement('div');
            orderItem.className = 'order-item';
            orderItem.innerHTML = `
                <h3>طلب من: ${order.customerName}</h3>
                <p>الهاتف: ${order.phone}</p>
                <p>العنوان: ${order.address}</p>
                <p>المنتجات: ${order.products}</p>
                <p>الحالة: ${order.status}</p>
                <button onclick="updateOrderStatus('${order.id}', 'completed')">تم التوصيل</button>
            `;
            ordersList.appendChild(orderItem);
        });
    }
});

// دوال عامة للتعديل والحذف
async function deleteProduct(productId) {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
        const result = await firebaseService.deleteProduct(productId);
        if (result.success) {
            alert('تم حذف المنتج بنجاح');
            location.reload();
        } else {
            alert('خطأ في حذف المنتج');
        }
    }
}

async function updateOrderStatus(orderId, status) {
    const result = await firebaseService.updateOrderStatus(orderId, status);
    if (result.success) {
        alert('تم تحديث حالة الطلب');
        location.reload();
    }
}  
       

 
            
