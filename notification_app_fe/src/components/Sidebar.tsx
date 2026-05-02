import { NavLink } from "react-router-dom";
import {
  Drawer, Box, Typography, List, ListItemButton, ListItemIcon,
  ListItemText, IconButton, Divider,
} from "@mui/material";
import NotificationsRounded from "@mui/icons-material/NotificationsRounded";
import InboxRounded from "@mui/icons-material/InboxRounded";
import StarRounded from "@mui/icons-material/StarRounded";
import MenuRounded from "@mui/icons-material/MenuRounded";

interface Props {
  width: number;
  isMobile: boolean;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const NAV_ITEMS = [
  { label: "All Notifications", to: "/", icon: <InboxRounded /> },
  { label: "Priority Inbox", to: "/priority", icon: <StarRounded /> },
];

export function Sidebar({ width, isMobile, open, onToggle, onClose }: Props) {
  const drawerContent = (
    <Box sx={{
      height: "100%", display: "flex", flexDirection: "column",
      bgcolor: "primary.dark", color: "#fff",
    }}>
      <Box sx={{ p: 2.5, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <NotificationsRounded sx={{ fontSize: 22 }} />
          <Typography variant="h6" sx={{ fontSize: "1.1rem" }}>Notifications</Typography>
        </Box>
        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mt: 0.5, display: "block" }}>
          Campus Notification Hub
        </Typography>
      </Box>

      <List sx={{ flex: 1, px: 1.5, pt: 2 }}>
        {NAV_ITEMS.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            end={item.to === "/"}
            onClick={onClose}
            sx={{
              borderRadius: 2, mb: 0.5, color: "rgba(255,255,255,0.7)",
              "&.active": { bgcolor: "primary.main", color: "#fff" },
              "&:hover": { bgcolor: "primary.main", color: "#fff" },
            }}
          >
            <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: "0.88rem", fontWeight: 500 }} />
          </ListItemButton>
        ))}
      </List>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
      <Typography variant="caption" sx={{ p: 2, color: "rgba(255,255,255,0.3)", display: "block" }}>
        Notification Microservice
      </Typography>
    </Box>
  );

  return (
    <>
      {isMobile && (
        <IconButton
          onClick={onToggle}
          sx={{
            position: "fixed", top: 12, left: 12, zIndex: 1300,
            bgcolor: "primary.dark", color: "#fff",
            "&:hover": { bgcolor: "primary.main" },
            boxShadow: 2,
          }}
        >
          <MenuRounded />
        </IconButton>
      )}

      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? open : true}
        onClose={onClose}
        sx={{
          width, flexShrink: 0,
          "& .MuiDrawer-paper": { width, border: "none", bgcolor: "transparent" },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
