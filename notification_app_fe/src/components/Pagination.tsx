import { Box, Button, Typography } from "@mui/material";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";

interface Props {
  currentPage: number;
  onPageChange: (p: number) => void;
  hasMore: boolean;
}

export function Pagination({ currentPage, onPageChange, hasMore }: Props) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, mt: 3, py: 2 }}>
      <Button
        variant="outlined"
        size="small"
        startIcon={<ArrowBackRounded />}
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        sx={{ borderColor: "divider", color: "text.secondary" }}
      >
        Prev
      </Button>

      <Typography variant="body2" color="text.secondary">
        Page {currentPage}
      </Typography>

      <Button
        variant="outlined"
        size="small"
        endIcon={<ArrowForwardRounded />}
        disabled={!hasMore}
        onClick={() => onPageChange(currentPage + 1)}
        sx={{ borderColor: "divider", color: "text.secondary" }}
      >
        Next
      </Button>
    </Box>
  );
}
