(() => {
  'use strict';
  const form = document.getElementById('rosaForm');
  const nameField = document.getElementById('nome');
  const phoneField = document.getElementById('telefone');
  const ageField = document.getElementById('idade');
  const checklist = document.getElementById('examOptions');
  const checklistError = document.getElementById('examError');
  const output = document.getElementById('formResult');
  const sendLink = document.getElementById('sendWhatsapp');
  const privacy = document.getElementById('privacyDialog');
  const noExam = document.getElementById('sem-certeza');
  const options = [...document.querySelectorAll('input[name="interesses"]')];

  function digits(value) { return (value || '').replace(/\D/g, ''); }
  function cleanPhone(value) {
    let n = digits(value);
    if (n.startsWith('55') && n.length >= 12) n = n.slice(2);
    return n;
  }
  function maskPhone(value) {
    const n = cleanPhone(value).slice(0, 11);
    if (!n) return '';
    if (n.length <= 2) return '(' + n;
    if (n.length <= 6) return '(' + n.slice(0, 2) + ') ' + n.slice(2);
    if (n.length <= 10) return '(' + n.slice(0, 2) + ') ' + n.slice(2, 6) + '-' + n.slice(6);
    return '(' + n.slice(0, 2) + ') ' + n.slice(2, 7) + '-' + n.slice(7);
  }

  phoneField.addEventListener('input', () => {
    phoneField.value = maskPhone(phoneField.value);
    phoneField.setCustomValidity('');
    phoneField.removeAttribute('aria-invalid');
  });
  ageField.addEventListener('input', () => ageField.setCustomValidity(''));
  options.forEach(box => box.addEventListener('change', () => {
    if (box === noExam && box.checked) options.filter(el => el !== noExam).forEach(el => el.checked = false);
    if (box !== noExam && box.checked) noExam.checked = false;
    checklistError.textContent = '';
  }));

  document.getElementById('openPrivacy').addEventListener('click', (e) => {
    e.preventDefault();
    if (privacy.showModal) privacy.showModal();
    else privacy.setAttribute('open', '');
  });
  document.getElementById('closePrivacy').addEventListener('click', () => privacy.close());

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const phone = cleanPhone(phoneField.value);
    phoneField.setCustomValidity('');
    ageField.setCustomValidity('');
    if (phone.length !== 11 && phone.length !== 10) {
      phoneField.setCustomValidity('Informe um WhatsApp com DDD válido.');
      phoneField.setAttribute('aria-invalid', 'true');
    }
    const age = Number(ageField.value);
    if (!Number.isInteger(age) || age < 18 || age > 110) {
      ageField.setCustomValidity('Informe sua idade. Este formulário é para maiores de 18 anos.');
    }
    if (!form.reportValidity()) return;
    const selected = options.filter(box => box.checked).map(box => box.value);
    if (!selected.length) {
      checklistError.textContent = 'Selecione pelo menos uma opção.';
      checklist.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const fullName = nameField.value.trim().replace(/\s+/g, ' ').slice(0, 100);
    if (fullName.length < 3) {
      nameField.setCustomValidity('Informe seu nome completo.');
      nameField.reportValidity();
      return;
    }
    nameField.setCustomValidity('');
    const last = document.getElementById('ultimaMamografia').value;
    const message = [
      'Olá, Dra. Joyce! Preenchi o formulário Outubro Rosa e gostaria de receber orientação individual sobre exames.',
      '',
      'Nome: ' + fullName,
      'Idade: ' + age + ' anos',
      'Meu WhatsApp: +55 ' + phone,
      'Gostaria de orientação sobre: ' + selected.join('; '),
      'Última mamografia: ' + last,
      'Modalidade: Particular',
      '',
      'Sei que a solicitação dos exames depende de avaliação médica e que o envio desta mensagem não tem custo.'
    ].join('\n');
    const whatsapp = 'https://wa.me/5527998134032?text=' + encodeURIComponent(message);
    sendLink.href = whatsapp;
    form.hidden = true;
    document.getElementById('formHeading').hidden = true;
    output.setAttribute('aria-hidden', 'false');
    output.querySelector('h2').focus({ preventScroll: true });
    output.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  });

  document.getElementById('backToForm').addEventListener('click', () => {
    output.setAttribute('aria-hidden', 'true');
    form.hidden = false;
    document.getElementById('formHeading').hidden = false;
    nameField.focus();
  });
})();
