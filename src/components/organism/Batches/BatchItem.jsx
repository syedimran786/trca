import { ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
import React from 'react';

function BatchItem({title, data,icon}) {
  return (
    <ListItem sx={{  }}>
      <ListItemButton disableRipple disableTouchRipple>
        <ListItemIcon>
         {icon}
        </ListItemIcon>
        <ListItemText primary={`${title} : ${data}`} />
      </ListItemButton>
    </ListItem>
  );
}

export default BatchItem
