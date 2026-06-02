// paystack.js — Payment + FullCalendar (restored from original script.js)

var PAYSTACK_PUBLIC_KEY = 'pk_live_44bc142c7b2b45c51e8fa9212295938ef79d2c94';
var WHATSAPP_NUMBER = '2348137872189';
var isAdmin = false; // set to true only when you want to edit calendar events

export function initPaystack() {
  var payButton = document.getElementById('payButton');
  if (payButton) {
    payButton.addEventListener('click', function () {
      var emailInput = document.getElementById('userEmail');
      var email = emailInput ? emailInput.value.trim() : '';

      if (!email) {
        alert('Please enter your email before proceeding.');
        return;
      }

      var handler = PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: email,
        amount: 500000, // ₦5,000 in kobo
        currency: 'NGN',
        callback: function (response) {
          alert('Payment complete! Ref: ' + response.reference);
          var msg = 'Hello, I have just made a payment. My email is ' +
            encodeURIComponent(email) +
            '. Ref: ' + encodeURIComponent(response.reference);
          window.location.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + msg;
        },
        onClose: function () {
          alert('Payment window closed.');
        }
      });

      handler.openIframe();
    });
  }
}

export function initCalendar() {
  var calendarEl = document.getElementById('calendar');
  if (!calendarEl) return;
  if (typeof FullCalendar === 'undefined') {
    // retry once FullCalendar script has loaded
    setTimeout(initCalendar, 500);
    return;
  }

  var calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    selectable: isAdmin,
    editable: isAdmin,
    height: 'auto',
    expandRows: false,
    handleWindowResize: true,
    windowResizeDelay: 100,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: ''
    },
    views: {
      dayGridMonth: {
        dayMaxEvents: 2
      }
    },
    select: isAdmin ? function (info) {
      var title = prompt('Enter Event Title:');
      if (title) {
        calendar.addEvent({
          title: title,
          start: info.start,
          end: info.end,
          allDay: info.allDay
        });
      }
      calendar.unselect();
    } : null,
    eventClick: isAdmin ? function (info) {
      var newTitle = prompt('Edit event title:', info.event.title);
      if (newTitle !== null) {
        info.event.setProp('title', newTitle);
      }
    } : null,
    events: [
      { title: 'Physics Webinar', start: '2025-06-10' },
      { title: 'Valedictory Service', start: '2025-08-18' }
    ]
  });

  calendar.render();
}