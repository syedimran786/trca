import React from "react";
import TypoGraphyComponent from "../../atoms/TypoGraphyComponent/TypoGraphyComponent";
import { Box, colors, Link } from "@mui/material";
import ButtonComponent from "../../atoms/ButtonComponent/ButtonComponent";
import { useAuth } from "../../../App";

function BannerContent() {
  let {openModal}=useAuth()
  let quote = `Level up your coding skills with personalized guidance from industry experts. Our mentors provide one-on-one support, tailored learning plans, and real-world project experience to help you master in-demand programming languages and build a portfolio that shines.  Get the practical skills you need to succeed in the tech world.`;
  return (
    <>
      <TypoGraphyComponent
        variant="h2"
        sx={{mb:".6rem"}}
        component="h2"
        text={`Code Your Dreams into Reality`}
      />
      <TypoGraphyComponent
        variant="h4"
        sx={{fontSize:"2.6rem"}}
        component="h4"
        text={`Unlock Your Future with Code`}
        className="color-blue"
      />
      <TypoGraphyComponent
        variant="body"
        sx={{my:"1rem",color:"#45545d",fontSize:"1.1rem"}}
        component="p"
        text={quote}
      />
      <Box className="banner-content-btns">
              <ButtonComponent  sx={{px:"2rem"}} variant='contained' size="large" color="" borderRadius="0" onBtnClick={openModal}>
                    Register Now
                </ButtonComponent>
      </Box>
    </>
  );
}

export default BannerContent;
