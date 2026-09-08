import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TypoGraphyComponent from "../../atoms/TypoGraphyComponent/TypoGraphyComponent";
import ButtonComponent from "../../atoms/ButtonComponent/ButtonComponent";
import { CardMedia, colors, List, ListItem, ListItemText } from "@mui/material";
import usePlacements from "./usePlacements";
import CardGridItem from "../../molecules/Grid/CardGridItem";

import { useRef } from "react";
import Slider from "react-slick";
import CarouselControls from "../../molecules/Carousel/CarouselControls";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import ClientIcon from "../reviews/ReviewIcon";
import PlacementIcon from "./PlacementIcon";
import InstagramEmbed from "./InstagramEmbed";

function PlacementCard() {
  const sliderRef = useRef(null);
  // Reads D1 via /api/placements/list, falling back to the bundled array (#145).
  const { placements } = usePlacements();

   const settings = {
  
      dots: true,
      infinite: true,
      slidesToShow: 4,
      slidesToScroll: 1,
      autoplay: true,
      // Slick's arrows are replaced by the control bar under the track
      // (#106) — they were positioned off the edge of the viewport.
      arrows: false,
      appendDots: (dots) => <CarouselControls sliderRef={sliderRef} dots={dots} />,
      // speed: 100,
      autoplaySpeed: 3000,
      cssEase: "linear",
      pauseOnHover: true,
      // A keyboard user tabbing into the track deserves the same pause a
      // mouse user gets by hovering it.
      pauseOnFocus: true,
      lazyLoad: true,
      initialSlide:1,
      responsive: [
          {
            breakpoint: 1024,
            settings: {
              slidesToShow: 3,
              slidesToScroll: 3,
              infinite: true,
              dots: true
            }
          },
          {
            breakpoint: 600,
            settings: {
              slidesToShow: 2,
              slidesToScroll: 2,
              initialSlide: 2
            }
          },
          {
            breakpoint: 479.98,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1,
            }
          }
        ]
    };
  return (
    <>
      <section className="slider-container">
      <Slider ref={sliderRef} {...settings} className="ss">
      {placements.map(({ name, designation, image, company, instagram_url }, id) => {
        // If this placement has an IG post URL, the embed is the whole card —
        // it carries the photo, the salary, the caption and the IG branding
        // that a screenshot could never match. Photo, designation and company
        // become optional; the wrapper card still holds the layout so heights
        // stay consistent across the carousel row.
        if (instagram_url) {
          return (
            <Card sx={{}} className="card card--instagram" key={id}>
              <CardContent className="card-content">
                <InstagramEmbed url={instagram_url} alumnusName={name} />
              </CardContent>
            </Card>
          );
        }
        return (
          // <CardGridItem xs={12} sm={12} md={6} lg={4}>
          <Card sx={{}} className="card" key={id}>
            <CardContent className="card-content">
              <img src={image} alt={name} />
          {/* <hr /> */}

          <Box className="name-desig">
          <TypoGraphyComponent
                variant="h6"
                text={name}
                component="h3"
                sx={{fontWeight: "bold" }}
              />
              <TypoGraphyComponent
                variant="p"
                text={designation}
                component="p"
                sx={{fontWeight: "bold",color:"var(--rca-navy)"}}
              />
          </Box>

             {/* <Box className="card-text">

              <PlacementIcon value={ratings}/>
              <TypoGraphyComponent
                variant="p"
                text={description}
                component="p"
                sx={{fontWeight: "normal" }}
              />
             </Box> */}
             <Box className="company">
              {/* The logo is bundled, so it cannot 404 — but if a placement is
                  ever added without one, the company name in text is far better
                  than a broken image in the section that does the persuading. */}
              {company?.logo ? (
                <img
                  src={company.logo}
                  alt={company.name}
                  width={200}
                  height={50}
                />
              ) : (
                <span className="company-name">{company?.name}</span>
              )}
             </Box>
              </CardContent>
          </Card>
          // </CardGridItem>


        );
      })}
       </Slider>
      </section>
    </>
  );
}

export default PlacementCard;
{/* <CardGridItem xs={12} sm={12} md={6} lg={4}>
<Card sx={{}} className="card">
  <CardContent className="card-content">
    <img src={image} />

    <TypoGraphyComponent
      variant="h6"
      text={name}
      component="h6"
      sx={{fontWeight: "bold" }}
    />
    <TypoGraphyComponent
      variant="p"
      text={branch}
      component="p"
      sx={{fontWeight: "bold",color:"gray"}}
    />
  
    
    <ClientsIcon value={ratings}/>
    <TypoGraphyComponent
      variant="p"
      text={description}
      component="p"
      sx={{fontWeight: "normal" }}
    />
   
    </CardContent>
</Card>
</CardGridItem> */}