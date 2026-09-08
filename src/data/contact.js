/**
 * The academy's contact details, in one place (#107).
 *
 * These were written out separately in Contact.jsx, FooterAddress.jsx,
 * FloatingIcons.jsx and index.html's JSON-LD, and had already drifted — the
 * footer showed the phone as a bare "8073762257" while every other surface
 * showed "+91 80737 62257". A visitor comparing the two has to wonder which
 * is right.
 *
 * index.html's structured data is static markup and still holds its own copy;
 * anything rendered by React should read from here.
 */

export const PHONE_DISPLAY = "+91 80737 62257";
export const PHONE_TEL = "+918073762257";
export const WHATSAPP = "918073762257";
// enquiry@restcoderacademy.com hard-bounces: the .com lapsed at GoDaddy and
// the .in has no MX record, so mail to it is lost silently (#130).
export const EMAIL = "restcoderacademy@gmail.com";

export const ADDRESS = {
  street: "#364, 3rd Floor, 16th Main, 4th T Block East",
  locality: "Pattabhirama Nagar, Jayanagar",
  city: "Bengaluru",
  region: "Karnataka",
  postalCode: "560041",
};

export const MAP_URL = "https://maps.app.goo.gl/XdZWt3oDzGUCL5KWA";

export const WHATSAPP_URL =
  `https://wa.me/${WHATSAPP}?text=` +
  encodeURIComponent("Hello! Can I get more info on courses and placements.");

/**
 * The academy's institutional social profiles.
 *
 * These were unconfirmed when #107 was written and the row rendered empty
 * rather than pointing at a guessed handle. #143 confirmed both against the
 * live accounts, so the row renders now. `id` selects the icon in
 * FooterComponent — this file stays JSX-free so it can be imported from
 * anywhere, including tests and non-React code.
 */
export const SOCIAL_PROFILES = [
  {
    id: "instagram",
    label: "Rest Coder Academy on Instagram",
    href: "https://www.instagram.com/restcoderacademy/",
  },
  {
    id: "linkedin",
    label: "Rest Coder Academy on LinkedIn",
    href: "https://www.linkedin.com/company/rest-coder-academy/",
  },
];
