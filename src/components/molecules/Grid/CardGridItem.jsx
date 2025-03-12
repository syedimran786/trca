import { Grid } from '@mui/material'
import React from 'react'

function CardGridItem({children="",xs=12,sm=6,md=6,lg=3}) {

  return (
    <Grid item display={"flex"} justifyContent={"center"} alignItems={"center"}  xs={xs} sm={sm} md={md} lg={lg}>
                   {children}
    </Grid>
  )
}

export default CardGridItem
