import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import { scroller } from "react-scroll";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import CallIcon from "@mui/icons-material/Call";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import InstagramIcon from "@mui/icons-material/Instagram";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import {
  ADDRESS,
  EMAIL,
  MAP_URL,
  PHONE_DISPLAY,
  PHONE_TEL,
  SOCIAL_PROFILES,
  WHATSAPP_URL,
} from "../../../data/contact";
import { trackLead } from "../../../lib/analytics";
import "./FooterComponent.css";

/**
 * The site footer (#107).
 *
 * What this replaces: four equal columns where the fourth held nothing but an
 * orange map pin, a "Who Are We" heading over a flat list of eight links that
 * had grown one page at a time, a phone number and an email address that were
 * plain text rather than a `tel:` and a `mailto:`, and a quote set justified
 * so it opened rivers down the middle of a 280px column.
 *
 * Three columns now, because there were only ever three things here: who we
 * are, where to go, and how to reach us. The map pin folds into the address
 * it belongs to.
 */

/* The list had grown one page at a time under a single "Who Are We" heading,
   which by the end covered courses, reviews, placements, parents, FAQs, a blog
   and a contact page. Grouped by what a visitor is looking for instead.
   
   `id` is a section of the homepage, `to` is a route. They are mixed inside a
   group deliberately: "Success stories" belongs next to "Reviews" because both
   are proof, and which one happens to be a route is not the visitor's problem. */
const LINK_GROUPS = [
  {
    heading: "Explore",
    items: [
      { label: "Courses", id: "Courses" },
      { label: "Reviews", id: "Reviews" },
      { label: "Success stories", to: "/placements" },
    ],
  },
  {
    heading: "Academy",
    items: [
      { label: "About us", to: "/about" },
      { label: "For parents", to: "/for-parents" },
      { label: "FAQs", to: "/faq" },
      { label: "Blog", to: "/blog" },
      { label: "Contact", to: "/contact" },
    ],
  },
];

/* Keyed by SOCIAL_PROFILES[].id. data/contact.js stays JSX-free, so the icon
   lives here rather than in the data. An unrecognised id renders its label as
   text instead of disappearing. */
const SOCIAL_ICONS = {
  instagram: InstagramIcon,
  linkedin: LinkedInIcon,
};

const QUOTE =
  "In the world of technology, persistence is more valuable than talent. " +
  "Never give up on your dreams, no matter the obstacles.";

function FooterComponent() {
  const navigate = useNavigate();
  const location = useLocation();

  // On the homepage, scroll. From anywhere else, go home and let Home scroll
  // once it has mounted. Mirrors the navbar.
  const goToSection = (id) => {
    if (location.pathname === "/") {
      scroller.scrollTo(id, { smooth: true, offset: -62, duration: 400 });
    } else {
      navigate("/", { state: { scrollTo: id } });
    }
  };

  return (
    <footer className="footer">
      <div className="footer-grid">
        {/* --- who we are --- */}
        <div className="footer-col footer-brand">
          <h2 className="footer-heading">Rest Coder Academy</h2>
          <p className="footer-quote">{QUOTE}</p>

          <ul className="footer-social" aria-label="Contact the academy">
            <li>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Message us on WhatsApp"
                onClick={() => trackLead("whatsapp_footer")}
              >
                <WhatsAppIcon fontSize="small" />
              </a>
            </li>
            <li>
              <a
                href={`tel:${PHONE_TEL}`}
                aria-label={`Call ${PHONE_DISPLAY}`}
                onClick={() => trackLead("call_footer")}
              >
                <CallIcon fontSize="small" />
              </a>
            </li>
            <li>
              <a href={`mailto:${EMAIL}`} aria-label={`Email ${EMAIL}`}>
                <MailOutlineIcon fontSize="small" />
              </a>
            </li>
            {SOCIAL_PROFILES.map((profile) => {
              const Icon = SOCIAL_ICONS[profile.id];
              return (
                <li key={profile.href}>
                  <a
                    href={profile.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={profile.label}
                  >
                    {Icon ? <Icon fontSize="small" /> : profile.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        {/* --- where to go --- */}
        <nav className="footer-col footer-nav" aria-label="Footer">
          {LINK_GROUPS.map(({ heading, items }) => (
            <div className="footer-nav-group" key={heading}>
              <h2 className="footer-heading">{heading}</h2>
              <ul className="footer-links">
                {items.map(({ label, to, id }) => (
                  <li key={to || id}>
                    {to ? (
                      <RouterLink to={to}>{label}</RouterLink>
                    ) : (
                      /* Was an <li onClick>, so these two were not focusable
                         and could not be operated by keyboard at all, while
                         the six beside them were anchors. A button is the
                         honest element for something that scrolls rather than
                         navigates, and it is in the tab order. */
                      <button type="button" onClick={() => goToSection(id)}>
                        {label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* --- how to reach us --- */}
        <div className="footer-col footer-contact">
          <h2 className="footer-heading">Visit us</h2>
          <address>
            {ADDRESS.street}
            <br />
            {ADDRESS.locality}
            <br />
            {ADDRESS.city}, {ADDRESS.region} {ADDRESS.postalCode}
          </address>

          <ul className="footer-contact-list">
            <li>
              <a href={`tel:${PHONE_TEL}`} onClick={() => trackLead("call_footer")}>
                {PHONE_DISPLAY}
              </a>
            </li>
            <li>
              <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
            </li>
            <li>
              <a
                className="footer-map"
                href={MAP_URL}
                target="_blank"
                rel="noreferrer"
              >
                <PlaceOutlinedIcon fontSize="small" aria-hidden="true" />
                Open in Google Maps
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Rest Coder Academy. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default FooterComponent;
