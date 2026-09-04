import React from "react";
import TypoGraphyComponent from "../../atoms/TypoGraphyComponent/TypoGraphyComponent";
import { Box } from "@mui/material";
import ButtonComponent from "../../atoms/ButtonComponent/ButtonComponent";
import { useAuth } from "../../../App";
import { useBatches } from "../Batches/useBatches";
import { parseBatchDate, formatBatchDateShort } from "../Batches/batchDateUtils";

import wipro from "../../../assets/clients/wipro.png";
import infosys from "../../../assets/clients/infosys.jpg";
import accenture from "../../../assets/clients/accenture.png";
import hcl from "../../../assets/clients/hcl.jpg";
import capgemini from "../../../assets/clients/capgemini.png";

const PROOF_LOGOS = [
  { src: wipro, alt: "Wipro" },
  { src: infosys, alt: "Infosys" },
  { src: accenture, alt: "Accenture" },
  { src: hcl, alt: "HCL" },
  { src: capgemini, alt: "Capgemini" },
];

function BannerContent() {
  const { openModal } = useAuth();
  const batches = useBatches();

  // Earliest upcoming batch across all courses
  const nextBatch = Array.isArray(batches)
    ? [...batches]
        .filter((b) => {
          const d = parseBatchDate(b.date);
          return d && d >= new Date();
        })
        .sort((a, b) => parseBatchDate(a.date) - parseBatchDate(b.date))[0]
    : null;

  return (
    <>
      {/* H1 carries the target keyword — "Live Full-Stack Coding Classes in
          Jayanagar, Bengaluru" matches the title tag pattern and the query
          intent ("coding classes Jayanagar" has no dedicated local competitor
          per the SEO audit). The old aspirational headline "Code Your Dreams
          Into Reality" shared zero keywords with the title tag and left the
          page unable to signal what it actually offered. */}
      <TypoGraphyComponent
        variant="h2"
        sx={{ mb: ".5rem", fontSize: "var(--rca-fs-h1)", lineHeight: "var(--rca-lh-tight)" }}
        component="h1"
        text={`Live Full-Stack Coding Classes in Jayanagar, Bengaluru`}
      />

      {/* TODO(copy): Uday to confirm exact placement count + companies before merge */}
      <p className="banner-subhead">
        200+ students placed at Wipro, Infosys, Accenture, HCL &amp; Capgemini
        · 4 months · offline in Bengaluru
      </p>

      <div className="banner-logos" aria-label="Companies our students work at">
        {PROOF_LOGOS.map((logo) => (
          <img key={logo.alt} src={logo.src} alt={logo.alt} className="banner-logo" />
        ))}
      </div>

      <Box className="banner-content-btns">
        <ButtonComponent sx={{ px: "2rem" }} variant="contained" onBtnClick={openModal}>
          Register Now
        </ButtonComponent>
        {nextBatch && (
          <span className="banner-next-batch">
            Next batch · {nextBatch.day} {formatBatchDateShort(nextBatch.date)}
          </span>
        )}
      </Box>
    </>
  );
}

export default BannerContent;
