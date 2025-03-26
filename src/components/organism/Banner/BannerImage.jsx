import React from 'react'
// import tech from "../../../assets/tech3.png"
import tech from "../../../assets/tech logo.png"
import { Box } from '@mui/material'


function BannerImage() {
  return (
    <Box className="banner-image">
      <img src={tech} alt="" />
    </Box>
  )
}

export default BannerImage
