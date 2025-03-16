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
import { placements } from "./placement";
import CardGridItem from "../../molecules/Grid/CardGridItem";

import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import ClientIcon from "../reviews/ReviewIcon";
import PlacementIcon from "./PlacementIcon";
4

function PlacementCard() {
   const settings = {
  
      dots: true,
      infinite: true,
      slidesToShow: 3,
      slidesToScroll: 1,
      autoplay: true,
      arrows:false,
      // speed: 100,
      autoplaySpeed: 3000,
      cssEase: "linear",
      pauseOnHover: true,
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
              slidesToScroll: 1
            }
          }
        ]
    };
  return (
    <>
      <section className="slider-container">
      <Slider {...settings} className="ss">
      {placements.map(({ name, branch, image, description, ratings }, id) => {
        return ( 
          // <CardGridItem xs={12} sm={12} md={6} lg={4}>
          <Card sx={{}} className="card" key={id}>
            <CardContent className="card-content">
              <img src={image} />
          {/* <hr /> */}

          <Box className="name-desig">
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
          </Box>
             
             <Box className="card-text">
            
              {/* <PlacementIcon value={ratings}/> */}
              <TypoGraphyComponent
                variant="p"
                text={description}
                component="p"
                sx={{fontWeight: "normal" }}
              />
             </Box>
             <Box className="company">
              <img src={"https://community.sap.com/legacyfs/online/storage/blog_attachments/2016/07/sap_hybris_blue_800_995491.jpg"} alt="" />
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