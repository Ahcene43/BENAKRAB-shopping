// js/data.js
// بيانات افتراضية ومدير بيانات بسيط (يتوقع وجود firebase SDK قبل هذا الملف)

// بيانات افتراضية للطوارئ
const defaultProducts = {
  "products": [
    {
      "id": 1,
      "name": "مودال أنيق للفتيات",
      "image": "images/modal1.jpg",
      "price": 3300,
      "description": "تصميم مريح وعصري مع تفاصيل راقية تناسب جميع المناسبات",
      "active": true,
      "colors": ["أبيض", "زهري", "أحمر", "أزرق فاتح"],
      "sizes": [
        { "size": "S1", "age": "6-7 سنوات", "available": true },
        { "size": "S2", "age": "8-9 سنوات", "available": true },
        { "size": "S3", "age": "10-11 سنوات", "available": true },
        { "size": "S4", "age": "12-13 سنوات", "available": true }
      ]
    },
    {
      "id": 2,
      "name": "مودال احتفالي فاخر",
      "image": "images/modal2.jpg",
      "price": 3300,
      "description": "تصميم عملي وأنيق مع خامات عالية الجودة تدوم طويلا",
      "active": true,
      "colors": ["أسود", "أبيض", "رمادي", "أزرق"],
      "sizes": [
        { "size": "S1", "age": "6-7 سنوات", "available": true },
        { "size": "S2", "age": "8-9 سنوات", "available": true },
        { "size": "S3", "age": "10-11 سنوات", "available": true },
        { "size": "S4", "age": "12-13 سنوات", "available": false }
      ]
    }
  ],
  "colors": [
    { "name": "أبيض", "value": "#FFFFFF" },
    { "name": "أسود", "value": "#000000" },
    { "name": "رمادي", "value": "#808080" },
    { "name": "أزرق", "value": "#0000FF" },
    { "name": "أحمر", "value": "#FF0000" },
    { "name": "أخضر", "value": "#008000" },
    { "name": "زهري", "value": "#FFC0CB" },
    { "name": "بنفسجي", "value": "#800080" },
    { "name": "أزرق فاتح", "value": "#ADD8E6" }
  ],
  "sizeChart": [
    { "size": "S1", "age": "6-7 سنوات", "height": "110-120 cm", "chest": "58-60 cm" },
    { "size": "S2", "age": "8-9 سنوات", "height": "125-135 cm", "chest": "62-64 cm" },
    { "size": "S3", "age": "10-11 سنوات", "height": "140-150 cm", "chest": "66-68 cm" },
    { "size": "S4", "age": "12-13 سنوات", "height": "155-165 cm", "chest": "70-72 cm" }
  ]
};

const defaultDeliveryPrices = {
  "deliveryPrices": {
    "الجزائر": { "home": 500, "desk": 250 },
    "وهران": { "home": 800, "desk": 400 }
  }
};

// دوال المودال/المقاس
function getSize(age) {
  if (age >= 6 && age <= 7) return "S1";
  if (age >= 8 && age <= 9) return "S2";
  if (age >= 10 && age <= 11) return "S3";
  if (age >= 12 && age <= 13) return "S4";
  return "غير متوفر";
}

function getSizeDetails(size) {
  const sizeChart = defaultProducts.sizeChart;
  return sizeChart.find(item => item.size === size) || {};
}

// FirebaseDataManager (بسيط)
class FirebaseDataManager {
  constructor() {
    if (typeof firebase === 'undefined') {
      console.warn('Firebase SDK غير معرفة — سيتم استعمال البيانات الافتراضية.');
      this.database = null;
      this.productsRef = null;
      this.ordersRef = null;
      return;
    }
    this.database = firebase.database();
    this.productsRef = this.database.ref('products');
    this.ordersRef = this.database.ref('orders');
  }

  async getProducts() {
    if (!this.productsRef) {
      // لا Firebase — استخدم الافتراضي
      return defaultProducts.products;
    }
    try {
      const snapshot = await this.productsRef.once('value');
      const products = snapshot.val();
      return products ? Object.keys(products).map(key => ({ id: key, ...products[key] })) : [];
    } catch (error) {
      console.error('Error getting products:', error);
      return defaultProducts.products;
    }
  }

  async addOrder(order) {
    if (!this.ordersRef) {
      console.warn('Firebase غير متاحة — addOrder لن يرسل إلى DB.');
      return { success: false, error: 'Firebase غير مهيأ' };
    }
    try {
      const newOrderRef = this.ordersRef.push();
      await newOrderRef.set({
        ...order,
        id: newOrderRef.key,
        status: 'pending',
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        date: new Date().toLocaleString('ar-EG')
      });
      return { success: true, id: newOrderRef.key };
    } catch (error) {
      console.error('Error adding order:', error);
      return { success: false, error: error.message };
    }
  }
}

// instance جاهز
const dataManager = new FirebaseDataManager();
