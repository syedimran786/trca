import React from "react";
import TypoGraphyComponent from "../../atoms/TypoGraphyComponent/TypoGraphyComponent";
import { Box, colors, Link } from "@mui/material";
import ButtonComponent from "../../atoms/ButtonComponent/ButtonComponent";
import { useAuth } from "../../../App";

function BannerContent() {
  let {openModal}=useAuth()
  let quote = `, we are dedicated to shaping the future of coding. Our mission is to provide quality training that empowers individuals to master the skills needed for success in the tech industry. With expert instructors, practical courses, and a passion for innovation, we strive to create an environment where learners thrive and unlock their full potential. Join us as we build the next generation of coders, one line of code at a time.`;
  return (
    <>
      <TypoGraphyComponent
        variant="h2"
        sx={{mb:".6rem"}}
        component="h2"
        text={`Code Your Dreams Into Reality`}
      />
      {/* <TypoGraphyComponent
        variant="h4"
        sx={{fontSize:"2.6rem"}}
        component="h4"
        text={`Unlock Your Future with Code`}
        className="color-blue"
      /> */}
      <TypoGraphyComponent
        variant="body"
        sx={{my:"1rem",color:"#45545d",fontSize:"1.1rem"}}
        component="p"
      >
        At <span className="color-dark-blue">REST CODER ACADEMY</span>{quote}
        </TypoGraphyComponent>
      <Box className="banner-content-btns">
              <ButtonComponent  sx={{px:"2rem"}} variant='contained' size="large" color="" borderRadius="0" onBtnClick={openModal}>
                    Register Now
                </ButtonComponent>
      </Box>
    </>
  );
}

export default BannerContent;
