/**
 * Pro Theme JavaScript Enhancements
 */
document.addEventListener('DOMContentLoaded', () => {
  initBackToTop();
  initStickyAddToCart();
  initFreeShippingBar();
  initUrgencyCounter();
  initScrollAnimations();
  initSalesToast();
  initCard3DTilt();
});

/* --------------------------------------------------------------------------
   1. Back To Top
   -------------------------------------------------------------------------- */
function initBackToTop() {
  const btn = document.querySelector('.pro-back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.classList.add('is-active');
    } else {
      btn.classList.remove('is-active');
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

/* --------------------------------------------------------------------------
   2. Sticky Add to Cart Bar (Product Pages)
   -------------------------------------------------------------------------- */
function initStickyAddToCart() {
  const bar = document.querySelector('.pro-sticky-bar');
  if (!bar) return;

  const mainAddToCart = document.querySelector('.product-form__submit') || document.querySelector('[name="add"]');
  if (!mainAddToCart) return;

  // Show/hide on scroll past main CTA
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting && window.scrollY > 300) {
        bar.classList.add('is-visible');
      } else {
        bar.classList.remove('is-visible');
      }
    });
  }, { rootMargin: '0px 0px -50px 0px', threshold: 0 });

  observer.observe(mainAddToCart);

  // Variant selector sync
  const select = bar.querySelector('.pro-sticky-bar__select');
  const stickyBtn = bar.querySelector('.pro-sticky-bar__button');

  if (select) {
    select.addEventListener('change', () => {
      const selectedId = select.value;
      const mainInputs = document.querySelectorAll('input[name="id"], select[name="id"]');
      mainInputs.forEach(input => {
        input.value = selectedId;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  }

  // Handle sticky Add to Cart click
  if (stickyBtn) {
    stickyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      stickyBtn.setAttribute('disabled', 'disabled');
      const originalText = stickyBtn.innerHTML;
      stickyBtn.innerHTML = 'Adding...';

      const variantId = select ? select.value : bar.getAttribute('data-variant-id');
      
      const formData = {
        items: [{
          id: parseInt(variantId, 10),
          quantity: 1
        }]
      };

      fetch(`${window.routes ? window.routes.cart_add_url : '/cart/add.js'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/javascript'
        },
        body: JSON.stringify(formData)
      })
      .then(res => res.json())
      .then(data => {
        stickyBtn.removeAttribute('disabled');
        stickyBtn.innerHTML = 'Added! ✓';
        setTimeout(() => {
          stickyBtn.innerHTML = originalText;
        }, 1800);

        // Open cart drawer if available
        const cartDrawer = document.querySelector('cart-drawer');
        if (cartDrawer) {
          cartDrawer.renderContents && fetch(`${window.routes ? window.routes.cart_url : '/cart'}?section_id=cart-drawer`)
            .then(response => response.text())
            .then(html => {
              const parser = new DOMParser();
              const doc = parser.parseFromString(html, 'text/html');
              const newInner = doc.querySelector('#CartDrawer');
              const currentDrawer = document.querySelector('#CartDrawer');
              if (newInner && currentDrawer) {
                currentDrawer.innerHTML = newInner.innerHTML;
              }
              cartDrawer.open();
              updateFreeShippingProgress();
            });
        }
      })
      .catch(err => {
        console.error('Error adding to cart:', err);
        stickyBtn.removeAttribute('disabled');
        stickyBtn.innerHTML = originalText;
      });
    });
  }
}

/* --------------------------------------------------------------------------
   3. Dynamic Free Shipping Progress Bar
   -------------------------------------------------------------------------- */
function initFreeShippingBar() {
  updateFreeShippingProgress();

  // Listen for cart changes (Dawn pubsub / fetch events)
  if (window.subscribe) {
    subscribe(PUB_SUB_EVENTS.cartUpdate, () => {
      updateFreeShippingProgress();
    });
  }

  // Intercept cart fetch calls to re-calculate
  const originalFetch = window.fetch;
  window.fetch = function () {
    return originalFetch.apply(this, arguments).then(response => {
      const url = arguments[0];
      if (typeof url === 'string' && (url.includes('/cart/add') || url.includes('/cart/change') || url.includes('/cart/update'))) {
        setTimeout(updateFreeShippingProgress, 400);
      }
      return response;
    });
  };
}

function updateFreeShippingProgress() {
  fetch('/cart.js')
    .then(res => res.json())
    .then(cart => {
      const bars = document.querySelectorAll('.free-shipping-bar');
      bars.forEach(bar => {
        const threshold = parseFloat(bar.getAttribute('data-threshold') || 5000); // default 50.00
        const currentTotal = cart.total_price;
        const progressEl = bar.querySelector('.free-shipping-bar__progress');
        const textEl = bar.querySelector('.free-shipping-bar__text');

        const percentage = Math.min(100, Math.round((currentTotal / threshold) * 100));
        if (progressEl) {
          progressEl.style.width = `${percentage}%`;
        }

        if (currentTotal >= threshold) {
          bar.classList.add('free-shipping-bar--unlocked');
          if (textEl) {
            textEl.innerHTML = '🎉 <strong>Congratulations!</strong> You get <strong>FREE Standard Shipping</strong>!';
          }
        } else {
          bar.classList.remove('free-shipping-bar--unlocked');
          const remaining = ((threshold - currentTotal) / 100).toFixed(2);
          if (textEl) {
            textEl.innerHTML = `Add <strong>$${remaining}</strong> more to unlock <strong>FREE Shipping</strong>!`;
          }
        }
      });
    })
    .catch(() => {});
}

/* --------------------------------------------------------------------------
   4. Live Urgency Counter
   -------------------------------------------------------------------------- */
function initUrgencyCounter() {
  const viewerCounters = document.querySelectorAll('.pro-viewer-count');
  if (!viewerCounters.length) return;

  viewerCounters.forEach(el => {
    let base = Math.floor(Math.random() * (28 - 14 + 1)) + 14;
    el.textContent = base;

    setInterval(() => {
      const delta = Math.floor(Math.random() * 5) - 2;
      base = Math.max(8, Math.min(42, base + delta));
      el.textContent = base;
    }, 7000);
  });
}

/* --------------------------------------------------------------------------
   5. Scroll-Triggered Reveal Animations
   -------------------------------------------------------------------------- */
function initScrollAnimations() {
  const animatedElements = document.querySelectorAll('.pro-animate-on-scroll');
  if (!animatedElements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.15
  });

  animatedElements.forEach(el => observer.observe(el));
}

/* --------------------------------------------------------------------------
   6. Live Sales Toast Popup
   -------------------------------------------------------------------------- */
function initSalesToast() {
  const toast = document.getElementById('proSalesToast');
  if (!toast) return;

  const customers = [
    { name: 'Alex M. from California', time: '2 minutes ago' },
    { name: 'Liam K. from London, UK', time: '4 minutes ago' },
    { name: 'Marcus D. from Texas', time: '1 minute ago' },
    { name: 'Sophia R. from New York', time: '7 minutes ago' },
    { name: 'David B. from Toronto, CA', time: '3 minutes ago' },
    { name: 'Ethan W. from Florida', time: '5 minutes ago' }
  ];

  let index = 0;

  function showToast() {
    const customer = customers[index % customers.length];
    const nameEl = document.getElementById('proToastCustomer');
    const timeEl = document.getElementById('proToastTime');

    if (nameEl) nameEl.textContent = customer.name;
    if (timeEl) timeEl.textContent = `${customer.time} • Verified Buyer ✓`;

    toast.classList.add('is-active');

    setTimeout(() => {
      toast.classList.remove('is-active');
    }, 5500);

    index++;
  }

  // Initial show after 4 seconds, then repeat every 18 seconds
  setTimeout(showToast, 4000);
  setInterval(showToast, 18000);
}

/* --------------------------------------------------------------------------
   7. 3D Card Interactive Tilt Effect
   -------------------------------------------------------------------------- */
function initCard3DTilt() {
  const cards = document.querySelectorAll('.pro-card-3d');
  if (!cards.length) return;

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    });
  });
}

