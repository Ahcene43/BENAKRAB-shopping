// admin.js
// UI logic for the admin/orders page.
// Assumes a global `firebaseService` instance exists (see js/firebase.js).
// This file avoids innerHTML for safety and uses event listeners.

(function () {
  'use strict';

  // DOM container
  const ordersListEl = document.getElementById('ordersList');
  if (!ordersListEl) {
    console.error('admin.js: #ordersList element not found.');
    return;
  }

  // Ensure firebaseService is available
  if (!window.firebaseService || typeof window.firebaseService.getDeliveryOrders !== 'function') {
    console.error('admin.js: window.firebaseService not found. Make sure js/firebase.js is loaded before admin.js');
    // show friendly message in UI
    ordersListEl.textContent = 'خطأ: لم يتم تهيئة الخدمة. تواصل مع المطور.';
    return;
  }

  // Utility: create a <p> with an emoji prefix and text
  function createInfoParagraph(prefix, text) {
    const p = document.createElement('p');
    p.textContent = `${prefix} ${text}`;
    return p;
  }

  // Create DOM element for a single order
  function createOrderElement(order) {
    const container = document.createElement('div');
    container.className = 'order-item';

    // Safe fallbacks
    const customerName = order.customerName || 'غير محدد';
    const phone = order.phone || 'غير محدد';
    const address = order.address || 'غير محدد';
    const products = order.products || 'غير محدد';
    const status = order.status || 'pending';
    const dateText = order.createdAt ? new Date(order.createdAt).toLocaleString('ar-EG') : 'غير محدد';

    // Header
    const h3 = document.createElement('h3');
    h3.textContent = `👤 ${customerName}`;
    container.appendChild(h3);

    // Info lines
    container.appendChild(createInfoParagraph('📞', phone));
    container.appendChild(createInfoParagraph('📍', address));
    container.appendChild(createInfoParagraph('📦', products));

    // Status and date
    const statusP = document.createElement('p');
    statusP.className = `status-${status}`;
    statusP.textContent = `🔄 الحالة: ${status === 'pending' ? 'قيد الانتظار' : 'مكتمل'}`;
    container.appendChild(statusP);

    container.appendChild(createInfoParagraph('📅', dateText));

    // Actions
    const actions = document.createElement('div');
    actions.className = 'order-actions';

    // Complete / revert button depending on current status
    if (status === 'pending') {
      const completeBtn = document.createElement('button');
      completeBtn.type = 'button';
      completeBtn.textContent = '✅ تم التوصيل';
      completeBtn.addEventListener('click', async () => {
        await updateOrderStatus(order.id, 'completed');
      });
      actions.appendChild(completeBtn);
    } else {
      const revertBtn = document.createElement('button');
      revertBtn.type = 'button';
      revertBtn.textContent = '↩️ إعادة إلى قيد الانتظار';
      revertBtn.addEventListener('click', async () => {
        await updateOrderStatus(order.id, 'pending');
      });
      actions.appendChild(revertBtn);
    }

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.textContent = '🗑️ حذف الطلب';
    deleteBtn.addEventListener('click', async () => {
      const ok = confirm('هل تريد حقًا حذف هذا الطلب؟');
      if (!ok) return;
      try {
        const res = await window.firebaseService.deleteOrder(order.id);
        if (res && res.success) {
          await loadDeliveryOrders();
        } else {
          alert('حدث خطأ أثناء حذف الطلب: ' + (res && res.error ? res.error : 'Unknown'));
        }
      } catch (err) {
        console.error('deleteOrder error', err);
        alert('حدث خطأ غير متوقع أثناء حذف الطلب.');
      }
    });
    actions.appendChild(deleteBtn);

    container.appendChild(actions);

    return container;
  }

  // Render the orders list
  function renderOrders(orders) {
    // Clear list
    ordersListEl.innerHTML = '';
    if (!Array.isArray(orders) || orders.length === 0) {
      ordersListEl.textContent = 'لا توجد طلبات.';
      return;
    }

    const frag = document.createDocumentFragment();
    orders.forEach(order => {
      const el = createOrderElement(order);
      frag.appendChild(el);
    });
    ordersListEl.appendChild(frag);
  }

  // Load orders from Firebase service and render
  async function loadDeliveryOrders() {
    try {
      ordersListEl.textContent = 'جاري التحميل...';
      const orders = await window.firebaseService.getDeliveryOrders();
      renderOrders(orders);
    } catch (err) {
      console.error('loadDeliveryOrders error', err);
      ordersListEl.textContent = 'حدث خطأ أثناء تحميل الطلبات.';
    }
  }

  // Update order status then refresh list
  async function updateOrderStatus(orderId, status) {
    try {
      const res = await window.firebaseService.updateOrderStatus(orderId, status);
      if (res && res.success) {
        await loadDeliveryOrders();
      } else {
        alert('خطأ عند تحديث حالة الطلب: ' + (res && res.error ? res.error : 'Unknown'));
      }
    } catch (err) {
      console.error('updateOrderStatus error', err);
      alert('حدث خطأ غير متوقع أثناء تحديث الحالة.');
    }
  }

  // Expose function for debugging or inline use if needed
  window.adminLoadDeliveryOrders = loadDeliveryOrders;
  window.adminUpdateOrderStatus = updateOrderStatus;

  // Initial load when DOM is ready
  document.addEventListener('DOMContentLoaded', loadDeliveryOrders);
})();
