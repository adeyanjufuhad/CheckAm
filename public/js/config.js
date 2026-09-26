// Where testers send reports of mistakes and missed scams.
// These are shown publicly on the site. Change them here only.
export const CONTACT = {
  whatsapp: '2347049294736', // international format, no + or spaces
  email: 'adeyanjufuhad@gmail.com',
};

export function whatsappLink(text) {
  return `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;
}

export function emailLink(subject, body) {
  return `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
