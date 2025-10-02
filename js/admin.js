
class AdminPanel {
    constructor() {
        this.products = [];
        this.deliveryPrices = {};
        this.colors = [];
        this.sizeChart = [];
        this.currentTab = 'products';
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupTabs();
        this.renderProducts();
        this.renderDeliveryPrices();
        this.renderColors();
        this.renderSizeOptions();
        this.renderColorOptions();
        this.setupEvents();
    }

    async loadData() {
        try {
            const [productsRes, deliveryRes] = await Promise.all([
                fetch('data/products.json'),
                fetch('data/delivery.json')
            ]);
            
            const productsData = await productsRes.json();
            this.products = productsData.products || [];
            this.colors = productsData.colors || [];
            this.sizeChart = productsData.sizeChart || [];
            
            const deliveryData = await deliveryRes.json();
            this.deliveryPrices = deliveryData.deliveryPrices || {};
        } catch (error) {
            console.error('Error loading data:', error);
            this.loadDefaultData();
        }
    }

    loadDefaultData() {
        this.products = defaultProducts.products || [];
        this.colors = defaultProducts.colors || [];
        this.sizeChart = defaultProducts.sizeChart || [];
        this.deliveryPrices = defaultDeliveryPrices.deliveryPrices || {};
    }

    setupTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.getAttribute('data-tab');
                
                // تحديث الأزرار
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // تحديث المحتوى
                tabContents.forEach(content => content.classList.remove('active'));
                document.getElementById(tabName).classList.add('active');
                
