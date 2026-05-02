import { ToggleButton, ToggleButtonGroup, FormControl, InputLabel, Select, MenuItem, Box } from "@mui/material";
import type { NotificationType } from "../types";

interface Props {
  activeType: NotificationType | null;
  onTypeChange: (t: NotificationType | null) => void;
  limit: number;
  onLimitChange: (l: number) => void;
}

export function FilterBar({ activeType, onTypeChange, limit, onLimitChange }: Props) {
  // MUI ToggleButtonGroup expects string | null
  const handleType = (_: React.MouseEvent, val: string | null) => {
    onTypeChange(val as NotificationType | null);
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2.5, flexWrap: "wrap" }}>
      <ToggleButtonGroup
        value={activeType}
        exclusive
        onChange={handleType}
        size="small"
        sx={{
          "& .MuiToggleButton-root": {
            px: 2, py: 0.7, fontSize: "0.82rem", fontWeight: 500,
            border: "1px solid", borderColor: "divider",
            "&.Mui-selected": { bgcolor: "primary.main", color: "#fff", "&:hover": { bgcolor: "primary.dark" } },
          },
        }}
      >
        <ToggleButton value={null as unknown as string}>All</ToggleButton>
        <ToggleButton value="Placement">Placement</ToggleButton>
        <ToggleButton value="Result">Result</ToggleButton>
        <ToggleButton value="Event">Event</ToggleButton>
      </ToggleButtonGroup>

      <FormControl size="small" sx={{ minWidth: 90, ml: "auto" }}>
        <InputLabel>Show</InputLabel>
        <Select
          value={limit}
          label="Show"
          onChange={(e) => onLimitChange(Number(e.target.value))}
          sx={{ fontSize: "0.85rem" }}
        >
          <MenuItem value={5}>5</MenuItem>
          <MenuItem value={10}>10</MenuItem>
          <MenuItem value={15}>15</MenuItem>
          <MenuItem value={20}>20</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}
