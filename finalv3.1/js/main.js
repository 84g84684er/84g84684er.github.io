// main.js

const EMAILJS_PUBLIC_KEY = "1c3dzWxFec60IT5xz";
if (typeof emailjs !== 'undefined') {
  emailjs.init(EMAILJS_PUBLIC_KEY);
} else {
  console.error("EmailJS SDK not loaded.");
}

const handleLoading = () => {
  const loadingScreen = document.querySelector('.loading-screen');
  if (loadingScreen) {
    let minLoadingTimePassed = false;
    let windowLoaded = false;
    const minDisplayDuration = 800;

    setTimeout(() => {
      minLoadingTimePassed = true;
      if (windowLoaded) {
        loadingScreen.classList.add('fade-out');
        setTimeout(() => {
          if (loadingScreen) loadingScreen.style.display = 'none';
        }, 500);
      }
    }, minDisplayDuration);

    window.addEventListener('load', function() {
      windowLoaded = true;
      if (minLoadingTimePassed) {
        loadingScreen.classList.add('fade-out');
        setTimeout(() => {
          if (loadingScreen) loadingScreen.style.display = 'none';
        }, 500);
      }
    });
  }
};

const initAOS = () => {
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 1000,
      once: false,
      mirror: true,
      offset: 100
    });
  } else {
    console.error("AOS library not loaded.");
  }
};

const initRippleEffect = () => {
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      if (button.disabled) return;
      let existingRipple = button.querySelector('.ripple');
      if(existingRipple) existingRipple.remove();
      const ripple = document.createElement('div');
      ripple.classList.add('ripple');
      this.appendChild(ripple);
      const rect = ripple.parentElement.getBoundingClientRect();
      let x = e.clientX - rect.left;
      let y = e.clientY - rect.top;
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      window.getComputedStyle(ripple).transform;
      setTimeout(() => ripple.remove(), 600);
    });
  });
};

const redirectTo404ForInvalidLinks = () => {
    const allLinks = document.querySelectorAll('a');
    const pathTo404 = '404.html';

    allLinks.forEach(link => {
        if (link.classList.contains('back-to-top')) {
            return;
        }
        const href = link.getAttribute('href');
        if (href) {
            const isJustHash = href === '#';
            let isBrokenPageAnchor = false;
            if (href.startsWith('#') && href.length > 1) {
                try {
                    if (!document.querySelector(href)) {
                        isBrokenPageAnchor = true;
                    }
                } catch (e) { isBrokenPageAnchor = true; }
            }
            let isUnknownPage = false;
            const knownPages = ['index.html', 'about.html', 'action.html', 'donate.html', 'volunteer.html', '404.html', 'game.html', 'team.html'];
            if (!href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('#')) {
                if (href.includes('.') && href.toLowerCase().endsWith('.html') && !knownPages.some(page => href.toLowerCase().endsWith(page.toLowerCase()))) {
                    isUnknownPage = true;
                }
            }
            const currentPath = window.location.pathname.split('/').pop();
            if (currentPath === 'action.html' && (href === '#share' || href === '#projects')) {
                 isBrokenPageAnchor = true;
            }
            if (isJustHash || isBrokenPageAnchor || isUnknownPage) {
                if (link.getAttribute('href') !== pathTo404) {
                    console.warn(`[404 Redirect] 將連結 "${href}" 指向 ${pathTo404} (元素: ${link.outerHTML.substring(0, 70)}...)`);
                    link.setAttribute('href', pathTo404);
                }
            }
        } else {
             if (!link.hasAttribute('data-bs-toggle') && !link.closest('.accordion-button')) {
                console.warn(`[404 Redirect] <a> 標籤無 href，將指向 ${pathTo404} (元素: ${link.outerHTML.substring(0, 70)}...)`);
                link.setAttribute('href', pathTo404);
             }
        }
    });
};

const animateValue = (element, start, end, duration) => {
  if (!element || element.dataset.animated === 'true') return;
  const prefix = element.dataset.prefix || '';
  const suffix = element.dataset.suffix || '';
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const currentValue = Math.floor(progress * (end - start) + start);
    const formattedValue = currentValue.toLocaleString('en-US');
    element.innerHTML = `${prefix}${formattedValue}${suffix}`;
    if (progress < 1) { window.requestAnimationFrame(step); } else { element.dataset.animated = 'true'; }
  };
  window.requestAnimationFrame(step);
};

const initNumberAnimations = () => {
  const numberElements = document.querySelectorAll('.number-wrapper .text-success[data-value]');
  if (numberElements.length > 0 && typeof IntersectionObserver !== 'undefined') {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const finalValue = parseInt(element.dataset.value, 10);
          if (!isNaN(finalValue)) {
            animateValue(element, 0, finalValue, 1500);
            observer.unobserve(element);
          }
        }
      });
    }, { threshold: 0.5, rootMargin: '0px' });
    numberElements.forEach(el => observer.observe(el));
  }
};

