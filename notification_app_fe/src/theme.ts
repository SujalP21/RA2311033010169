import { createTheme } from "@mui/material/styles";

// earthy palette mapped to MUI theme
const theme = createTheme({
  palette: {
    primary: { main: "#5C6B4F", light: "#7A8B6E", dark: "#3D4A34" },
    secondary: { main: "#8B6F47", light: "#A8895F", dark: "#6B5435" },
    warning: { main: "#C67F59" },
    background: { default: "#F8F4EF", paper: "#FFFFFF" },
    text: { primary: "#2D2D2D", secondary: "#6B6B6B" },
    divider: "#E5DED5",
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h5: { fontWeight: 700, letterSpacing: "-0.02em" },
    h6: { fontWeight: 700, letterSpacing: "-0.02em" },
    subtitle2: { fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid #E5DED5",
          boxShadow: "0 1px 3px rgba(61,74,52,0.08)",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(61,74,52,0.1)",
            transform: "translateY(-1px)",
          },
          transition: "all 0.2s ease",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 500 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, letterSpacing: "0.03em" },
      },
    },
  },
});

export default theme;
