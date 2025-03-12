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
              <img src={"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAACoCAMAAABt9SM9AAAAulBMVEX///8AfbcAuegAe7YAfbUAdrQAerYAeLUAcrIAcbEAfrUAdLMAe7UAeLYAd7IAdrUAcLL4+/3k7/bc6fIAtufP4e2Kt9bt9fkAcq/l7/aewtsAvOi+1eVCksEAb66myN8ui75uqM6wy956sNFiocqGtNFmo8rI3eqUvdhUmMQTq9oZg7g3wenT7/k/kcKkyN8UmcsRkMaq4PO85vZ30e+FtNaZ2vGC0+1cyuvh9fsdhLcAa7IAterJ6fUF7NyFAAAP/0lEQVR4nO1ciXLbOBIVDRC8L8kSZVmyTusIE2eOOJtJsv//W9vdAEFQd1JO1jXGq5oaSwZJ4KH79QE6nY6FhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhcWrQr/80Ss208flcrvo/YrZvG7083z+I8se73I/SwBp7ox+2axeJxY5D8Vw179y+KaKhKPhimuv+1dgmdOqhb/rXjN85TMYHcJ/jK5j+eZXz/BncbcpXvaGvSrj0ka4yJeXn+8wGi5c3wt8SVf+w4r3e7B+8L8tXvKGg9xwKcdLxueH94YcuWL+EjVuU9HF8e4lZ/RieHZDh327eiPLSV6dVZRNmDpt+Otz47uR1KmnegoVueTDqzStgDkxT682rUSc9ZFilTuc8zZbXnh3+gKGo5k719/0fCTr+hn9RhQPMLPQvXZqC7ADnm5P/fpjlCFXe2Q5LDjpipMYBxtcdTozNC1vcO0KficqwX5AT7cuknViId2Zy5zjyD8ev+QjOSF7Mr8beK+WrH7ueflJU9nHGHyEB8cD+yCIT1CFbB19RDGkX0atvVqkr9UNQbK3jz+Q1UwiLzgq2L3KdU7Z1UnbWqaYWmXT1pfj7NUK/I9i8XhUf0aYhp4jy8kPryspd02cvSeAa+av0gtfCDv/LFEE/yAmkjo50Z7H9VjkXq0LL4r+fL39+QR9vFwNrvCH0vEuUgV2V+1fR5GQpYf3++kJmyjG2/l6OTqdtkh0H9fK5iGbFmlyVYF2BBNfiOSI++w/zoPkaz9dOIL9CNeP8CLvckEEKMo9BktJQrndzZ7mR0S3t8ozTwiW5i1FvIPxs93AYCTNvJxse5HHtIzW8PZTy13Vqna3T7PaB2YyF89brZbigPluimu+gqwwaO+y8sLLLYbFKgz83Fs3M3908hwroqmfCMaEP9u3n/lDHZpZbn6d0/gkaBK7JxAQjj/AMlBLDAkoJkFuZoCdTcCEMD6HjKm9WKq2Sct9VrnvtidWZuEVRMk7tSs+yj6d4QWmOqMkinEkjzMtKKsQNHDcmeahvHOctfawK3UhSbLIzxqyQC7UeJ7qqUzg3kGJKaRcBmN6fBU73DfZGkOaGRlmDKUZn+EPvbzW7MhwxJ1wvBbZkNVeyxVMqmWkFAvFhZIZUhKGK4CHJJFuC249Dv4roynbWyJcQ+tmUTUY93pjfVEhPKTJp9Q5qlMZWJETwbwYo8qL87RmY5Dhx8Cw/GkCszB6k0gWbfYucdQ2mOtZM4d9NRezPpOJNogFgPPY5JmKQMd7PsvVOCAuROZGURRoD1kAHWw3h2e7nhMxmGjSSN+di5dks30lm3gweb7oLeSU628ZkbXBeA4DOK+ltcBvODfdYQDCZNYvIYx/wCfCroXMpVZT3sRTJMsMX5sAJipOcVRTVf0B+DNk3PS5Ma3pfKq+yFEMRTSZ9u/u+iNtmGMfrCBEm4B97tGmBnqSDlb7/qMcOJ+P9TVgPB7qXh+3yVc3Q83yu50lXOMOVqwpvtCwEEZ+vBbtgJSqYA7qy9lsQe0lo86es7bKVJfzKxa+uyfcvGt59FTq+7lgu8lDICWbHHTzabl4NclrHytMt456K7hvqDx2/E24K/U9UqpyOlTLelG4ApA1kEU26fRxAwP5C0/Ji9uEU7RCYZAVwOpmHXRhsIhCzko03oPcPjSjx/5FrvifN/c3wBTg/pYZTxqlSHR2JhiWkcPDMKrtvrfRe9yTRaWYdPTia7GY+nBRPWP4Re1GwCi4mPx5LhzuKQ7wTlWnCwtxx7R8tDPABsbHuJ+GCmHPxSCrQLKg+OuBhbkfFfGM69+jnRpk7S55oMP+JJ4k7t8ZkXVLlnWOrB3IXBjVQrXMg9pIOr0IN9Px+82tlDr0hyg0dXzPiQl5udfsOpElLQuDBISsqSstKmR1vAO/jCdbzJ6i+qk41iQLGfZgejiKVICSoUBv6a5lWUV+0bAqxdWt/F+bLHE2zdqQVddlez93mCarK8mq70byN8TpSpPzRvUwR6tGZXgUrsKV/o8uDEYGRkAWtNMOCnYPJpZK+e/osZwZfUr4nE6xKafMb4Pz0NGU5LDRrE160Ojbd8KbNt418kO71kpb9kBGrXPAuceE7nt1yf11YCLRirpy+k4j9vS9/ED76qqH4dUqQ17A+pIFShYxPBeKaojVqPQoO1qyp2mbrDF8xpZJUG9DGRg7Jc20IWuUnueKiXf3bbJuG7JGCV58OhpuWrKNe9ykx12Mho1VEkcY/4cy6VJSRkwQidLIuLIR/LpOgObgOdkC1NEZ4t2ePRXvRhmtemQ4b2eOExbavKnzBlaJW6JiK2emwuP+BHr00jtvWSBYe2TdfGge5Zkecwgwbid0NT1kGfUnmaPp3FySVU5Vn0gXoaQhkiH0z5ossmi1C1gceItNqu5G5KDn72K6EMMjBTyigshq9P4Z064R8MqYmtlKGMNLzBEbsuYXug3sZp+s24Ysshwz0rbRQ5Nu1BRNvmGHrm2yY3I3tkb5cUxrfWLa90jMJFkD8gf1FPw6W4B+yjWi0REdrvSgMm9cqaTiSjSyu/NI4FHvlLmNPMOY+j7UBE2OeoGs5I8DwzIsS+pOux4wQIHW1VkYxU6/DjTkXw3PMr9lIYtomM7dKP5IyekO69ttcs7CupfyjE9Jpzuuks2xsiSwVXl2ibwOpUGOI8p+GxVKpRVzpv2DFN7v6kkCWTo2Ds6TVe0zBZZlNNfk6WpwvN22obAW6fp413gUUpdBZu/p6kfmt07s9iGnaHR8TDm4kj0wVI5r6qH4ubXFUpcongiHZcQp2ihzUI7ClAhYwYBUMrtMiCx9YlD6WF0sMdtylXqSwtc7vMTyx9civdg/UG1BvDsk673Bx4RqNPd4Cl+RGDYe77fGrmLHLCwwh3K4OythsawZtiK592Thg3UcZJDIRpjVuqMiFN5NroqSDZ+iIgk+lYPqDjHjzNwxsme2RlnTzoYjajObYanWLK93LoEXfxz44M3tXwYf24ScZ9U5AqkrDVlj+qyjgSMgz2pStAktYkAzYtqWyge6hyrmMAlgbEFk1lwVbtNeko9CM0FphLQlUA+uCwUghWEa5td7NKeMvIJlNGEan6Lkoczx3lkTwM7EQsYOBevmxiREUT080kXuB7xN1o5a0LVKodwxvcXFOsHHkceSHyj+17K8UGntlOwAHbNpUa08vYA63SDLKsthXU9jQ0Hm8POYV2hMukXlyboY7tHEIRQEFtKPC9eccgc7ZicL6YMUCw3r7xYllZzmYTwsU0duea1ZPV+Sp3ZwREdoSu4Xnnkqi8LAh3jZIpK9LhXrS+UFwtepG5SRTvKklqxaRV/hY9oDUuobeiqHL3wnecYwUXddxq7OmxpBoCRGijpEKMyqY72qIjhFFjvmhJ/anNBmO9zfr3hKHkMsMqMhyBvphdKGqnGcYuXTlOuoQ2rmVL1iBIVwssa0SZpI8ZUuip90zBgHYBMrGUmx76qv97ZrpqMEtWUGpIvg91zXjp2nJscMmj4t2mqG9+qCjeM8faNmyU6QhTXh7d+3N5qy+wOutCEnbUfsOVg1kqSrlsEWjQT1QoasRUTzxBje4zLGaN9Qa48i9IcJbjQJSncZyWc1OzMClplb1BWSmsMzLkiIRrMp3feKMfo3Zfg8ntGDIvBU9fJd2EweY02Cs4YIG+O1Zv/rVENLynlZF9D74i4xpcgN1mo2rEZD2Ny8S9kwNfc6A9CNZIChlzLHEt8+QSPBHoNq1EY6AQkb445KIot3+qtIhKE8VVFdjP4EJQVfMQxobJ3uLSTZuvujToIFyKI7wkICbpPBzvQhA8mVa5stLsqP/UUxz0CuCtT4YZMble4RpoT4dK8Shc83txL/OXYaOFOJmv+ofltMKyjOKWeUDT53tnIyyIzioqBa8bkcq7YQ7Cdom3QFv6kw+7kje+n4sqWMIbsoDsMQpI02No13z/PKF7DqALdi0nprp6caKU0UmyhzkCUNbaHHqjR03EFHunarGUATcjMYFvQpO0yMvrQy4xZX8d2Xey3oH/76/PmvD52jKOsA4fmT5+12+eTjfvMhnSbsBBlDgscV+DIK9XnjoavOL5yvnaXseoSZGSMW9IIKd9O+rhLAqtL0sbjL1AuZgv7PZE+fSpTGOwM5oVyfYY3VAmWXtZRtR5gXWjkleK3DEoor2jb72AHLjK59N9zL4yE5LG9Va/Sf4yQ1VPt1+5B5nidk00CdxRVctxblN06ihgrq9s06XwVZkdtO1bprHvjVAK2/K+2ERYzO5e/MqXp+0/5zjIKPHqobFx3ZaYHhu3ov6vmWmOLgeVG7FzCTs2TUA9phmuYbJ57FPDAaph6KwhetVO1k4Qhb3n6z1YvrXS5nfuKETGRC2vldnIBDMs+5UyXcE9gMF/njwV2lTBRbeZbiz7SXznMKKnBPf1WvYO46QePGUrTMFzDQPFik2RvlAswqlXndk+fEhrzTrBlERCbki1lFhQXkN3OGvVXkJ17CvMzn+HLE5++NrL///N8TPqjWtYvMGCGCuVEsTmdBEE90YlQseZ5/3aoQ9QR1qx9FqxN/nFA+pqk8xjVTk7vBbOj78WRrHBXvHsy3qOicskXA2HkIjVdV+rsogJJQzujp4ev+aThkM4G3UtlEMR8+hNO9AePtereay8MqgytMGb5fsK7NJCDpYjHs93p/6Xt1dkGfp646suqd+jOOYhDVhevBmXexX7u3PmNXLO+fGdBpvbpytA/Q+vLcey7lF4Or+9vbL5dfiumO1k9hWE2W4yvf+NmmIW+/XLmHhYfe5F33gsAeRk518WWYF0Hx4ZORWsGPX8764M9iUOdcJ2ZBrp24227UOpt6ZfjyvTar29vv399//kVvO1LIPtU27PQYJg85KDhV3Afvhb0a/PP5y/v7m/v3Xz59/u8L/5mLgSUmmKdIgMwPX0NayB+ds+76FjD3ODvlXmUCv4pFfaxsHse8TVDz/4RwP+GpUCz9H/MxftWrhf9iAFmxkx/91cI3uj6YYpw+bHsjIM06ftRRmW+6YCA40eR/OyCy/GMvFtNxoz5/ql/re9PA1ySPs0C5vW6KYAsnODLqTWGRhqFu/LaARy6iLuS6eDQ5OTLqTaGPjeWjf/iHzbnMeO2Fe/+fv9Z4RShyIOvon9lhpz6tJR3fCAzeumRhMsX3X6uXoON21RLBRpSY/c5pvU6Mh9x40c0AvX6hWKxYqzv/drEaMnbsD3DpVUY6BCwm4lVX0b8T0wn/eiwcgk5xx19t59RQ3O/iWbTQw78z4Cyl7nv+1kudSxjTv5aApz7CcnURvSr36N9LOvzLDItD9Lfz+XLxs3+TamFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFh0cb/AKzf9uzWqpBgAAAAAElFTkSuQmCC"} alt="" />
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