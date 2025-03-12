import React from 'react'

import { Box, Grid } from '@mui/material'
import GenericGridComponents from '../../molecules/Grid/GenericGridComponents'
import "./FooterComponent.css"
import FooterAddress from "../../molecules/Footer Components/FooterAddress"
import FooterLinks from "../../molecules/Footer Components/FooterLinks"
import FooterSearch from "../../molecules/Footer Components/FooterSearch"

import TypoGraphyComponent from '../../atoms/TypoGraphyComponent/TypoGraphyComponent'
import FooterLocation from '../../molecules/Footer Components/FooterLocation'

function FooterComponent() {
    let mapdataContent=[<FooterSearch/>,<FooterLinks/>,<FooterAddress/>,<FooterLocation/>]
    let mapdataHeadings=[,
    ,
]


  return (
    <Box className="footer" bgcolor="#032353" px={10}>

         <GenericGridComponents xs={12} sm={12} lg={3} spacing={6}
         mapdata={mapdataContent} sx={{textAlign:"center",mb:"2rem"}} />
         <hr />
         <TypoGraphyComponent variant='body' sx={{mt:"2rem"}}  component='p' text={`© ${new Date().getFullYear()} Rest Coder Academy. All Rights Reserved`}/>

    </Box>
  )
}

export default FooterComponent
