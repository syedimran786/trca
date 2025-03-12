import React from 'react'
import "./Banner.css"
import { Box } from '@mui/material'
import GenericGridComponents from '../../molecules/Grid/GenericGridComponents'
import TypoGraphyComponent from '../../atoms/TypoGraphyComponent/TypoGraphyComponent'
import BannerContent from './BannerContent'
import BannerImage from './BannerImage'
import "./Banner.css"

function Banner() {
    let mapdataContent=[<BannerContent/>,<BannerImage/>]
  return (
    <Box className="banner" bgcolor="#ffffff"  py={5} mx={12} id="banner">

    <GenericGridComponents xs={12} sm={12} lg={6} spacing={2}
    mapdata={mapdataContent}  />
  
    </Box>
  )
}

export default Banner
