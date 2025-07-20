// Phone Verification System
document.addEventListener('DOMContentLoaded', function() {
  const phoneForm = document.getElementById('phoneVerificationForm');
  const codeForm = document.getElementById('codeVerificationForm');
  const sendCodeBtn = document.getElementById('sendCodeBtn');
  const resendLink = document.getElementById('resendCodeLink');
  const phoneNumberInput = document.getElementById('phoneNumber');
  const verificationCodeInput = document.getElementById('verificationCode');

  // Send verification code
  phoneForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const phoneNumber = phoneNumberInput.value.trim();

    if (isValidPhoneNumber(phoneNumber)) {
      sendCodeBtn.disabled = true;
      sendCodeBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending...';

      // Simulate API call
      setTimeout(() => {
        sendVerificationCode(phoneNumber)
          .then(() => {
            // Show verification code form
            codeForm.style.display = 'block';
            phoneForm.style.display = 'none';
            sendCodeBtn.disabled = false;
            sendCodeBtn.innerHTML = 'Send Code';
          })
          .catch(error => {
            showError('Failed to send verification code. Please try again.');
            sendCodeBtn.disabled = false;
            sendCodeBtn.innerHTML = 'Send Code';
          });
      }, 1000);
    } else {
      showError('Please enter a valid phone number (e.g. 09123456789)');
    }
  });

  // Resend code functionality
  resendLink.addEventListener('click', function(e) {
    e.preventDefault();
    const phoneNumber = phoneNumberInput.value.trim();

    if (isValidPhoneNumber(phoneNumber)) {
      resendLink.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Resending...';

      // Simulate API call
      setTimeout(() => {
        sendVerificationCode(phoneNumber)
          .then(() => {
            showSuccess('Verification code resent successfully!');
            resendLink.innerHTML = 'Didn\'t receive code? Resend';
          })
          .catch(error => {
            showError('Failed to resend code. Please try again.');
            resendLink.innerHTML = 'Didn\'t receive code? Resend';
          });
      }, 1000);
    }
  });

  // Verify code functionality
  codeForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const verificationCode = verificationCodeInput.value.trim();
    const phoneNumber = phoneNumberInput.value.trim();

    if (verificationCode.length === 6) {
      const verifyBtn = document.getElementById('verifyCodeBtn');
      verifyBtn.disabled = true;
      verifyBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Verifying...';

      // Simulate API call
      setTimeout(() => {
        verifyCode(phoneNumber, verificationCode)
          .then(() => {
            // Redirect on successful verification
            window.location.href = "{% url 'home' %}";
          })
          .catch(error => {
            showError('Invalid verification code. Please try again.');
            verifyBtn.disabled = false;
            verifyBtn.innerHTML = 'Verify';
          });
      }, 1000);
    } else {
      showError('Please enter a valid 6-digit code');
    }
  });

  // Helper functions
  function isValidPhoneNumber(phone) {
    return /^09\d{9}$/.test(phone);
  }

  function showError(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      if (form.style.display !== 'none') {
        form.prepend(alertDiv);
      }
    });
  }

  function showSuccess(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show';
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      if (form.style.display !== 'none') {
        form.prepend(alertDiv);
      }
    });
  }

  // API simulation functions
  function sendVerificationCode(phoneNumber) {
    return new Promise((resolve, reject) => {
      // In a real app, this would be an AJAX call to your backend
      console.log(`Sending verification code to: ${phoneNumber}`);
      // Simulate 80% success rate
      Math.random() > 0.2 ? resolve() : reject(new Error('Failed to send code'));
    });
  }

  function verifyCode(phoneNumber, code) {
    return new Promise((resolve, reject) => {
      // In a real app, this would be an AJAX call to your backend
      console.log(`Verifying code ${code} for phone: ${phoneNumber}`);
      // Simulate 80% success rate
      Math.random() > 0.2 ? resolve() : reject(new Error('Invalid code'));
    });
  }
});