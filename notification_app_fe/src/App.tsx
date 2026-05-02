import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { Sidebar } from "./components/Sidebar";
import { AllNotifications } from "./pages/AllNotifications";
import { PriorityInbox } from "./pages/PriorityInbox";

const DRAWER_W = 240;

export default function App() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <BrowserRouter>
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
        <Sidebar
          width={DRAWER_W}
          isMobile={isMobile}
          open={drawerOpen}
          onToggle={() => setDrawerOpen(!drawerOpen)}
          onClose={() => setDrawerOpen(false)}
        />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            ml: isMobile ? 0 : `${DRAWER_W}px`,
            p: { xs: 2, sm: 3, md: 4 },
            pt: isMobile ? 8 : 4,
            maxWidth: 1100,
          }}
        >
          <Routes>
            <Route path="/" element={<AllNotifications />} />
            <Route path="/priority" element={<PriorityInbox />} />
          </Routes>
        </Box>
      </Box>
    </BrowserRouter>
  );
}
