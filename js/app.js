// js/app.js
// الكود الرئيسي لتشغيل الواجهة وعمليات الطلب

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
      // fallback
      this.products = defaultProducts.products;
      this.colors = defaultProducts.colors;
      this.sizeChart = defaultProducts.sizeChart;
      this.deliveryPrices = defaultDeliveryPrices.deliveryPrices || {};
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
        <img src="${product.image}" alt="${product.name}" class="slide-image">
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

    document.getElementById('prevSlide').addEventListener('click', () => { clearInterval(this.slideInterval); this.prevSlide(); this.startSlideShow(); });
    document.getElementById('nextSlide').addEventListener('click', () => { clearInterval(this.slideInterval); this.nextSlide(); this.startSlideShow(); });

    const slider = document.querySelector('.slideshow-container');
    slider.addEventListener('mouseenter', () => clearInterval(this.slideInterval));
    slider.addEventListener('mouseleave', () => this.startSlideShow());

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
    const slidesContainer = document.querySelector('.slides-container');
    const dots = document.querySelectorAll('.slider-dot');
    if (slidesContainer) slidesContainer.style.transform = `translateX(-${slideIndex * 100}%)`;
    dots.forEach((dot, idx) => dot.classList.toggle('active', idx === slideIndex));
    this.currentSlide = slideIndex;
  },

  initWilayaSelect() {
    const wilayaSelect = document.getElementById('wilaya');
    if (!wilayaSelect) return;
    wilayaSelect.innerHTML = `<option value="">-- اختر الولاية --</option>`;
    Object.keys(this.deliveryPrices).forEach(w => {
      const opt = document.createElement('option');
      opt.value = w;
      opt.textContent = w;
      wilayaSelect.appendChild(opt);
    });
  },

  initEvents() {
    const wilayaEl = document.getElementById('wilaya');
    const deliveryTypeEl = document.getElementById('deliveryType');

    if (wilayaEl) wilayaEl.addEventListener('change', () => this.updatePrice());
    if (deliveryTypeEl) deliveryTypeEl.addEventListener('change', () => this.updatePrice());

    document.getElementById('nextToStep2').addEventListener('click', () => this.goToStep2());
    document.getElementById('backToStep1').addEventListener('click', () => this.goToStep1());
    document.getElementById('nextToStep3').addEventListener('click', () => this.goToStep3());
    document.getElementById('backToStep2').addEventListener('click', () => this.goToStep2());

    document.getElementById('addPieceBtn').addEventListener('click', () => this.addPiece());

    document.getElementById('orderForm').addEventListener('submit', (e) => this.submitOrder(e));

    document.getElementById('clearSavedData').addEventListener('click', () => this.clearUserData());
  },

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
    if (!savedData) return;
    const userData = JSON.parse(savedData);
    if (userData.name) document.getElementById('name').value = userData.name;
    if (userData.phone) document.getElementById('phone').value = userData.phone;
    if (userData.daire) document.getElementById('daire').value = userData.daire;
    if (userData.address) document.getElementById('address').value = userData.address;
    if (userData.wilaya) document.getElementById('wilaya').value = userData.wilaya;
    if (userData.deliveryType) document.getElementById('deliveryType').value = userData.deliveryType;
    this.updatePrice();
  },

  setupAutoSave() {
    const fieldsToSave = ['name', 'phone', 'daire', 'address', 'wilaya', 'deliveryType'];
    fieldsToSave.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', () => {
        clearTimeout(window.autoSaveTimeout);
        window.autoSaveTimeout = setTimeout(() => this.saveUserData(), 1000);
      });
      el.addEventListener('change', () => this.saveUserData());
    });
  },

  clearUserData() {
    localStorage.removeItem('modKidsUserData');
    ['name','phone','daire','address','wilaya'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.getElementById('deliveryType').value = 'home';
    this.updatePrice();
    alert('تم مسح البيانات المحفوظة بنجاح');
  },

  addPiece() {
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
            ${this.products.map(product => `<option value="${product.id}">${product.name} - ${product.price} دج</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label><i class="fas fa-cubes"></i> الكمية</label>
          <select name="quantity${pieceId}" required>
            ${Array.from({length: 10}, (_, i) => `<option value="${i+1}">${i+1}</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label><i class="fas fa-palette"></i> اللون</label>
          <div class="color-options" id="colorOptions${pieceId}">
            ${this.colors.map(color => `<div class="color-option" data-color="${color.name}" style="background-color: ${color.value}" title="${color.name}"></div>`).join('')}
          </div>
          <input type="hidden" name="color${pieceId}" id="selectedColor${pieceId}" required>
        </div>

        <div class="form-group">
          <label><i class="fas fa-ruler"></i> المقاس</label>
          <div class="size-options" id="sizeOptions${pieceId}">
            ${this.sizeChart.map(size => `<div class="size-option" data-size="${size.size}" data-age="${size.age}">${size.size}<br><small>${size.age}</small></div>`).join('')}
          </div>
          <input type="hidden" name="size${pieceId}" id="selectedSize${pieceId}" required>
        </div>

        <div class="piece-image" id="pieceImage${pieceId}">
          <div class="image-placeholder">
            <i class="fas fa-tshirt" style="font-size: 3rem; color: #e2e8f0;"></i>
            <p style="color: var(--gray); margin-top: 0.5rem;">سيظهر المنتج هنا بعد الاختيار</p>
          </div>
        </div>
      </div>
    `;

    document.getElementById('piecesContainer').appendChild(pieceElement);

    // events
    const modalSelect = pieceElement.querySelector(`[name="modal${pieceId}"]`);
    const quantitySelect = pieceElement.querySelector(`[name="quantity${pieceId}"]`);
    const removeBtn = pieceElement.querySelector('.remove-piece');
    const colorOptions = pieceElement.querySelector(`#colorOptions${pieceId}`);
    const sizeOptions = pieceElement.querySelector(`#sizeOptions${pieceId}`);

    modalSelect.addEventListener('change', (e) => this.updatePiece(e.target, pieceId));
    quantitySelect.addEventListener('change', () => this.updatePrice());
    removeBtn.addEventListener('click', () => this.removePiece(removeBtn));

    colorOptions.addEventListener('click', (e) => {
      const colorOption = e.target.closest('.color-option');
      if (colorOption) this.selectColor(colorOption, pieceId);
    });

    sizeOptions.addEventListener('click', (e) => {
      const sizeOption = e.target.closest('.size-option');
      if (sizeOption) this.selectSize(sizeOption, pieceId);
    });

    // set defaults
    const firstColor = colorOptions.querySelector('.color-option');
    const firstSize = sizeOptions.querySelector('.size-option');
    if (firstColor) this.selectColor(firstColor, pieceId);
    if (firstSize) this.selectSize(firstSize, pieceId);

    this.updatePrice();

    // update add button text
    const addBtn = document.getElementById('addPieceBtn');
    if (this.pieceCount === 1) addBtn.innerHTML = '<i class="fas fa-plus"></i> أضف مودال آخر';

    this.updateProgressBar();
  },

  updatePiece(selectEl, pieceId) {
    const modalId = selectEl.value;
    const imageContainer = document.getElementById(`pieceImage${pieceId}`);
    const colorOptions = document.getElementById(`colorOptions${pieceId}`);
    const sizeOptions = document.getElementById(`sizeOptions${pieceId}`);
    if (!imageContainer) return;

    if (modalId) {
      const product = this.products.find(p => p.id == modalId);
      if (product) {
        imageContainer.innerHTML = `
          <img src="${product.image}" alt="${product.name}" style="max-width:100%; border-radius: var(--radius);">
          <p style="margin-top:0.5rem; color:var(--gray);">${product.description}</p>
        `;
        // enable/disable colors & sizes according to product
        this.updateColorOptions(colorOptions, product.colors || [], pieceId);
        this.updateSizeOptions(sizeOptions, (product.sizes || []).map(s => s.size), pieceId);
      }
    } else {
      imageContainer.innerHTML = `
        <div class="image-placeholder">
          <i class="fas fa-tshirt" style="font-size:3rem; color:#e2e8f0;"></i>
          <p style="color: var(--gray); margin-top:0.5rem;">سيظهر المنتج هنا بعد الاختيار</p>
        </div>
      `;
    }
    this.updatePrice();
  },

  updateColorOptions(container, availableColors, pieceId) {
    const options = container ? container.querySelectorAll('.color-option') : [];
    options.forEach(opt => {
      const colorName = opt.getAttribute('data-color');
      if (availableColors.includes(colorName)) {
        opt.style.display = 'block';
        opt.classList.remove('unavailable');
      } else {
        opt.style.display = 'none';
        opt.classList.add('unavailable');
      }
    });
    const first = container.querySelector('.color-option:not(.unavailable)');
    if (first) this.selectColor(first, pieceId);
  },

  updateSizeOptions(container, availableSizes, pieceId) {
    const options = container ? container.querySelectorAll('.size-option') : [];
    options.forEach(opt => {
      const s = opt.getAttribute('data-size');
      if (availableSizes.includes(s)) {
        opt.style.display = 'block';
        opt.classList.remove('unavailable');
      } else {
        opt.style.display = 'none';
        opt.classList.add('unavailable');
      }
    });
    const first = container.querySelector('.size-option:not(.unavailable)');
    if (first) this.selectSize(first, pieceId);
  },

  selectColor(colorOption, pieceId) {
    if (!colorOption || colorOption.classList.contains('unavailable')) return;
    const container = colorOption.parentElement;
    container.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
    colorOption.classList.add('selected');
    const selected = colorOption.getAttribute('data-color');
    const input = document.getElementById(`selectedColor${pieceId}`);
    if (input) input.value = selected;
  },

  selectSize(sizeOption, pieceId) {
    if (!sizeOption || sizeOption.classList.contains('unavailable')) return;
    const container = sizeOption.parentElement;
    container.querySelectorAll('.size-option').forEach(o => o.classList.remove('selected'));
    sizeOption.classList.add('selected');
    const selected = sizeOption.getAttribute('data-size');
    const input = document.getElementById(`selectedSize${pieceId}`);
    if (input) input.value = selected;
  },

  removePiece(button) {
    const pieceElement = button.closest('.piece');
    if (!pieceElement) return;
    pieceElement.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => {
      pieceElement.remove();
      this.pieceCount--;
      // re-number pieces
      document.querySelectorAll('.piece').forEach((p, idx) => {
        const num = p.querySelector('.piece-number');
        if (num) num.textContent = idx + 1;
      });
      if (this.pieceCount === 0) {
        document.getElementById('addPieceBtn').innerHTML = '<i class="fas fa-plus"></i> أضف إلى السلة';
      }
      this.updatePrice();
      this.updateProgressBar();
    }, 300);
  },

  updatePrice() {
    let totalPieces = 0;
    let subtotal = 0;

    for (let i = 1; i <= this.pieceCount; i++) {
      const quantitySelect = document.querySelector(`[name="quantity${i}"]`);
      const modalSelect = document.querySelector(`[name="modal${i}"]`);
      if (quantitySelect && modalSelect && modalSelect.value) {
        const qty = parseInt(quantitySelect.value) || 0;
        const product = this.products.find(p => p.id == modalSelect.value);
        if (product) {
          totalPieces += qty;
          subtotal += (product.price || 0) * qty;
        }
      }
    }

    // business rules: special unit price override in original code
    const unitPrice = totalPieces >= 2 ? 3000 : 3300;
    const discountPerPiece = totalPieces >= 2 ? 300 : 0;
    const discount = discountPerPiece * totalPieces;

    const wilaya = document.getElementById('wilaya').value;
    const deliveryType = document.getElementById('deliveryType').value;
    const deliveryCost = (this.deliveryPrices[wilaya] && this.deliveryPrices[wilaya][deliveryType]) ? this.deliveryPrices[wilaya][deliveryType] : 0;

    // If subtotal calculated from product prices, we keep it; else fallback to unitPrice logic:
    const effectiveSubtotal = subtotal > 0 ? subtotal - discount : totalPieces * unitPrice - discount;

    const total = effectiveSubtotal + deliveryCost;

    document.getElementById('unitPrice').textContent = `${unitPrice} دج`;
    document.getElementById('piecesCount').textContent = totalPieces;
    document.getElementById('subtotal').textContent = `${effectiveSubtotal} دج`;
    document.getElementById('deliveryCost').textContent = `${deliveryCost} دج`;
    document.getElementById('totalPrice').textContent = `${total} دج`;

    const discountInfo = document.getElementById('discountInfo');
    if (discount > 0) {
      discountInfo.style.display = 'flex';
      document.getElementById('discountAmount').textContent = `-${discount} دج`;
    } else {
      discountInfo.style.display = 'none';
    }

    document.getElementById('cartItemsCount').textContent = `${totalPieces} عناصر`;
    document.getElementById('cartTotalPrice').textContent = `${total} دج`;
    document.getElementById('cartBadge').textContent = totalPieces;

    return { totalPieces, unitPrice, subtotal: effectiveSubtotal, deliveryCost, total, discount };
  },

  updateProgressBar() {
    const progressSteps = document.querySelectorAll('.progress-step');
    let activeStep = this.pieceCount > 0 ? 2 : 1;
    progressSteps.forEach(step => {
      const stepNum = parseInt(step.getAttribute('data-step'));
      if (stepNum < activeStep) { step.classList.add('completed'); step.classList.remove('active'); }
      else if (stepNum === activeStep) { step.classList.add('active'); step.classList.remove('completed'); }
      else { step.classList.remove('active', 'completed'); }
    });
  },

  goToStep2() {
    if (this.pieceCount === 0) { alert('الرجاء إضافة قطعة واحدة على الأقل قبل المتابعة'); return; }
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'block';
    document.getElementById('step3').style.display = 'none';
    this.updateProgressBar();
  },

  goToStep1() {
    document.getElementById('step1').style.display = 'block';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'none';
    this.updateProgressBar();
  },

  goToStep3() {
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const daire = document.getElementById('daire').value;
    const address = document.getElementById('address').value;
    if (!name || !phone || !daire || !address) { alert('الرجاء ملء جميع الحقول المطلوبة'); return; }
    if (!/^[0-9]{10}$/.test(phone)) { alert('الرجاء إدخال رقم هاتف صحيح مكون من 10 أرقام'); return; }
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'block';
    this.updateProgressBar();
    this.updateOrderSummary();
  },

  updateOrderSummary() {
    const orderSummary = document.getElementById('orderSummary');
    const modalOrderSummary = document.getElementById('modalOrderSummary');
    const priceDetails = this.updatePrice();
    let html = '';

    html += `
      <div class="summary-item"><span><i class="fas fa-user"></i> الاسم:</span><span>${document.getElementById('name').value}</span></div>
      <div class="summary-item"><span><i class="fas fa-phone"></i> الهاتف:</span><span>${document.getElementById('phone').value}</span></div>
      <div class="summary-item"><span><i class="fas fa-map"></i> الدائرة:</span><span>${document.getElementById('daire').value}</span></div>
      <div class="summary-item"><span><i class="fas fa-home"></i> العنوان:</span><span>${document.getElementById('address').value}</span></div>
      <div class="summary-item"><span><i class="fas fa-map-marker-alt"></i> الولاية:</span><span>${document.getElementById('wilaya').value}</span></div>
      <div class="summary-item"><span><i class="fas fa-truck"></i> نوع التوصيل:</span><span>${document.getElementById('deliveryType').value === 'home' ? 'إلى المنزل' : 'إلى المكتب'}</span></div>
      <hr>
    `;

    for (let i=1; i<=this.pieceCount; i++) {
      const modalSelect = document.querySelector(`[name="modal${i}"]`);
      const quantitySelect = document.querySelector(`[name="quantity${i}"]`);
      const colorInput = document.getElementById(`selectedColor${i}`);
      const sizeInput = document.getElementById(`selectedSize${i}`);
      if (modalSelect && modalSelect.value) {
        const product = this.products.find(p => p.id == modalSelect.value);
        if (product) {
          html += `<div class="summary-item"><span><i class="fas fa-tshirt"></i> القطعة ${i}:</span><span>${product.name}</span></div>`;
          html += `<div class="summary-item" style="font-size:0.9rem;color:var(--gray);"><span>التفاصيل:</span><span>${quantitySelect.value} × ${product.price} دج | ${colorInput.value} | ${sizeInput.value}</span></div>`;
        }
      }
    }

    html += `<hr>
      <div class="summary-item"><span>المجموع الجزئي:</span><span>${priceDetails.subtotal} دج</span></div>
      <div class="summary-item"><span><i class="fas fa-truck"></i> تكلفة التوصيل:</span><span>${priceDetails.deliveryCost} دج</span></div>
    `;
    if (priceDetails.discount > 0) {
      html += `<div class="summary-item"><span>خصم الكمية:</span><span style="color:var(--success);">-${priceDetails.discount} دج</span></div>`;
    }
    html += `<hr><div class="summary-item" style="font-weight:bold;font-size:1.1rem;"><span>المجموع الكلي:</span><span>${priceDetails.total} دج</span></div>`;

    if (orderSummary) orderSummary.innerHTML = html;
    if (modalOrderSummary) modalOrderSummary.innerHTML = html;
  },

  submitOrder(e) {
    e.preventDefault();
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyOC11bwKjkHbKrpKED72ZuEO8-PZKByO2AwRL8xgnvohxGA-GKaLQh610wyA4au-YQ/exec";
    const loadingEl = document.getElementById('loading');
    loadingEl.style.display = 'block';
    loadingEl.classList.add('fixed-loading');
    document.getElementById('submitOrder').disabled = true;

    const formEl = document.getElementById('orderForm');
    const formData = new FormData(formEl);
    const priceDetails = this.updatePrice();
    formData.append('total', priceDetails.total);
    formData.append('deliveryCost', priceDetails.deliveryCost);
    formData.append('timestamp', new Date().toLocaleString('fr-FR'));

    this.saveUserData();

    fetch(SCRIPT_URL, { method: 'POST', body: formData })
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.text();
      })
      .then(async data => {
        loadingEl.style.display = 'none';
        loadingEl.classList.remove('fixed-loading');
        document.getElementById('submitOrder').disabled = false;
        // إضافة الطلب إلى Firebase (deliveryOrders) إن كانت service مهيأة
        const orderPayload = {
          customerName: document.getElementById('name').value,
          phone: document.getElementById('phone').value,
          address: document.getElementById('address').value,
          wilaya: document.getElementById('wilaya').value,
          deliveryType: document.getElementById('deliveryType').value,
          products: this.collectOrderProducts(), // تم الإصلاح هنا - حذف JSON.stringify
          total: priceDetails.total
        };
        if (window.firebaseService && typeof window.firebaseService.addDeliveryOrder === 'function') {
          try {
            await window.firebaseService.addDeliveryOrder(orderPayload);
          } catch (err) {
            console.warn('Firebase order add failed', err);
          }
        }
        document.getElementById('successModal').classList.add('show');
        setTimeout(() => this.resetForm(), 3000);
      })
      .catch(err => {
        console.error('Error:', err);
        loadingEl.style.display = 'none';
        loadingEl.classList.remove('fixed-loading');
        document.getElementById('submitOrder').disabled = false;
        alert('حدث خطأ أثناء إرسال الطلب. الرجاء المحاولة مرة أخرى.');
      });
  },

  collectOrderProducts() {
    const list = [];
    for (let i=1; i<=this.pieceCount; i++) {
      const modalSelect = document.querySelector(`[name="modal${i}"]`);
      const quantitySelect = document.querySelector(`[name="quantity${i}"]`);
      const colorInput = document.getElementById(`selectedColor${i}`);
      const sizeInput = document.getElementById(`selectedSize${i}`);
      if (modalSelect && modalSelect.value) {
        const product = this.products.find(p => p.id == modalSelect.value);
        list.push({
          id: product.id,
          name: product.name,
          qty: quantitySelect ? quantitySelect.value : 1,
          color: colorInput ? colorInput.value : '',
          size: sizeInput ? sizeInput.value : '',
          unitPrice: product.price
        });
      }
    }
    return list;
  },

  resetForm() {
    document.getElementById('piecesContainer').innerHTML = '';
    this.pieceCount = 0;
    document.getElementById('addPieceBtn').innerHTML = '<i class="fas fa-plus"></i> أضف إلى السلة';
    document.getElementById('wilaya').value = '';
    document.getElementById('deliveryType').value = 'home';
    this.goToStep1();
    this.updatePrice();
  },

  closeModal() {
    document.getElementById('successModal').classList.remove('show');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
