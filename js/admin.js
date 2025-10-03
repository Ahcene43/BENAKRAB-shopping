// js/admin.js
// واجهة بسيطة لإدارة الطلبات والمنتجات (يُحمّل بعد js/firebase.js)

(function () {
  'use strict';
  const ordersListEl = document.getElementById('ordersList');
  const productsList = document.getElementById('productsList');
  const productForm = document.getElementById('productForm');

  if (!ordersListEl) return;

  if (!window.firebaseService) {
    ordersListEl.textContent = 'Firebase غير مهيأ، الرجاء تحميل firebase.js أولاً.';
    return;
  }

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  function renderOrders(orders) {
    ordersListEl.innerHTML = '';
    if (!orders || !orders.length) { ordersListEl.textContent = 'لا توجد طلبات.'; return; }
    orders.forEach(order => {
      const item = document.createElement('div');
      item.className = 'order-item';
      item.innerHTML = `
        <h3>👤 ${escapeHtml(order.customerName || '')}</h3>
        <p>📞 ${escapeHtml(order.phone || '')}</p>
        <p>📍 ${escapeHtml(order.address || '')}</p>
        <p>📦 ${escapeHtml(order.products || '')}</p>
        <p class="status-${escapeHtml(order.status || 'pending')}">🔄 الحالة: ${order.status === 'pending' ? 'قيد الانتظار' : 'مكتمل'}</p>
        <div class="order-actions"></div>
      `;
      const actions = item.querySelector('.order-actions');
      if (order.status === 'pending') {
        const completeBtn = document.createElement('button');
        completeBtn.textContent = '✅ تم التوصيل';
        completeBtn.addEventListener('click', async () => {
          await window.firebaseService.updateOrderStatus(order.id, 'completed');
          loadDeliveryOrders();
        });
        actions.appendChild(completeBtn);
      } else {
        const revertBtn = document.createElement('button');
        revertBtn.textContent = '↩️ إعادة';
        revertBtn.addEventListener('click', async () => {
          await window.firebaseService.updateOrderStatus(order.id, 'pending');
          loadDeliveryOrders();
        });
        actions.appendChild(revertBtn);
      }
      const delBtn = document.createElement('button');
      delBtn.textContent = '🗑️ حذف الطلب';
      delBtn.addEventListener('click', async () => {
        if (!confirm('هل تريد حذف هذا الطلب؟')) return;
        await window.firebaseService.deleteOrder(order.id);
        loadDeliveryOrders();
      });
      actions.appendChild(delBtn);
      ordersListEl.appendChild(item);
    });
  }

  async function loadDeliveryOrders() {
    ordersListEl.textContent = 'جاري التحميل...';
    const orders = await window.firebaseService.getDeliveryOrders();
    renderOrders(orders);
  }

  async function loadProducts() {
    if (!productsList) return;
    productsList.textContent = 'جاري التحميل...';
    const products = await window.firebaseService.getProducts();
    productsList.innerHTML = '';
    products.forEach(p => {
      const div = document.createElement('div');
      div.className = 'product-item';
      div.innerHTML = `
        <img src="${p.image}" alt="${p.name}" style="max-width:120px;">
        <h3>${escapeHtml(p.name)}</h3>
        <p>${p.price} دج</p>
        <p>${escapeHtml(p.category || '')}</p>
        <button onclick="deleteProduct('${p.id}')">حذف</button>
      `;
      productsList.appendChild(div);
    });
  }

  // Expose functions globally used by inline onclicks in admin.html
  window.loadProducts = loadProducts;
  window.loadOrders = loadDeliveryOrders;
  window.deleteProduct = async function(productId) {
    if (!confirm('حذف المنتج؟')) return;
    const res = await window.firebaseService.deleteProduct(productId);
    if (res.success) loadProducts();
    else alert('خطأ في حذف المنتج');
  };

  window.updateOrderStatus = async function(orderId, status) {
    const res = await window.firebaseService.updateOrderStatus(orderId, status);
    if (res.success) loadDeliveryOrders();
    else alert('خطأ في تحديث الحالة');
  };

  // initial load
  document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    loadDeliveryOrders();
  });
})();
