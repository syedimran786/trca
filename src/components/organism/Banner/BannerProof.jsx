import { Box } from "@mui/material";
import hcl from "../../../assets/clients/hcl.jpg";
import infosys from "../../../assets/clients/infosys.jpg";
import accenture from "../../../assets/clients/accenture.png";
import wipro from "../../../assets/clients/wipro.png";
import capgemini from "../../../assets/clients/capgemini.png";
import techmahindra from "../../../assets/clients/tech mahindra.png";
import { heroCopy, placedCount } from "./heroCopy";

/**
 * The proof strip (#9).
 *
 * The evidence that actually persuades someone — students placed at Wipro,
 * Infosys, Accenture, HCL, Capgemini — was real but sat four sections below
 * the fold, under 70 words of mission statement. This puts it above it.
 *
 * The logos are the ones already bundled in src/assets/clients/, so nothing is
 * hotlinked and nothing new is downloaded (#10 covers the hotlinked set
 * elsewhere on the page).
 */

/**
 * Named explicitly rather than sliced off `clients.js`, in this order.
 *
 * That list is ordered for the Clients section and opens with the two names a
 * visitor is least likely to recognise, which is the opposite of what a proof
 * strip needs — and on a phone only the first four are shown. These are the
 * companies the ticket names. Reordering the Clients section is not this
 * ticket's business, so the hero keeps its own order.
 */
const LOGOS = [hcl, infosys, accenture, wipro, capgemini, techmahindra];

function BannerProof() {
  return (
    <Box className="banner-proof">
      {/* Reserved row: it holds the placement count once Uday confirms it, and
          collapses to nothing until then — so turning the number on later
          moves neither the logos nor the button. */}
      {placedCount ? (
        <p className="banner-proof-count">{placedCount}+ students placed</p>
      ) : null}

      <p className="banner-proof-label">{heroCopy.proofLabel}</p>

      <Box className="banner-proof-logos">
        {LOGOS.map((logo, i) => (
          <img
            key={logo}
            src={logo}
            /* The row as a whole is the claim; naming every logo would make a
               screen reader read eight company names between the subhead and
               the button. The label above carries the meaning. */
            alt={i === 0 ? heroCopy.proofLabel : ""}
            loading="lazy"
            width="72"
            height="32"
          />
        ))}
      </Box>
    </Box>
  );
}

export default BannerProof;
