import * as React from 'react';
import PropTypes from 'prop-types';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import MenuIcon from '@mui/icons-material/Menu';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import "../Navbar/Navbar.css"
import logo from "../../../assets/new logo1.png";
import ButtonComponent from '../../atoms/ButtonComponent/ButtonComponent';
import { useAuth } from '../../../App';
import { scroller } from 'react-scroll';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
const drawerWidth = 240;
// const navItems = ['Home', 'Fish', 'Stones','Plants','Food','Lights','Air Pumps','Tanks & Bowls'];
const navItems = ['Courses',  'Reviews','Clients','Placements'];
// Real pages added over the SEO push — router links, not homepage-section scrolls.
const pageItems = [{ label: 'For Parents', to: '/for-parents' }, { label: 'About', to: '/about' }];


function Navbar(props) {
    let {openModal}=useAuth()
  const { window } = props;
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen((prevState) => !prevState);
  };

  // On the homepage, scroll to the section; from any other route, go home and
  // let Home scroll to it (via location state).
  const goToSection = (id) => {
    if (location.pathname === '/') {
      scroller.scrollTo(id, { smooth: true, offset: -62, duration: 400 });
    } else {
      navigate('/', { state: { scrollTo: id } });
    }
  };

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" component="div" sx={{ my: 2,fontFamily:"tilt neon" }}>
        Rest Coder Academy
      </Typography>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item} disablePadding>
            <ListItemButton sx={{ textAlign: 'center', minHeight: 44 }}>
              <ListItemText primary={<span style={{ cursor: 'pointer' }} onClick={() => goToSection(item)}>{item}</span>} />
            </ListItemButton>
          </ListItem>
        ))}
        {pageItems.map((p) => (
          <ListItem key={p.to} disablePadding>
            <ListItemButton sx={{ textAlign: 'center', minHeight: 44, p: 0 }} onClick={handleDrawerToggle}>
              {/* The link is the tap target, not the row around it — so it
                  fills the row rather than sitting 32px tall inside it (#11). */}
              <RouterLink
                to={p.to}
                style={{ width: '100%', minHeight: 44, display: 'flex',
                         alignItems: 'center', justifyContent: 'center' }}
              >
                <ListItemText primary={p.label} />
              </RouterLink>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  const container = window !== undefined ? () => window().document.body : undefined;

  return (
    <Box sx={{ display: 'flex'}}>
      <CssBaseline />
      <AppBar component="nav" className="site-nav">
        <Toolbar>

        <RouterLink to="/"><img src={logo} alt="Rest Coder Academy" /></RouterLink>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            /* Was 40 x 46 — under the 44px floor on the narrow axis, on the
               one control that opens navigation for every phone visitor (#11). */
            sx={{
              mr: 2,
              display: { xs: 'block', md: 'none' },
              minWidth: 'var(--rca-control-h-mobile)',
              minHeight: 'var(--rca-control-h-mobile)',
            }}
          >
            <MenuIcon sx={{ color: '#000' }} />
          </IconButton>


          {/* </Typography> */}
          <Box sx={{ display: { xs: 'none', md: 'block' }, marginLeft: "auto" }}>
            {navItems.map((item) => (
              <ButtonComponent key={item} variant='text' onBtnClick={() => goToSection(item)}>
                  {item}
                </ButtonComponent>

            ))}
            {pageItems.map((p) => (
              <RouterLink key={p.to} to={p.to}>
                <ButtonComponent variant='text'>
                  {p.label}
                </ButtonComponent>
              </RouterLink>
            ))}
             <ButtonComponent variant='contained' paddingX={1.5} paddingY={.7} onBtnClick={openModal}>
                    Apply Now
                </ButtonComponent>
          </Box>
        </Toolbar>
      </AppBar>
      <nav>
        <Drawer
          container={container}
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
      </nav>
      
    </Box>
  );
}

Navbar.propTypes = {
  /**
   * Injected by the documentation to work in an iframe.
   * You won't need it on your project.
   */
  window: PropTypes.func,
};

export default Navbar;