const showFieldMessage = (field, message, type = 'error') => {
    let messageElement = field.nextElementSibling;
    if (!messageElement || !messageElement.classList.contains('form-field-message')) {
        messageElement = document.createElement('small');
        messageElement.classList.add('form-field-message');
        field.parentNode.insertBefore(messageElement, field.nextSibling);
    }
    messageElement.textContent = message;
    messageElement.classList.remove('form-message-error', 'form-message-success', 'is-visible');
    field.classList.remove('is-invalid', 'is-valid');

    if (message) {
        setTimeout(() => {
            messageElement.classList.add('is-visible');
        }, 10);
        if (type === 'error') {
            messageElement.classList.add('form-message-error'); // CSS 會處理顏色
            field.classList.add('is-invalid');
        } else if (type === 'success') {
            messageElement.classList.add('form-message-success'); // CSS 會處理顏色
            field.classList.add('is-valid');
        }
    }
};

const clearFieldMessage = (field) => {
    showFieldMessage(field, '', 'clear');
};

const validateField = (field) => {
    let isValid = true;
    const value = field.value.trim();
    let errorMessage = "";
    const labelText = field.labels && field.labels[0] ? field.labels[0].textContent : '此欄位';

    if (field.required && value === '') {
        errorMessage = `${labelText}不可空白`;
        isValid = false;
    } else if (field.type === 'email' && value !== '' && !/^\S+@\S+\.\S+$/.test(value)) {
        errorMessage = '請輸入有效的電子郵件地址';
        isValid = false;
    } else if (field.type === 'number' && field.min && parseFloat(value) < parseFloat(field.min)) {
        errorMessage = `數字不可少於 ${field.min}`;
        isValid = false;
    } else if (field.id === 'age' && (parseInt(value) < 12 || isNaN(parseInt(value)))) {
        errorMessage = '年齡必須是12歲或以上';
        isValid = false;
    }else if (field.id === 'phone' && value !== '') { // 針對聯絡電話欄位 (在 volunteerForm 中)
        // 台灣手機號碼格式: 09 開頭，共 10 位數字
        const taiwanMobilePattern = /^09\d{8}$/;
        if (!taiwanMobilePattern.test(value)) {
            errorMessage = '請輸入有效的台灣手機號碼 (例如 0912345678)'; // <--- 新增手機號碼驗證
            isValid = false;
        }
    }

    if (!isValid) {
        showFieldMessage(field, errorMessage, 'error');
    } else {
        clearFieldMessage(field);
        if (field.required && value !== '') {
            field.classList.add('is-valid');
        }
    }
    return isValid;
};

const validateForm = (form) => {
    let allValid = true;
    const fields = form.querySelectorAll('input[required], select[required], textarea[required]');
    fields.forEach(field => {
        if (!validateField(field)) {
            allValid = false;
        }
    });
    return allValid;
};

const displayFormSubmissionMessage = (form, message, type = 'error') => {
    let messageDiv = form.querySelector('#formSubmissionMessage');
    if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.id = 'formSubmissionMessage';
        form.appendChild(messageDiv);
    }
    messageDiv.textContent = message;
    messageDiv.className = '';
    messageDiv.classList.remove('show');
    if (message) {
        messageDiv.classList.add(type);
        setTimeout(() => {
            messageDiv.classList.add('show');
        }, 10);
    }
};

const handleDonationForm = () => {
  const donationForm = document.getElementById('donationForm');
  if (donationForm && typeof emailjs !== 'undefined') {
    donationForm.setAttribute('novalidate', '');
    const submitButton = donationForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton ? submitButton.innerHTML : '確認捐款';
    donationForm.querySelectorAll('input[required], select[required], textarea[required]').forEach(field => {
        field.addEventListener('blur', () => validateField(field));
        field.addEventListener('input', () => clearFieldMessage(field));
    });
    donationForm.addEventListener('submit', function(e) {
      e.preventDefault();
      if (!validateForm(donationForm)) {
        displayFormSubmissionMessage(donationForm, '部分欄位填寫不正確，請檢查。', 'error');
        return;
      }
      if (!submitButton) return;
      submitButton.disabled = true;
      submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>處理中...';
      displayFormSubmissionMessage(donationForm, '', 'clear');
      const templateParams = {
        name: document.getElementById('name')?.value,
        email: document.getElementById('email')?.value,
        donate_amount: document.getElementById('donateAmount')?.value,
        message: document.getElementById('message')?.value || '無留言'
      };
      emailjs.send('service_er51nm8', 'template_hyj2aoa', templateParams)
        .then(function(response) {
          displayFormSubmissionMessage(donationForm, '感謝您的捐款！確認信已發送至您的信箱。', 'success');
          donationForm.reset();
          donationForm.querySelectorAll('.is-valid, .is-invalid').forEach(el => el.classList.remove('is-valid', 'is-invalid'));
          donationForm.querySelectorAll('.form-field-message.is-visible').forEach(el => {
              el.classList.remove('is-visible');
              el.textContent = ''; // 清空文字
          });
        })
        .catch(function(error) {
          displayFormSubmissionMessage(donationForm, '發送確認信時發生錯誤，請稍後再試。', 'error');
        })
        .finally(function() {
          submitButton.disabled = false;
          submitButton.innerHTML = originalButtonText;
        });
    });
  }
};

