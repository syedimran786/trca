import { Grid } from '@mui/material'
import React, { Fragment } from 'react'
import BatchesCard from './BatchesCard';

function BatchesGrid({xs=12,sm=6,md=6,lg=5, spacing=1,children="",mapdata=[],bgcolor="white",rowSpacing=3,columnSpacing=3}) {
   
  return (
    <Grid container spacing={spacing} bgcolor={bgcolor} rowSpacing={rowSpacing} columnSpacing={columnSpacing}>
        {mapdata.map((data,id)=>
        {
            return <Fragment key={id}>
                <Grid item display={"flex"} justifyContent={"center"} alignItems={"center"}  xs={xs} sm={sm} md={md} lg={lg}>
                   <BatchesCard {...data} />
                </Grid>
            </Fragment>
        })}
    </Grid>
  )
}

export default BatchesGrid
