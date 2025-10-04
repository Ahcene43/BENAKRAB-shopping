// js/firebase.js
// تأكد من تحميل Firebase SDK قبل هذا الملف (تم في index.html)

(function () {
  // ضع هنا إعدادات المشروع الحقيقية الخاصة بك
  const firebaseConfig = {
    apiKey: "AIzaSyDp474CprMfZ95T_Y0OKsR4k5ca9VJBkZQ",
    authDomain: "benakrab43.firebaseapp.com",
    databaseURL: "https://benakrab43-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "benakrab43",
    storageBucket: "benakrab43.appspot.com",
    messagingSenderId: "751387344597",
    appId: "1:751387344597:web:0bd5328ef337ee852b2c5c" ;
  
    // Initialize Firebase (compat)
  if (!firebase.apps || !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  class FirebaseService {
    constructor() {
      this.database = firebase.database();
    }

    // Products
    async addProduct(product) {
      try {
        const newRef = this.database.ref('products').push();
        await newRef.set({
          ...product,
          id: newRef.key,
          createdAt: firebase.database.ServerValue.TIMESTAMP
        });
        return { success: true, id: newRef.key };
      } catch (err) {
        console.error('addProduct error', err);
        return { success: false, error: err.message };
      }
    }

    async getProducts() {
      try {
        const snap = await this.database.ref('products').once('value');
        const val = snap.val() || {};
        // return as array
        return Object.keys(val).map(k => ({ id: k, ...val[k] }));
      } catch (err) {
        console.error('getProducts error', err);
        return [];
      }
    }

    async updateProduct(productId, updatedData) {
      try {
        await this.database.ref(`products/${productId}`).update(updatedData);
        return { success: true };
      } catch (err) {
        console.error('updateProduct error', err);
        return { success: false, error: err.message };
      }
    }

    async deleteProduct(productId) {
      try {
        await this.database.ref(`products/${productId}`).remove();
        return { success: true };
      } catch (err) {
        console.error('deleteProduct error', err);
        return { success: false, error: err.message };
      }
    }

    // Orders (use "deliveryOrders" to be consistent with admin)
    async getDeliveryOrders() {
      try {
        const snap = await this.database.ref('deliveryOrders').once('value');
        const val = snap.val() || {};
        return Object.keys(val).map(k => ({ id: k, ...val[k] }));
      } catch (err) {
        console.error('getDeliveryOrders error', err);
        return [];
      }
    }

    async addDeliveryOrder(order) {
      try {
        const newRef = this.database.ref('deliveryOrders').push();
        await newRef.set({
          ...order,
          id: newRef.key,
          status: 'pending',
          createdAt: firebase.database.ServerValue.TIMESTAMP
        });
        return { success: true, id: newRef.key };
      } catch (err) {
        console.error('addDeliveryOrder error', err);
        return { success: false, error: err.message };
      }
    }

    async updateOrderStatus(orderId, status) {
      try {
        await this.database.ref(`deliveryOrders/${orderId}`).update({ status });
        return { success: true };
      } catch (err) {
        console.error('updateOrderStatus error', err);
        return { success: false, error: err.message };
      }
    }

    async deleteOrder(orderId) {
      try {
        await this.database.ref(`deliveryOrders/${orderId}`).remove();
        return { success: true };
      } catch (err) {
        console.error('deleteOrder error', err);
        return { success: false, error: err.message };
      }
    }
  }

  

  
  // expose instance globally
  window.firebaseService = new FirebaseService();
})();