const handleVolunteerForm = () => {
  const volunteerForm = document.getElementById('volunteerForm');
  if (volunteerForm && typeof emailjs !== 'undefined') {
    volunteerForm.setAttribute('novalidate', '');
    const submitButton = volunteerForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton ? submitButton.innerHTML : '提交申請';
    volunteerForm.querySelectorAll('input[required], select[required], textarea[required]').forEach(field => {
        field.addEventListener('blur', () => validateField(field));
        field.addEventListener('input', () => clearFieldMessage(field));
    });
    volunteerForm.addEventListener('submit', function(e) {
      e.preventDefault();
       if (!validateForm(volunteerForm)) {
        displayFormSubmissionMessage(volunteerForm, '部分欄位填寫不正確，請檢查。', 'error');
        return;
      }
      if (!submitButton) return;
      submitButton.disabled = true;
      submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>處理中...';
      displayFormSubmissionMessage(volunteerForm, '', 'clear');
      const templateParams = {
        name: document.getElementById('name')?.value,
        age: document.getElementById('age')?.value,
        email: document.getElementById('email')?.value,
        phone: document.getElementById('phone')?.value,
        availability: document.getElementById('availability')?.value,
        skills: document.getElementById('skills')?.value,
        motivation: document.getElementById('motivation')?.value
      };
      emailjs.send('service_er51nm8', 'template_9d0dvvb', templateParams)
        .then(function(response) {
          displayFormSubmissionMessage(volunteerForm, '感謝您的申請！我們將盡快與您聯絡。', 'success');
          volunteerForm.reset();
          volunteerForm.querySelectorAll('.is-valid, .is-invalid').forEach(el => el.classList.remove('is-valid', 'is-invalid'));
           volunteerForm.querySelectorAll('.form-field-message.is-visible').forEach(el => {
              el.classList.remove('is-visible');
              el.textContent = ''; // 清空文字
          });
        })
        .catch(function(error) {
          displayFormSubmissionMessage(volunteerForm, '發送申請時發生錯誤，請稍後再試。', 'error');
        })
        .finally(function() {
          submitButton.disabled = false;
          submitButton.innerHTML = originalButtonText;
        });
    });
  }
};

const initQuickDonateAmounts = () => {
  const donateAmountInput = document.getElementById('donateAmount');
  if (donateAmountInput) {
    const quickAmountButtons = document.querySelectorAll('.quick-amount');
    quickAmountButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const amount = btn.dataset.amount;
        if (donateAmountInput && amount) {
            donateAmountInput.value = amount;
            validateField(donateAmountInput);
        }
      });
    });
  }
};

const initContentBlockAnimations = () => {
  const contentBlocks = document.querySelectorAll('.content-block');
  if (contentBlocks.length > 0 && typeof IntersectionObserver !== 'undefined') {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('show'); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.3 });
    contentBlocks.forEach(block => observer.observe(block));
  }
};

const customSmoothScrollTo = (targetPosition, duration = 500) => {
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;
    const easeOutQuad = t => t * (2 - t);
    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);
        const easedProgress = easeOutQuad(progress);
        window.scrollTo(0, startPosition + distance * easedProgress);
        if (timeElapsed < duration) { requestAnimationFrame(animation); }
    }
    requestAnimationFrame(animation);
};

const initSmoothScrolling = () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        if (anchor.classList.contains('back-to-top')) { return; }
        const currentPath = window.location.pathname.split('/').pop();
        const href = anchor.getAttribute('href');
        if (currentPath === 'action.html' && (href === '#share' || href === '#projects')) { return; }
        anchor.addEventListener('click', function (e) {
            if (href === "#" || href === "" || href.length <= 1) return;
            try {
                const targetElement = document.querySelector(href);
                if (targetElement) {
                    e.preventDefault();
                    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                    customSmoothScrollTo(targetPosition, 800);
                }
            } catch (error) { console.warn("Smooth scroll target not found or invalid selector:", href, error); }
        });
    });
};

const initBackToTopButton = () => {
    const backToTopButton = document.querySelector('.back-to-top');
    if (backToTopButton) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) { backToTopButton.classList.add('show'); }
            else { backToTopButton.classList.remove('show'); }
        });
        backToTopButton.addEventListener('click', (e) => {
            e.preventDefault();
            customSmoothScrollTo(0, 800);
        });
    }
};

const initAll = () => {
  initAOS();
  initRippleEffect();
  initNumberAnimations();
  handleDonationForm();
  handleVolunteerForm();
  initQuickDonateAmounts();
  initContentBlockAnimations();
  initSmoothScrolling();
  initBackToTopButton();
  redirectTo404ForInvalidLinks();
};

document.addEventListener('DOMContentLoaded', () => {
    handleLoading();
    initAll();
});