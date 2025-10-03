// js/firebase.js
class FirebaseService {
    constructor() {
        this.database = firebase.database();
    }

    // حفظ منتج جديد
    async addProduct(product) {
        try {
            const newProductRef = this.database.ref('products').push();
            await newProductRef.set({
                ...product,
                id: newProductRef.key,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
            return { success: true, id: newProductRef.key };
        } catch (error) {
            console.error('Error adding product:', error);
            return { success: false, error: error.message };
        }
    }

    // جلب جميع المنتجات
    async getProducts() {
        try {
            const snapshot = await this.database.ref('products').once('value');
            const products = snapshot.val();
            return products ? Object.values(products) : [];
        } catch (error) {
            console.error('Error getting products:', error);
            return [];
        }
    }

    // تحديث منتج
    async updateProduct(productId, updatedData) {
        try {
            await this.database.ref(`products/${productId}`).update(updatedData);
            return { success: true };
        } catch (error) {
            console.error('Error updating product:', error);
            return { success: false, error: error.message };
        }
    }

    // حذف منتج
    async deleteProduct(productId) {
        try {
            await this.database.ref(`products/${productId}`).remove();
            return { success: true };
        } catch (error) {
            console.error('Error deleting product:', error);
            return { success: false, error: error.message };
        }
    }

    // جلب طلبات التوصيل
    async getDeliveryOrders() {
        try {
            const snapshot = await this.database.ref('deliveryOrders').once('value');
            const orders = snapshot.val();
            return orders ? Object.values(orders) : [];
        } catch (error) {
            console.error('Error getting orders:', error);
            return [];
        }
    }

    // إضافة طلب توصيل جديد
    async addDeliveryOrder(order) {
        try {
            const newOrderRef = this.database.ref('deliveryOrders').push();
            await newOrderRef.set({
                ...order,
                id: newOrderRef.key,
                status: 'pending',
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
            return { success: true, id: newOrderRef.key };
        } catch (error) {
            console.error('Error adding order:', error);
            return { success: false, error: error.message };
        }
    }
}

// إنشاء instance من الخدمة
const firebaseService = new FirebaseService();

