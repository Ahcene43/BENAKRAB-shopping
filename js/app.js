
// التطبيق الرئيسي
const app = {
  pieceCount: 0,
  currentSlide: 0,
  slideInterval: null,
  products: [],
  deliveryPrices: {},
  colors: [],
  sizeChart: [],
  
  // تحميل البيانات من ملفات JSON
  async loadData() {
    try {
      // تحميل بيانات المنتجات
      const productsResponse = await fetch('data/products.json');
      const productsData = await productsResponse.json();
      this.products = productsData.products.filter(product => product.active);
      this.colors = productsData.colors || [];
      this.sizeChart = productsData.sizeChart || [];
      
      // تحميل بيانات التوصيل
      const deliveryResponse = await fetch('data/delivery.json');
      const deliveryData = await deliveryResponse.json();
      this.deliveryPrices = deliveryData.deliveryPrices;
      
      console.log('تم تحميل البيانات بنجاح');
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
      // استخدام بيانات افتراضية في حالة الخطأ
      this.loadDefaultData();
    }
  },
  
  loadDefaultData() {
    this.products = defaultProducts.products;
    this.colors = defaultProducts.colors;
    this.sizeChart = defaultProducts.sizeChart;
    this.deliveryPrices = defaultDeliveryPrices.deliveryPrices;
  },
  
  // تعديل دالة التهيئة
  async init() {
    await this.loadData();
    this.initSlider();
    this.initWilayaSelect();
    this.initEvents();
    this.loadUserData();
    this.setupAutoSave();
    this.updatePrice();
    
    // تأثير التمرير للهيدر
    window.addEventListener('scroll', () => {
      const header = document.getElementById('mainHeader');
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });

    // إغلاق المودال بالضغط خارج المحتوى
    document.getElementById('successModal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.closeModal();
      }
    });

    // إغلاق المودال بالضغط على زر ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.getElementById('successModal').classList.contains('show')) {
        this.closeModal();
      }
    });
  },

  // تهيئة السلايدر
  initSlider() {
    const slidesContainer = document.querySelector('.slides-container');
    const sliderNav = document.getElementById('sliderNav');
    
    let slidesHTML = '';
    let dotsHTML = '';
    
    this.products.forEach((product, index) => {
      slidesHTML += `
        <div class="slide ${index === 0 ? 'active' : ''}">
          <img src="${product.image}" alt="${product.name}" class="slide-image">
          <div class="slide-content">
            <h3 class="slide-title">${product.name}</h3>
            <p class="slide-description">${product.description}</p>
            <div class="modal-price"><i class="fas fa-tag"></i> السعر: ${product.price} دج</div>
          </div>
        </div>
      `;
      
      dotsHTML += `<div class="slider-dot ${index === 0 ? 'active' : ''}" data-slide="${index}"></div>`;
    });
    
    slidesContainer.innerHTML = slidesHTML;
    sliderNav.innerHTML = dotsHTML;
    
    // أحداث السلايدر
    const dots = document.querySelectorAll('.slider-dot');
    const prevBtn = document.getElementById('prevSlide');
    const nextBtn = document.getElementById('nextSlide');
    
    // الانتقال التلقائي بين الشرائح
    this.startSlideShow();
    
    // إضافة أحداث النقر على النقاط والأزرار
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        clearInterval(this.slideInterval);
        this.updateSlider(index);
        this.startSlideShow();
      });
    });
    
    prevBtn.addEventListener('click', () => {
      clearInterval(this.slideInterval);
      this.prevSlide();
      this.startSlideShow();
    });
    
    nextBtn.addEventListener('click', () => {
      clearInterval(this.slideInterval);
      this.nextSlide();
      this.startSlideShow();
    });
    
    // إيقاف السلايدر عند التمرير فوقه
    const slider = document.querySelector('.slideshow-container');
    slider.addEventListener('mouseenter', () => {
      clearInterval(this.slideInterval);
    });
    
    slider.addEventListener('mouseleave', () => {
      this.startSlideShow();
    });
  },

  // دوال السلايدر
  startSlideShow() {
    this.slideInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  },

  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.products.length;
    this.updateSlider(this.currentSlide);
  },

  prevSlide() {
    this.currentSlide = (this.currentSlide - 1 + this.products.length) % this.products.length;
    this.updateSlider(this.currentSlide);
  },

  updateSlider(slideIndex) {
    const slidesContainer = document.querySelector('.slides-container');
    const dots = document.querySelectorAll('.slider-dot');
    
    slidesContainer.style.transform = `translateX(-${slideIndex * 100}%)`;
    
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === slideIndex);
    });
    
    this.currentSlide = slideIndex;
  },

  // تهيئة قائمة الولايات
  initWilayaSelect() {
    const wilayaSelect = document.getElementById('wilaya');
    
    Object.keys(this.deliveryPrices).forEach(wilaya => {
      const option = document.createElement('option');
      option.value = wilaya;
      option.textContent = wilaya;
      wilayaSelect.appendChild(option);
    });
  },

  // تهيئة الأحداث
  initEvents() {
    // أحداث تحديث السعر
    document.getElementById('wilaya').addEventListener('change', () => this.updatePrice());
    document.getElementById('deliveryType').addEventListener('change', () => this.updatePrice());
    
    // أحداث التنقل بين الخطوات
    document.getElementById('nextToStep2').addEventListener('click', () => this.goToStep2());
    document.getElementById('backToStep1').addEventListener('click', () => this.goToStep1());
    document.getElementById('nextToStep3').addEventListener('click', () => this.goToStep3());
    document.getElementById('backToStep2').addEventListener('click', () => this.goToStep2());
    
    // حدث إضافة قطعة
    document.getElementById('addPieceBtn').addEventListener('click', () => this.addPiece());
    
    // حدث إرسال الطلب
    document.getElementById('orderForm').addEventListener('submit', (e) => this.submitOrder(e));
    
    // حدث مسح البيانات المحفوظة
    document.getElementById('clearSavedData').addEventListener('click', () => this.clearUserData());
  },

  // دوال الملء التلقائي باستخدام localStorage
  saveUserData() {
    const userData = {
      name: document.getElementById('name').value,
      phone: document.getElementById('phone').value,
      daire: document.getElementById('daire').value,
      address: document.getElementById('address').value,
      wilaya: document.getElementById('wilaya').value,
      deliveryType: document.getElementById('deliveryType').value,
      savedAt: new Date().getTime()
    };
    localStorage.setItem('modKidsUserData', JSON.stringify(userData));
  },

  loadUserData() {
    const savedData = localStorage.getItem('modKidsUserData');
    if (savedData) {
      const userData = JSON.parse(savedData);
      
      // ملء الحقول بالبيانات المحفوظة
      if (userData.name) document.getElementById('name').value = userData.name;
      if (userData.phone) document.getElementById('phone').value = userData.phone;
      if (userData.daire) document.getElementById('daire').value = userData.daire;
      if (userData.address) document.getElementById('address').value = userData.address;
      if (userData.wilaya) document.getElementById('wilaya').value = userData.wilaya;
      if (userData.deliveryType) document.getElementById('deliveryType').value = userData.deliveryType;
      
      // تحديث السعر لأن الولاية ونوع التوصيل قد تغيرا
      this.updatePrice();
      
      console.log('تم تحميل البيانات المحفوظة تلقائياً');
    }
  },

  setupAutoSave() {
    const fieldsToSave = ['name', 'phone', 'daire', 'address', 'wilaya', 'deliveryType'];
    
    fieldsToSave.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.addEventListener('input', () => {
          clearTimeout(window.autoSaveTimeout);
          window.autoSaveTimeout = setTimeout(() => this.saveUserData(), 1000);
        });
        
        field.addEventListener('change', () => {
          this.saveUserData();
        });
      }
    });
  },

  clearUserData() {
    localStorage.removeItem('modKidsUserData');
    document.getElementById('name').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('daire').value = '';
    document.getElementById('address').value = '';
    document.getElementById('wilaya').value = '';
    document.getElementById('deliveryType').value = 'home';
    
    this.updatePrice();
    alert('تم مسح البيانات المحفوظة بنجاح');
  },

  // إضافة قطعة جديدة مع الألوان والمقاسات
  addPiece() {
    this.pieceCount++;
    
    const pieceElement = document.createElement('div');
    pieceElement.className = 'piece';
    pieceElement.innerHTML = `
      <div class="piece-header">
        <div class="piece-number">${this.pieceCount}</div>
        <button type="button" class="remove-piece"><i class="fas fa-times"></i></button>
      </div>
      <div class="piece-grid">
        <div class="form-group">
          <label><i class="fas fa-tshirt"></i> اختر المودال</label>
          <select name="modal${this.pieceCount}" required>
            <option value="">-- اختر المودال --</option>
            ${this.products.map(product => 
              `<option value="${product.id}">${product.name} - ${product.price} دج</option>`
            ).join('')}
          </select>
        </div>
        
        <div class="form-group">
          <label><i class="fas fa-cubes"></i> الكمية</label>
          <select name="quantity${this.pieceCount}" required>
            ${Array.from({length: 10}, (_, i) => 
              `<option value="${i+1}">${i+1}</option>`
            ).join('')}
          </select>
        </div>
        
        <div class="form-group">
          <label><i class="fas fa-palette"></i> اللون</label>
          <div class="color-options" id="colorOptions${this.pieceCount}">
            ${this.colors.map(color => `
              <div class="color-option" data-color="${color.name}" style="background-color: ${color.value}" title="${color.name}"></div>
            `).join('')}
          </div>
          <input type="hidden" name="color${this.pieceCount}" id="selectedColor${this.pieceCount}" required>
        </div>
        
        <div class="form-group">
          <label><i class="fas fa-ruler"></i> المقاس</label>
          <div class="size-options" id="sizeOptions${this.pieceCount}">
            ${this.sizeChart.map(size => `
              <div class="size-option" data-size="${size.size}" data-age="${size.age}">
                ${size.size}<br>
                <small>${size.age}</small>
              </div>
            `).join('')}
          </div>
          <input type="hidden" name="size${this.pieceCount}" id="selectedSize${this.pieceCount}" required>
        </div>
        
        <div class="piece-image" id="pieceImage${this.pieceCount}">
          <div class="image-placeholder">
            <i class="fas fa-tshirt" style="font-size: 3rem; color: #e2e8f0;"></i>
            <p style="color: var(--gray); margin-top: 0.5rem;">سيظهر المنتج هنا بعد الاختيار</p>
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('piecesContainer').appendChild(pieceElement);
    
    // إضافة الأحداث للقطعة الجديدة
    const modalSelect = pieceElement.querySelector(`[name="modal${this.pieceCount}"]`);
    const quantitySelect = pieceElement.querySelector(`[name="quantity${this.pieceCount}"]`);
    const removeBtn = pieceElement.querySelector('.remove-piece');
    const colorOptions = pieceElement.querySelector(`#colorOptions${this.pieceCount}`);
    const sizeOptions = pieceElement.querySelector(`#sizeOptions${this.pieceCount}`);
    
    modalSelect.addEventListener('change', (e) => this.updatePiece(e.target, this.pieceCount));
    quantitySelect.addEventListener('change', () => this.updatePrice());
    removeBtn.addEventListener('click', (e) => this.removePiece(e.target.closest('.remove-piece')));
    
    // أحداث الألوان
    colorOptions.addEventListener('click', (e) => {
      const colorOption = e.target.closest('.color-option');
      if (colorOption) {
        this.selectColor(colorOption, this.pieceCount);
      }
    });
    
    // أحداث المقاسات
    sizeOptions.addEventListener('click', (e) => {
      const sizeOption = e.target.closest('.size-option');
      if (sizeOption) {
        this.selectSize(sizeOption, this.pieceCount);
      }
    });
    
    // تحديد أول لون ومقاس افتراضي
    this.selectColor(colorOptions.querySelector('.color-option'), this.pieceCount);
    this.selectSize(sizeOptions.querySelector('.size-option'), this.pieceCount);
    
    this.updatePrice();
    
    // تحديث نص الزر بعد إضافة أول قطعة
    const addButton = document.getElementById('addPieceBtn');
    if (this.pieceCount === 1) {
      addButton.innerHTML = '<i class="fas fa-plus"></i> أضف مودال آخر';
    }
    
    this.updateProgressBar();
  },

  // تحديث القطعة عند تغيير المودال
  updatePiece(select, pieceId) {
    const modalId = select.value;
    const imageContainer = document.getElementById(`pieceImage${pieceId}`);
    const colorOptions = document.getElementById(`colorOptions${pieceId}`);
    const sizeOptions = document.getElementById(`sizeOptions${pieceId}`);
    
    if (modalId) {
      const product = this.products.find(p => p.id == modalId);
      if (product) {
        // تحديث الصورة
        imageContainer.innerHTML = `
          <img src="${product.image}" alt="${product.name}" style="max-width: 100%; border-radius: var(--radius);">
          <p style="margin-top: 0.5rem; font-size: 0.9rem; color: var(--gray);">${product.description}</p>
        `;
        
        // تحديث الألوان المتاحة
        this.updateColorOptions(colorOptions, product.colors, pieceId);
        
        // تحديث المقاسات المتاحة
        this.updateSizeOptions(sizeOptions, product.sizes, pieceId);
      }
    } else {
      imageContainer.innerHTML = `
        <div class="image-placeholder">
          <i class="fas fa-tshirt" style="font-size: 3rem; color: #e2e8f0;"></i>
          <p style="color: var(--gray); margin-top: 0.5rem;">سيظهر المنتج هنا بعد الاختيار</p>
        </div>
      `;
    }
    
    this.updatePrice();
  },

  // تحديث خيارات الألوان
  updateColorOptions(container, availableColors, pieceId) {
    const colorOptions = container.querySelectorAll('.color-option');
    
    colorOptions.forEach(option => {
      const colorName = option.getAttribute('data-color');
      if (availableColors.includes(colorName)) {
        option.style.display = 'block';
        option.classList.remove('unavailable');
      } else {
        option.style.display = 'none';
        option.classList.add('unavailable');
      }
    });
    
    // تحديد أول لون متاح
    const firstAvailable = container.querySelector('.color-option:not(.unavailable)');
    if (firstAvailable) {
      this.selectColor(firstAvailable, pieceId);
    }
  },

  // تحديث خيارات المقاسات
  updateSizeOptions(container, availableSizes, pieceId) {
    const sizeOptions = container.querySelectorAll('.size-option');
    
    sizeOptions.forEach(option => {
      const size = option.getAttribute('data-size');
      const sizeInfo = availableSizes.find(s => s.size === size);
      
      if (sizeInfo && sizeInfo.available) {
        option.style.display = 'block';
        option.classList.remove('unavailable');
      } else {
        option.style.display = 'none';
        option.classList.add('unavailable');
      }
    });
    
    // تحديد أول مقاس متاح
    const firstAvailable = container.querySelector('.size-option:not(.unavailable)');
    if (firstAvailable) {
      this.selectSize(firstAvailable, pieceId);
    }
  },

  // اختيار اللون
  selectColor(colorOption, pieceId) {
    if (colorOption.classList.contains('unavailable')) return;
    
    const container = colorOption.parentElement;
    const allOptions = container.querySelectorAll('.color-option');
    
    allOptions.forEach(opt => opt.classList.remove('selected'));
    colorOption.classList.add('selected');
    
    const selectedColor = colorOption.getAttribute('data-color');
    document.getElementById(`selectedColor${pieceId}`).value = selectedColor;
  },

  // اختيار المقاس
  selectSize(sizeOption, pieceId) {
    if (sizeOption.classList.contains('unavailable')) return;
    
    const container = sizeOption.parentElement;
    const allOptions = container.querySelectorAll('.size-option');
    
    allOptions.forEach(opt => opt.classList.remove('selected'));
    sizeOption.classList.add('selected');
    
    const selectedSize = sizeOption.getAttribute('data-size');
    document.getElementById(`selectedSize${pieceId}`).value = selectedSize;
  },

  // إزالة قطعة
  removePiece(button) {
    const pieceElement = button.closest('.piece');
    pieceElement.style.animation = 'fadeOut 0.3s ease';
    
    setTimeout(() => {
      pieceElement.remove();
      this.pieceCount--;
      
      // تحديث نص الزر إذا لم يعد هناك قطع
      const addButton = document.getElementById('addPieceBtn');
      if (this.pieceCount === 0) {
        addButton.innerHTML = '<i class="fas fa-plus"></i> أضف إلى السلة';
      }
      
      // إعادة ترقيم القطع المتبقية
      const pieces = document.querySelectorAll('.piece');
      pieces.forEach((piece, index) => {
        piece.querySelector('.piece-number').textContent = index + 1;
      });
      
      this.updatePrice();
      this.updateProgressBar();
    }, 300);
  },

  // تحديث السعر
  updatePrice() {
    let totalPieces = 0;
    let subtotal = 0;
    
    // حساب عدد القطع والسعر الجزئي
    for (let i = 1; i <= this.pieceCount; i++) {
      const quantitySelect = document.querySelector(`[name="quantity${i}"]`);
      const modalSelect = document.querySelector(`[name="modal${i}"]`);
      
      if (quantitySelect && modalSelect && modalSelect.value) {
        const quantity = parseInt(quantitySelect.value) || 0;
        const product = this.products.find(p => p.id == modalSelect.value);
        
        if (product) {
          totalPieces += quantity;
        }
      }
    }
    
    // حساب سعر القطعة بناءً على الكمية
    const unitPrice = totalPieces >= 2 ? 3000 : 3300;
    const discount = totalPieces >= 2 ? 300 : 0;
    subtotal = totalPieces * unitPrice;
    
    // حساب تكلفة التوصيل
    const wilaya = document.getElementById('wilaya').value;
    const deliveryType = document.getElementById('deliveryType').value;
    const deliveryCost = this.deliveryPrices[wilaya] ? this.deliveryPrices[wilaya][deliveryType] : 0;
    
    // حساب السعر الكلي
    const total = subtotal + deliveryCost;
    
    // تحديث واجهة المستخدم
    document.getElementById('unitPrice').textContent = `${unitPrice} دج`;
    document.getElementById('piecesCount').textContent = totalPieces;
    document.getElementById('subtotal').textContent = `${subtotal} دج`;
    document.getElementById('deliveryCost').textContent = `${deliveryCost} دج`;
    document.getElementById('totalPrice').textContent = `${total} دج`;
    
    // عرض أو إخفاء معلومات الخصم
    const discountInfo = document.getElementById('discountInfo');
    if (totalPieces >= 2) {
      discountInfo.style.display = 'flex';
      document.getElementById('discountAmount').textContent = `-${discount * totalPieces} دج`;
    } else {
      discountInfo.style.display = 'none';
    }
    
    // تحديث ملخص السلة في الهيدر
    document.getElementById('cartItemsCount').textContent = `${totalPieces} عناصر`;
    document.getElementById('cartTotalPrice').textContent = `${total} دج`;
    document.getElementById('cartBadge').textContent = totalPieces;
    
    return {
      totalPieces,
      unitPrice,
      subtotal,
      deliveryCost,
      total,
      discount: totalPieces >= 2 ? discount * totalPieces : 0
    };
  },

  // تحديث شريط التقدم
  updateProgressBar() {
    const progressSteps = document.querySelectorAll('.progress-step');
    const progressBar = document.querySelector('.progress-bar');
    
    // تحديد الخطوة النشطة بناءً على عدد القطع
    let activeStep = 1;
    if (this.pieceCount > 0) activeStep = 2;
    
    // تحديث الخطوات
    progressSteps.forEach(step => {
      const stepNum = parseInt(step.getAttribute('data-step'));
      if (stepNum < activeStep) {
        step.classList.add('completed');
        step.classList.remove('active');
      } else if (stepNum === activeStep) {
        step.classList.add('active');
        step.classList.remove('completed');
      } else {
        step.classList.remove('active', 'completed');
      }
    });
    
    // تحديث شريط التقدم
    const progressPercent = ((activeStep - 1) / 2) * 100;
    progressBar.style.setProperty('--progress-width', `${progressPercent}%`);
  },

  // التنقل بين الخطوات
  goToStep2() {
    if (this.pieceCount === 0) {
      alert('الرجاء إضافة قطعة واحدة على الأقل قبل المتابعة');
      return;
    }
    
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'block';
    document.getElementById('step3').style.display = 'none';
    
    this.updateProgressBarToStep(2);
  },

  goToStep1() {
    document.getElementById('step1').style.display = 'block';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'none';
    
    this.updateProgressBarToStep(1);
  },

  goToStep3() {
    // التحقق من صحة البيانات في الخطوة 2
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const daire = document.getElementById('daire').value;
    const address = document.getElementById('address').value;
    
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
    
    this.updateProgressBarToStep(3);
    this.updateOrderSummary();
  },

  updateProgressBarToStep(step) {
    document.querySelectorAll('.progress-step').forEach(progressStep => {
      const stepNum = parseInt(progressStep.getAttribute('data-step'));
      if (stepNum < step) {
        progressStep.classList.add('completed');
        progressStep.classList.remove('active');
      } else if (stepNum === step) {
        progressStep.classList.add('active');
        progressStep.classList.remove('completed');
      } else {
        progressStep.classList.remove('active', 'completed');
      }
    });
  },

  // تحديث ملخص الطلب
  updateOrderSummary() {
    const orderSummary = document.getElementById('orderSummary');
    const modalOrderSummary = document.getElementById('modalOrderSummary');
    
    // حساب الأسعار
    const priceDetails = this.updatePrice();
    
    let summaryHTML = '';
    
    // معلومات العميل
    summaryHTML += `
      <div class="summary-item">
        <span><i class="fas fa-user"></i> الاسم:</span>
        <span>${document.getElementById('name').value}</span>
      </div>
      <div class="summary-item">
        <span><i class="fas fa-phone"></i> الهاتف:</span>
        <span>${document.getElementById('phone').value}</span>
      </div>
      <div class="summary-item">
        <span><i class="fas fa-map"></i> الدائرة:</span>
        <span>${document.getElementById('daire').value}</span>
      </div>
      <div class="summary-item">
        <span><i class="fas fa-home"></i> العنوان:</span>
        <span>${document.getElementById('address').value}</span>
      </div>
      <div class="summary-item">
        <span><i class="fas fa-map-marker-alt"></i> الولاية:</span>
        <span>${document.getElementById('wilaya').value}</span>
      </div>
      <div class="summary-item">
        <span><i class="fas fa-truck"></i> نوع التوصيل:</span>
        <span>${document.getElementById('deliveryType').value === 'home' ? 'إلى المنزل' : 'إلى المكتب'}</span>
      </div>
      <hr style="margin: 1rem 0; border: none; border-top: 1px solid #cbd5e1;">
    `;
    
    // تفاصيل القطع
    for (let i = 1; i <= this.pieceCount; i++) {
      const modalSelect = document.querySelector(`[name="modal${i}"]`);
      const quantitySelect = document.querySelector(`[name="quantity${i}"]`);
      const colorInput = document.getElementById(`selectedColor${i}`);
      const sizeInput = document.getElementById(`selectedSize${i}`);
      
      if (modalSelect && modalSelect.value) {
        const product = this.products.find(p => p.id == modalSelect.value);
        if (product) {
          summaryHTML += `
            <div class="summary-item">
              <span><i class="fas fa-tshirt"></i> القطعة ${i}:</span>
              <span>${product.name}</span>
            </div>
            <div class="summary-item" style="font-size: 0.9rem; color: var(--gray);">
              <span>التفاصيل:</span>
              <span>${quantitySelect.value} × ${product.price} دج | ${colorInput.value} | ${sizeInput.value}</span>
            </div>
          `;
        }
      }
    }
    
    // تفاصيل السعر
    summaryHTML += `
      <hr style="margin: 1rem 0; border: none; border-top: 1px solid #cbd5e1;">
      <div class="summary-item">
        <span>المجموع الجزئي:</span>
        <span>${priceDetails.subtotal} دج</span>
      </div>
      <div class="summary-item">
        <span><i class="fas fa-truck"></i> تكلفة التوصيل:</span>
        <span>${priceDetails.deliveryCost} دج</span>
      </div>
    `;
    
    if (priceDetails.discount > 0) {
      summaryHTML += `
        <div class="summary-item">
          <span>خصم الكمية:</span>
          <span style="color: var(--success);">-${priceDetails.discount} دج</span>
        </div>
      `;
    }
    
    summaryHTML += `
      <hr style="margin: 1rem 0; border: none; border-top: 2px solid var(--primary);">
      <div class="summary-item" style="font-weight: bold; font-size: 1.1rem;">
        <span>المجموع الكلي:</span>
        <span>${priceDetails.total} دج</span>
      </div>
    `;
    
    orderSummary.innerHTML = summaryHTML;
    modalOrderSummary.innerHTML = summaryHTML;
  },

  // إرسال الطلب
  submitOrder(e) {
    e.preventDefault();
    
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyOC11bwKjkHbKrpKED72ZuEO8-PZKByO2AwRL8xgnvohxGA-GKaLQh610wyA4au-YQ/exec";
    
    // إظهار شاشة التحميل في منتصف الشاشة
    const loadingEl = document.getElementById('loading');
    loadingEl.style.display = 'block';
    loadingEl.classList.add('fixed-loading');
    document.getElementById('submitOrder').disabled = true;
    
    // جمع بيانات النموذج
    const formData = new FormData(document.getElementById('orderForm'));
    const priceDetails = this.updatePrice();
    formData.append('total', priceDetails.total);
    formData.append('deliveryCost', priceDetails.deliveryCost);
    formData.append('timestamp', new Date().toLocaleString('fr-FR'));
    
    // حفظ البيانات قبل الإرسال
    this.saveUserData();
    
    // إرسال البيانات
    fetch(SCRIPT_URL, {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.text();
    })
    .then(data => {
      // إخفاء شاشة التحميل
      loadingEl.style.display = 'none';
      loadingEl.classList.remove('fixed-loading');
      document.getElementById('submitOrder').disabled = false;
      
      // إظهار مودال النجاح
      document.getElementById('successModal').classList.add('show');
      
      // إعادة تعيين النموذج بعد تأخير
      setTimeout(() => {
        this.resetForm();
      }, 3000);
    })
    .catch(error => {
      console.error('Error:', error);
      loadingEl.style.display = 'none';
      loadingEl.classList.remove('fixed-loading');
      document.getElementById('submitOrder').disabled = false;
      alert('حدث خطأ أثناء إرسال الطلب. الرجاء المحاولة مرة أخرى.');
    });
  },

  // إعادة تعيين النموذج
  resetForm() {
    // إعادة تعيين القطع
    document.getElementById('piecesContainer').innerHTML = '';
    this.pieceCount = 0;
    
    // إعادة نص الزر إلى حالته الأصلية
    const addButton = document.getElementById('addPieceBtn');
    addButton.innerHTML = '<i class="fas fa-plus"></i> أضف إلى السلة';
    
    // إعادة تعيين الحقول (باستثناء البيانات المحفوظة)
    document.getElementById('wilaya').value = '';
    document.getElementById('deliveryType').value = 'home';
    
    // العودة إلى الخطوة الأولى
    this.goToStep1();
    
    // تحديث السعر
    this.updatePrice();
  },

  // إغلاق المودال
  closeModal() {
    document.getElementById('successModal').classList.remove('show');
  }
};

// تهيئة التطبيق عند تحميل الصفحة
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
