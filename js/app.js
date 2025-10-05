// js/app.js - الإصدار المصحح
const app = {
  pieceCount: 0,
  currentSlide: 0,
  slideInterval: null,
  products: [],
  deliveryPrices: {},
  colors: [],
  sizeChart: [],

  async loadData() {
    try {
      const productsResponse = await fetch('data/products.json');
      const productsData = await productsResponse.json();
      this.products = productsData.products.filter(product => product.active);
      this.colors = productsData.colors || [];
      this.sizeChart = productsData.sizeChart || [];

      const deliveryResponse = await fetch('data/delivery.json');
      const deliveryData = await deliveryResponse.json();
      this.deliveryPrices = deliveryData.deliveryPrices || {};

      console.log('تم تحميل البيانات بنجاح');
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
      // بيانات افتراضية
      this.products = [
        {
          id: "1",
          name: "موديل أطفال رائع",
          price: 1500,
          image: "images/modal1.jpg",
          description: "ملابس أطفال عالية الجودة",
          active: true
        }
      ];
      this.colors = [{name: "أحمر", value: "#ff0000"}];
      this.sizeChart = [{size: "S", age: "3-4 سنوات"}];
      this.deliveryPrices = {"الجزائر": {"home": 400, "desk": 300}};
    }
  },

  async init() {
    await this.loadData();
    this.initSlider();
    this.initWilayaSelect();
    this.initEvents();
    this.loadUserData();
    this.setupAutoSave();
    this.updatePrice();

    // إضافة قطعة تلقائية عند التحميل للتجربة
    setTimeout(() => {
      if (this.pieceCount === 0) {
        this.addPiece();
      }
    }, 1000);

    window.addEventListener('scroll', () => {
      const header = document.getElementById('mainHeader');
      if (window.scrollY > 50) header.classList.add('scrolled'); else header.classList.remove('scrolled');
    });

    document.getElementById('successModal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this.closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.getElementById('successModal').classList.contains('show')) {
        this.closeModal();
      }
    });
  },

  initSlider() {
    const slidesContainer = document.getElementById('slidesContainer');
    const sliderNav = document.getElementById('sliderNav');

    if (!slidesContainer || !sliderNav) return;

    slidesContainer.innerHTML = '';
    sliderNav.innerHTML = '';

    this.products.forEach((product, index) => {
      const slide = document.createElement('div');
      slide.className = `slide ${index === 0 ? 'active' : ''}`;
      slide.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="slide-image" 
             onerror="this.src='https://via.placeholder.com/400x300?text=صورة+غير+متوفرة'">
        <div class="slide-content">
          <h3 class="slide-title">${product.name}</h3>
          <p class="slide-description">${product.description}</p>
          <div class="modal-price"><i class="fas fa-tag"></i> السعر: ${product.price} دج</div>
        </div>
      `;
      slidesContainer.appendChild(slide);

      const dot = document.createElement('div');
      dot.className = `slider-dot ${index === 0 ? 'active' : ''}`;
      dot.dataset.slide = index;
      dot.addEventListener('click', () => {
        clearInterval(this.slideInterval);
        this.updateSlider(index);
        this.startSlideShow();
      });
      sliderNav.appendChild(dot);
    });

    // إصلاح أزرار السلايدر
    const prevBtn = document.getElementById('prevSlide');
    const nextBtn = document.getElementById('nextSlide');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => { 
        clearInterval(this.slideInterval); 
        this.prevSlide(); 
        this.startSlideShow(); 
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => { 
        clearInterval(this.slideInterval); 
        this.nextSlide(); 
        this.startSlideShow(); 
      });
    }

    this.startSlideShow();
  },

  startSlideShow() {
    clearInterval(this.slideInterval);
    if (!this.products || this.products.length <= 1) return;
    this.slideInterval = setInterval(() => this.nextSlide(), 5000);
  },

  nextSlide() {
    if (!this.products || !this.products.length) return;
    this.currentSlide = (this.currentSlide + 1) % this.products.length;
    this.updateSlider(this.currentSlide);
  },

  prevSlide() {
    if (!this.products || !this.products.length) return;
    this.currentSlide = (this.currentSlide - 1 + this.products.length) % this.products.length;
    this.updateSlider(this.currentSlide);
  },

  updateSlider(slideIndex) {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.slider-dot');
    
    slides.forEach((slide, idx) => {
      slide.classList.toggle('active', idx === slideIndex);
    });
    
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === slideIndex);
    });
    
    this.currentSlide = slideIndex;
  },

  initWilayaSelect() {
    const wilayaSelect = document.getElementById('wilaya');
    if (!wilayaSelect) return;
    
    wilayaSelect.innerHTML = '<option value="">-- اختر الولاية --</option>';
    
    Object.keys(this.deliveryPrices).forEach(wilaya => {
      const option = document.createElement('option');
      option.value = wilaya;
      option.textContent = wilaya;
      wilayaSelect.appendChild(option);
    });
  },

  initEvents() {
    console.log('🎯 جاري إعداد الأحداث...');

    // أحداث الأزرار الأساسية
    const addPieceBtn = document.getElementById('addPieceBtn');
    if (addPieceBtn) {
      addPieceBtn.addEventListener('click', () => this.addPiece());
      console.log('✅ زر الإضافة جاهز');
    }

    // أحداث الولاية ونوع التوصيل
    const wilayaSelect = document.getElementById('wilaya');
    if (wilayaSelect) {
      wilayaSelect.addEventListener('change', () => {
        console.log('🔄 تغيير الولاية');
        this.updatePrice();
      });
    }

    const deliveryTypeSelect = document.getElementById('deliveryType');
    if (deliveryTypeSelect) {
      deliveryTypeSelect.addEventListener('change', () => {
        console.log('🔄 تغيير نوع التوصيل');
        this.updatePrice();
      });
    }

    // أحداث التنقل بين الخطوات
    const nextToStep2 = document.getElementById('nextToStep2');
    if (nextToStep2) nextToStep2.addEventListener('click', () => this.goToStep2());

    const backToStep1 = document.getElementById('backToStep1');
    if (backToStep1) backToStep1.addEventListener('click', () => this.goToStep1());

    const nextToStep3 = document.getElementById('nextToStep3');
    if (nextToStep3) nextToStep3.addEventListener('click', () => this.goToStep3());

    const backToStep2 = document.getElementById('backToStep2');
    if (backToStep2) backToStep2.addEventListener('click', () => this.goToStep2());

    // إرسال الطلب
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
      orderForm.addEventListener('submit', (e) => this.submitOrder(e));
    }

    // مسح البيانات
    const clearDataBtn = document.getElementById('clearSavedData');
    if (clearDataBtn) {
      clearDataBtn.addEventListener('click', () => this.clearUserData());
    }

    console.log('✅ جميع الأحداث جاهزة');
  },

  // بقية الدوال تبقى كما هي مع بعض التحسينات
  addPiece() {
    console.log('🛒 إضافة قطعة جديدة...');
    this.pieceCount++;
    const pieceId = this.pieceCount;
    
    const pieceElement = document.createElement('div');
    pieceElement.className = 'piece';
    pieceElement.dataset.pieceId = pieceId;

    pieceElement.innerHTML = `
      <div class="piece-header">
        <div class="piece-number">${pieceId}</div>
        <button type="button" class="remove-piece"><i class="fas fa-times"></i></button>
      </div>
      <div class="piece-grid">
        <div class="form-group">
          <label><i class="fas fa-tshirt"></i> اختر المودال</label>
          <select name="modal${pieceId}" required>
            <option value="">-- اختر المودال --</option>
            ${this.products.map(product => 
              `<option value="${product.id}">${product.name} - ${product.price} دج</option>`
            ).join('')}
          </select>
        </div>

        <div class="form-group">
          <label><i class="fas fa-cubes"></i> الكمية</label>
          <select name="quantity${pieceId}" required>
            ${Array.from({length: 10}, (_, i) => 
              `<option value="${i+1}" ${i+1 === 1 ? 'selected' : ''}>${i+1}</option>`
            ).join('')}
          </select>
        </div>

        <div class="form-group">
          <label><i class="fas fa-palette"></i> اللون</label>
          <div class="color-options" id="colorOptions${pieceId}">
            ${this.colors.map(color => 
              `<div class="color-option" data-color="${color.name}" style="background-color: ${color.value}" title="${color.name}"></div>`
            ).join('')}
          </div>
          <input type="hidden" name="color${pieceId}" id="selectedColor${pieceId}" required>
        </div>

        <div class="form-group">
          <label><i class="fas fa-ruler"></i> المقاس</label>
          <div class="size-options" id="sizeOptions${pieceId}">
            ${this.sizeChart.map(size => 
              `<div class="size-option" data-size="${size.size}" data-age="${size.age}">
                ${size.size}<br><small>${size.age}</small>
              </div>`
            ).join('')}
          </div>
          <input type="hidden" name="size${pieceId}" id="selectedSize${pieceId}" required>
        </div>
      </div>
    `;

    document.getElementById('piecesContainer').appendChild(pieceElement);

    // إعداد الأحداث للقطعة الجديدة
    this.setupPieceEvents(pieceId);
    this.updatePrice();
    
    // تحديث نص زر الإضافة
    if (this.pieceCount === 1) {
      document.getElementById('addPieceBtn').innerHTML = '<i class="fas fa-plus"></i> أضف مودال آخر';
    }

    console.log('✅ تمت إضافة القطعة ' + pieceId);
  },

  setupPieceEvents(pieceId) {
    const pieceElement = document.querySelector(`[data-piece-id="${pieceId}"]`);
    if (!pieceElement) return;

    const modalSelect = pieceElement.querySelector(`[name="modal${pieceId}"]`);
    const quantitySelect = pieceElement.querySelector(`[name="quantity${pieceId}"]`);
    const removeBtn = pieceElement.querySelector('.remove-piece');
    const colorOptions = pieceElement.querySelector(`#colorOptions${pieceId}`);
    const sizeOptions = pieceElement.querySelector(`#sizeOptions${pieceId}`);

    if (modalSelect) {
      modalSelect.addEventListener('change', () => this.updatePrice());
    }

    if (quantitySelect) {
      quantitySelect.addEventListener('change', () => this.updatePrice());
    }

    if (removeBtn) {
      removeBtn.addEventListener('click', () => this.removePiece(pieceId));
    }

    if (colorOptions) {
      colorOptions.addEventListener('click', (e) => {
        const colorOption = e.target.closest('.color-option');
        if (colorOption) this.selectColor(colorOption, pieceId);
      });
    }

    if (sizeOptions) {
      sizeOptions.addEventListener('click', (e) => {
        const sizeOption = e.target.closest('.size-option');
        if (sizeOption) this.selectSize(sizeOption, pieceId);
      });
    }

    // تحديد أول لون ومقاس افتراضي
    const firstColor = colorOptions?.querySelector('.color-option');
    const firstSize = sizeOptions?.querySelector('.size-option');
    
    if (firstColor) this.selectColor(firstColor, pieceId);
    if (firstSize) this.selectSize(firstSize, pieceId);
  },

  selectColor(colorOption, pieceId) {
    if (!colorOption) return;
    
    const container = colorOption.parentElement;
    container.querySelectorAll('.color-option').forEach(opt => {
      opt.classList.remove('selected');
    });
    
    colorOption.classList.add('selected');
    
    const colorInput = document.getElementById(`selectedColor${pieceId}`);
    if (colorInput) {
      colorInput.value = colorOption.getAttribute('data-color');
    }
  },

  selectSize(sizeOption, pieceId) {
    if (!sizeOption) return;
    
    const container = sizeOption.parentElement;
    container.querySelectorAll('.size-option').forEach(opt => {
      opt.classList.remove('selected');
    });
    
    sizeOption.classList.add('selected');
    
    const sizeInput = document.getElementById(`selectedSize${pieceId}`);
    if (sizeInput) {
      sizeInput.value = sizeOption.getAttribute('data-size');
    }
  },

  removePiece(pieceId) {
    console.log('🗑️ حذف القطعة ' + pieceId);
    const pieceElement = document.querySelector(`[data-piece-id="${pieceId}"]`);
    if (!pieceElement) return;

    pieceElement.style.animation = 'fadeOut 0.3s ease';
    
    setTimeout(() => {
      pieceElement.remove();
      this.pieceCount--;
      
      // إعادة ترقيم القطع المتبقية
      document.querySelectorAll('.piece').forEach((piece, index) => {
        const numberElement = piece.querySelector('.piece-number');
        if (numberElement) {
          numberElement.textContent = index + 1;
        }
      });
      
      // تحديث زر الإضافة إذا لم يعد هناك قطع
      if (this.pieceCount === 0) {
        document.getElementById('addPieceBtn').innerHTML = '<i class="fas fa-plus"></i> أضف إلى السلة';
      }
      
      this.updatePrice();
      console.log('✅ تم حذف القطعة');
    }, 300);
  },

  updatePrice() {
    console.log('💰 جاري تحديث الأسعار...');
    
    let totalPieces = 0;
    let subtotal = 0;

    // حساب عدد القطع والمجموع
    for (let i = 1; i <= this.pieceCount; i++) {
      const quantitySelect = document.querySelector(`[name="quantity${i}"]`);
      if (quantitySelect) {
        const quantity = parseInt(quantitySelect.value) || 0;
        totalPieces += quantity;
        
        // احتساب السعر (يمكن تعديل هذا المنطق حسب احتياجاتك)
        const piecePrice = 1500; // سعر افتراضي
        subtotal += piecePrice * quantity;
      }
    }

    // حساب سعر التوصيل
    const wilayaSelect = document.getElementById('wilaya');
    const deliveryTypeSelect = document.getElementById('deliveryType');
    
    let deliveryCost = 0;
    if (wilayaSelect && wilayaSelect.value && deliveryTypeSelect) {
      const wilaya = wilayaSelect.value;
      const deliveryType = deliveryTypeSelect.value;
      
      if (this.deliveryPrices[wilaya] && this.deliveryPrices[wilaya][deliveryType]) {
        deliveryCost = this.deliveryPrices[wilaya][deliveryType];
      }
    }

    // الخصم (مثال: خصم 300 دج للطلبات فوق قطعتين)
    let discount = 0;
    if (totalPieces >= 2) {
      discount = 300;
    }

    const total = subtotal + deliveryCost - discount;

    // تحديث الواجهة
    this.updatePriceDisplay(totalPieces, subtotal, deliveryCost, discount, total);
    
    console.log('💰 الأسعار المحدثة - القطع: ' + totalPieces + ', المجموع: ' + total + ' دج');
    
    return { totalPieces, subtotal, deliveryCost, discount, total };
  },

  updatePriceDisplay(totalPieces, subtotal, deliveryCost, discount, total) {
    const elements = {
      unitPrice: document.getElementById('unitPrice'),
      piecesCount: document.getElementById('piecesCount'),
      subtotal: document.getElementById('subtotal'),
      deliveryCost: document.getElementById('deliveryCost'),
      totalPrice: document.getElementById('totalPrice'),
      discountInfo: document.getElementById('discountInfo'),
      discountAmount: document.getElementById('discountAmount'),
      cartItemsCount: document.getElementById('cartItemsCount'),
      cartTotalPrice: document.getElementById('cartTotalPrice'),
      cartBadge: document.getElementById('cartBadge')
    };

    // تحديث الأسعار
    if (elements.unitPrice) elements.unitPrice.textContent = '1500 دج';
    if (elements.piecesCount) elements.piecesCount.textContent = totalPieces;
    if (elements.subtotal) elements.subtotal.textContent = `${subtotal} دج`;
    if (elements.deliveryCost) elements.deliveryCost.textContent = `${deliveryCost} دج`;
    if (elements.totalPrice) elements.totalPrice.textContent = `${total} دج`;

    // عرض/إخفاء الخصم
    if (elements.discountInfo) {
      if (discount > 0) {
        elements.discountInfo.style.display = 'flex';
        if (elements.discountAmount) {
          elements.discountAmount.textContent = `-${discount} دج`;
        }
      } else {
        elements.discountInfo.style.display = 'none';
      }
    }

    // تحديث السلة
    if (elements.cartItemsCount) elements.cartItemsCount.textContent = `${totalPieces} عناصر`;
    if (elements.cartTotalPrice) elements.cartTotalPrice.textContent = `${total} دج`;
    if (elements.cartBadge) elements.cartBadge.textContent = totalPieces;
  },

  // دوال التنقل بين الخطوات
  goToStep1() {
    document.getElementById('step1').style.display = 'block';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'none';
    this.updateProgressBar();
  },

  goToStep2() {
    if (this.pieceCount === 0) {
      alert('الرجاء إضافة قطعة واحدة على الأقل قبل المتابعة');
      return;
    }
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'block';
    document.getElementById('step3').style.display = 'none';
    this.updateProgressBar();
  },

  goToStep3() {
    // التحقق من صحة البيانات
    const name = document.getElementById('name')?.value.trim();
    const phone = document.getElementById('phone')?.value.trim();
    const daire = document.getElementById('daire')?.value.trim();
    const address = document.getElementById('address')?.value.trim();

    if (!name || !phone || !daire || !address) {
      alert('الرجاء ملء جميع الحقول المطلوبة');
      return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      alert('الرجاء إدخال رقم هاتف صحيح مكون من 10 أرقام');
      return;
    }

    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'block';
    this.updateProgressBar();
    this.updateOrderSummary();
  },

  updateProgressBar() {
    const steps = document.querySelectorAll('.progress-step');
    let activeStep = 1;

    if (this.pieceCount > 0) {
      activeStep = 2;
    }

    // يمكن إضافة منطق للخطوة 3 إذا لزم الأمر

    steps.forEach(step => {
      const stepNum = parseInt(step.getAttribute('data-step'));
      step.classList.toggle('active', stepNum === activeStep);
      step.classList.toggle('completed', stepNum < activeStep);
    });
  },

  async submitOrder(e) {
    e.preventDefault();
    console.log('📤 بدء إرسال الطلب...');

    // التحقق من البيانات
    if (this.pieceCount === 0) {
      alert('الرجاء إضافة قطعة واحدة على الأقل');
      return;
    }

    const name = document.getElementById('name')?.value.trim();
    const phone = document.getElementById('phone')?.value.trim();
    if (!name || !phone) {
      alert('الرجاء ملء البيانات الشخصية');
      return;
    }

    // عرض التحميل
    this.showLoading(true);

    try {
      // تجميع بيانات الطلب
      const orderData = {
        customerName: name,
        phone: phone,
        daire: document.getElementById('daire')?.value.trim() || '',
        address: document.getElementById('address')?.value.trim() || '',
        wilaya: document.getElementById('wilaya')?.value || '',
        deliveryType: document.getElementById('deliveryType')?.value || 'home',
        products: this.collectOrderProducts(),
        notes: document.getElementById('notes')?.value.trim() || '',
        total: this.updatePrice().total,
        timestamp: new Date().toLocaleString('ar-EG')
      };

      console.log('📝 بيانات الطلب:', orderData);

      // المحاولة الأولى: إرسال إلى Firebase
      let firebaseSuccess = false;
      if (typeof dataManager !== 'undefined' && dataManager.addOrder) {
        try {
          const firebaseResult = await dataManager.addOrder(orderData);
          firebaseSuccess = firebaseResult.success;
          console.log('✅ تم الحفظ في Firebase:', firebaseResult);
        } catch (firebaseError) {
          console.warn('⚠️ فشل الحفظ في Firebase:', firebaseError);
        }
      }

      // المحاولة الثانية: إرسال إلى Google Apps Script
      let googleSuccess = false;
      const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyOC11bwKjkHbKrpKED72ZuEO8-PZKByO2AwRL8xgnvohxGA-GKaLQh610wyA4au-YQ/exec";
      
      try {
        const formData = new FormData();
        Object.keys(orderData).forEach(key => {
          if (key === 'products') {
            formData.append(key, JSON.stringify(orderData[key]));
          } else {
            formData.append(key, orderData[key]);
          }
        });

        const response = await fetch(SCRIPT_URL, {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          googleSuccess = true;
          console.log('✅ تم الإرسال إلى Google Sheets');
        }
      } catch (googleError) {
        console.warn('⚠️ فشل الإرسال إلى Google Sheets:', googleError);
      }

      // عرض النتيجة للمستخدم
      if (firebaseSuccess || googleSuccess) {
        this.showSuccess(orderData);
      } else {
        throw new Error('فشل في إرسال الطلب إلى جميع الخوادم');
      }

    } catch (error) {
      console.error('❌ خطأ في إرسال الطلب:', error);
      alert('حدث خطأ في إرسال الطلب. الرجاء المحاولة مرة أخرى أو الاتصال بالدعم.');
    } finally {
      this.showLoading(false);
    }
  },

  collectOrderProducts() {
    const products = [];
    
    for (let i = 1; i <= this.pieceCount; i++) {
      const modalSelect = document.querySelector(`[name="modal${i}"]`);
      const quantitySelect = document.querySelector(`[name="quantity${i}"]`);
      const colorInput = document.getElementById(`selectedColor${i}`);
      const sizeInput = document.getElementById(`selectedSize${i}`);

      if (modalSelect && modalSelect.value) {
        const product = this.products.find(p => p.id == modalSelect.value);
        if (product) {
          products.push({
            name: product.name,
            quantity: quantitySelect ? parseInt(quantitySelect.value) : 1,
            color: colorInput ? colorInput.value : '',
            size: sizeInput ? sizeInput.value : '',
            unitPrice: product.price
          });
        }
      }
    }
    
    return products;
  },

  showLoading(show) {
    const loadingElement = document.getElementById('loading');
    const submitButton = document.getElementById('submitOrder');
    
    if (loadingElement) {
      loadingElement.style.display = show ? 'block' : 'none';
    }
    
    if (submitButton) {
      submitButton.disabled = show;
    }
  },

  showSuccess(orderData) {
    // تحديث ملخص الطلب في المودال
    this.updateOrderSummary();
    
    // عرض مودال النجاح
    const modal = document.getElementById('successModal');
    if (modal) {
      modal.classList.add('show');
    }
    
    // إعادة تعيين النموذج بعد 3 ثوان
    setTimeout(() => {
      this.resetForm();
      this.closeModal();
    }, 5000);
  },

  updateOrderSummary() {
    // ... (نفس الكود السابق)
  },

  resetForm() {
    this.pieceCount = 0;
    document.getElementById('piecesContainer').innerHTML = '';
    document.getElementById('addPieceBtn').innerHTML = '<i class="fas fa-plus"></i> أضف إلى السلة';
    this.updatePrice();
    this.goToStep1();
  },

  closeModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
      modal.classList.remove('show');
    }
  },

  // دوال حفظ البيانات
  saveUserData() {
    // ... (نفس الكود السابق)
  },

  loadUserData() {
    // ... (نفس الكود السابق)
  },

  setupAutoSave() {
    // ... (نفس الكود السابق)
  },

  clearUserData() {
    // ... (نفس الكود السابق)
  }
};

// بدء التطبيق
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 بدء تشغيل التطبيق...');
  app.init();
});
