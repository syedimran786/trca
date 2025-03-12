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
import { reviews } from "./reviews";
import CardGridItem from "../../molecules/Grid/CardGridItem";
import ReviewIcon from "./ReviewIcon";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
4

function ReviewsCard() {
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
      {reviews.map(({ name, branch, image, description, ratings }, id) => {
        return ( 
          // <CardGridItem xs={12} sm={12} md={6} lg={4}>
          <Card sx={{}} className="card" key={id}>
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
            
              
              <ReviewIcon value={ratings}/>
              <TypoGraphyComponent
                variant="p"
                text={description}
                component="p"
                sx={{fontWeight: "normal" }}
              />
             
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

export default ReviewsCard;
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
  
    
    <ReviewIcon value={ratings}/>
    <TypoGraphyComponent
      variant="p"
      text={description}
      component="p"
      sx={{fontWeight: "normal" }}
    />
   
    </CardContent>
</Card>
</CardGridItem> */}