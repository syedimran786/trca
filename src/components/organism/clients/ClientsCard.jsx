import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { clients } from "./clients";

import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

/* Company wordmarks our students were placed at (#169). Logos only — the
   commented-out card body that used to carry a name, branch, rating and
   description was never populated for this section and has been removed. */
function ClientsCard() {
  const settings = {
    dots: true,
    infinite: true,
    slidesToShow: 5,
    slidesToScroll: 1,
    autoplay: true,
    arrows: false,
    autoplaySpeed: 3000,
    cssEase: "linear",
    pauseOnHover: true,
    lazyLoad: true,
    initialSlide: 1,
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 3, slidesToScroll: 3, infinite: true, dots: true },
      },
      {
        breakpoint: 600,
        settings: { slidesToShow: 2, slidesToScroll: 2, initialSlide: 2 },
      },
      {
        // slick compares against integer widths; 479.98 came from the CSS
        // breakpoints and never matched cleanly.
        breakpoint: 480,
        settings: { slidesToShow: 1, slidesToScroll: 1 },
      },
    ],
  };

  return (
    <section className="slider-container">
      <Slider {...settings}>
        {clients.map(({ image, name }, id) => (
          <Card className="card" key={id}>
            <CardContent className="card-content">
              <img src={image} alt={name} loading="lazy" />
            </CardContent>
          </Card>
        ))}
      </Slider>
    </section>
  );
}

export default ClientsCard;