                this.currentTab = tabName;
            });
        });
    }

    setupEvents() {
        // أحداث المنتجات
        document.getElementById('productForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct();
        });

        // أحداث أسعار التوصيل
        document.getElementById('deliveryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveDeliveryPrice();
        });

        // أحداث الألوان
        document.getElementById('colorForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveColor();
        });
    }

    // إدارة المنتجات
    saveProduct() {
        const productId = document.getElementById('productId').value;
        const selectedColors = this.getSelectedColors();
        const selectedSizes = this.getSelectedSizes();

        const product = {
            id: productId || Date.now(),
            name: document.getElementById('productName').value,
            image: document.getElementById('productImage').value,
            price: parseInt(document.getElementById('productPrice').value),
            description: document.getElementById('productDescription').value,
            active: document.getElementById('productActive').checked,
            colors: selectedColors,
            sizes: selectedSizes
        };

        if (!productId) {
            // منتج جديد
            this.products.push(product);
        } else {
            // تعديل منتج موجود
            const index = this.products.findIndex(p => p.id == productId);
            if (index !== -1) {
                this.products[index] = product;
            }
        }

        this.saveAllData();
        this.renderProducts();
        this.resetProductForm();
        this.showAlert('تم حفظ المنتج بنجاح', 'success', 'productAlert');
    }

    getSelectedColors() {
        const selected = [];
        const colorCheckboxes = document.querySelectorAll('#productColors input[type="checkbox"]:checked');
        colorCheckboxes.forEach(checkbox => {
            selected.push(checkbox.value);
        });
        return selected;
    }

    getSelectedSizes() {
        const selected = [];
        const sizeCheckboxes = document.querySelectorAll('#productSizes input[type="checkbox"]');
        sizeCheckboxes.forEach(checkbox => {
            selected.push({
                size: checkbox.value,
                age: checkbox.getAttribute('data-age'),
                available: checkbox.checked
            });
        });
        return selected;
    }

    editProduct(id) {
        const product = this.products.find(p => p.id == id);
        if (product) {
            document.getElementById('productId').value = product.id;
            document.getElementById('productName').value = product.name;
            document.getElementById('productImage').value = product.image;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productDescription').value = product.description;
            document.getElementById('productActive').checked = product.active;

            // تحديد الألوان
            const colorCheckboxes = document.querySelectorAll('#productColors input[type="checkbox"]');
            colorCheckboxes.forEach(checkbox => {
                checkbox.checked = product.colors.includes(checkbox.value);
            });

            // تحديد المقاسات
            const sizeCheckboxes = document.querySelectorAll('#productSizes input[type="checkbox"]');
            sizeCheckboxes.forEach(checkbox => {
                const sizeInfo = product.sizes.find(s => s.size === checkbox.value);
                checkbox.checked = sizeInfo ? sizeInfo.available : false;
            });

            // التمرير للأعلى
            document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
        }
    }

    deleteProduct(id) {
        if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
            this.products = this.products.filter(p => p.id != id);
            this.saveAllData();
            this.renderProducts();
            this.showAlert('تم حذف المنتج بنجاح', 'success', 'productAlert');
        }
    }

    resetProductForm() {
        document.getElementById('productForm').reset();
        document.getElementById('productId').value = '';
    }

    // إدارة أسعار التوصيل
    saveDeliveryPrice() {
        const wilaya = document.getElementById('wilayaName').value;
        const homePrice = parseInt(document.getElementById('homePrice').value);
        const deskPrice = parseInt(document.getElementById('deskPrice').value);

        this.deliveryPrices[wilaya] = {
            home: homePrice,
            desk: deskPrice
        };

        this.saveAllData();
        this.renderDeliveryPrices();
        this.resetDeliveryForm();
        this.showAlert('تم حفظ سعر التوصيل بنجاح', 'success', 'deliveryAlert');
    }

    editDeliveryPrice(wilaya) {
        const prices = this.deliveryPrices[wilaya];
        if (prices) {
            document.getElementById('wilayaName').value = wilaya;
            document.getElementById('homePrice').value = prices.home;
            document.getElementById('deskPrice').value = prices.desk;
        }
    }

    deleteDeliveryPrice(wilaya) {
        if (confirm('هل أنت متأكد من حذف سعر التوصيل لهذه الولاية؟')) {
            delete this.deliveryPrices[wilaya];
            this.saveAllData();
            this.renderDeliveryPrices();
            this.showAlert('تم حذف سعر التوصيل بنجاح', 'success', 'deliveryAlert');
        }
    }

    resetDeliveryForm() {
        document.getElementById('deliveryForm').reset();
    }

    // إدارة الألوان
    saveColor() {
        const colorName = document.getElementById('colorName').value;
        const colorValue = document.getElementById('colorValue').value;

        // التحقق من عدم تكرار اللون
        const existingColor = this.colors.find(c => c.name === colorName);
        if (existingColor) {
            this.showAlert('هذا اللون موجود مسبقاً', 'error', 'colorsAlert');
            return;
        }

        this.colors.push({
            name: colorName,
            value: colorValue
        });

        this.saveAllData();
        this.renderColors();
        this.renderColorOptions();
        this.resetColorForm();
        this.showAlert('تم إضافة اللون بنجاح', 'success', 'colorsAlert');
    }

    deleteColor(colorName) {
        if (confirm('هل أنت متأكد من حذف هذا اللون؟')) {
            this.colors = this.colors.filter(c => c.name !== colorName);
            this.saveAllData();
            this.renderColors();
            this.renderColorOptions();
            this.showAlert('تم حذف اللون بنجاح', 'success', 'colorsAlert');
        }
    }

    resetColorForm() {
        document.getElementById('colorForm').reset();
    }

    // التصيير
    renderProducts() {
        const container = document.getElementById('productsList');
        container.innerHTML = this.products.map(product => `
            <div class="item-card">
                <div class="item-header">
                    <h3>${product.name} - ${product.price} دج</h3>
                    <div class="item-actions">
                        <button class="btn btn-primary btn-sm" onclick="admin.editProduct(${product.id})">تعديل</button>
                        <button class="btn btn-secondary btn-sm" onclick="admin.deleteProduct(${product.id})">حذف</button>
                    </div>
                </div>
                <p><strong>الصورة:</strong> ${product.image}</p>
                <p><strong>الوصف:</strong> ${product.description}</p>
                <p><strong>الحالة:</strong> ${product.active ? 'نشط' : 'غير نشط'}</p>
                <p><strong>الألوان:</strong> ${product.colors.join(', ')}</p>
                <p><strong>المقاسات المتاحة:</strong> 
                    ${product.sizes.filter(s => s.available).map(s => s.size).join(', ')}
                </p>
            </div>
        `).join('');
    }

    renderDeliveryPrices() {
        const container = document.getElementById('deliveryList');
        container.innerHTML = Object.entries(this.deliveryPrices).map(([wilaya, prices]) => `
            <div class="item-card">
                <div class="item-header">
                    <h3>${wilaya}</h3>
                    <div class="item-actions">
                        <button class="btn btn-primary btn-sm" onclick="admin.editDeliveryPrice('${wilaya}')">تعديل</button>
                        <button class="btn btn-secondary btn-sm" onclick="admin.deleteDeliveryPrice('${wilaya}')">حذف</button>
                    </div>
                </div>
                <p><strong>التوصيل للمنزل:</strong> ${prices.home} دج</p>
                <p><strong>التوصيل للمكتب:</strong> ${prices.desk} دج</p>
            </div>
        `).join('');
    }

    renderColors() {
        const container = document.getElementById('colorsList');
        container.innerHTML = this.colors.map(color => `
            <div class="item-card">
                <div class="item-header">
                    <h3>
                        <span class="color-preview" style="background-color: ${color.value}"></span>
                        ${color.name}
                    </h3>
                    <div class="item-actions">
                        <button class="btn btn-secondary btn-sm" onclick="admin.deleteColor('${color.name}')">حذف</button>
                    </div>
                </div>
                <p><strong>كود اللون:</strong> ${color.value}</p>
            </div>
        `).join('');
    }

    renderColorOptions() {
        const container = document.getElementById('productColors');
        container.innerHTML = this.colors.map(color => `
            <label style="display: inline-block; margin: 0.5rem;">
                <span class="color-preview" style="background-color: ${color.value}"></span>
                <input type="checkbox" value="${color.name}" style="margin-right: 0.5rem;">
                ${color.name}
            </label>
        `).join('');
    }

    renderSizeOptions() {
        const container = document.getElementById('productSizes');
        container.innerHTML = this.sizeChart.map(size => `
            <label style="display: inline-block; margin: 0.5rem;">
                <input type="checkbox" value="${size.size}" data-age="${size.age}" style="margin-right: 0.5rem;">
                ${size.size} (${size.age})
            </label>
        `).join('');
    }

    // الحفظ
    async saveAllData() {
        const productsData = {
            products: this.products,
            colors: this.colors,
            sizeChart: this.sizeChart
        };

        const deliveryData = {
            deliveryPrices: this.deliveryPrices
        };

        await this.saveToFile('data/products.json', productsData);
        await this.saveToFile('data/delivery.json', deliveryData);
    }

    async saveToFile(filename, data) {
        // في بيئة حقيقية، هنا نرسل البيانات للسيرفر
        // للتبسيط، سنستخدم localStorage للتخزين المؤقت
        localStorage.setItem(filename, JSON.stringify(data, null, 2));
        console.log('تم الحفظ في:', filename);
        
        // يمكنك إضافة كود لإرسال البيانات للسيرفر هنا
        try {
            // مثال باستخدام Fetch API لإرسال البيانات للسيرفر
            // await fetch('/api/save-data', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ filename, data })
            // });
        } catch (error) {
            console.error('Error saving to server:', error);
        }
    }

    // التنبيهات
    showAlert(message, type, containerId) {
        const container = document.getElementById(containerId);
        const alertClass = type === 'success' ? 'alert-success' : 'alert-error';
        
        container.innerHTML = `
            <div class="alert ${alertClass}">
                ${message}
            </div>
        `;
        
        setTimeout(() => {
            container.innerHTML = '';
        }, 3000);
    }
}

// تهيئة لوحة التحكم
const admin = new AdminPanel();
