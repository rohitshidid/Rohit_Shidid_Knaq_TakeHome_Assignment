import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

export default function HomePage() {
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Stack spacing={2}>
        <Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
          Knaq
        </Typography>
        <Typography variant="h6" color="text.secondary">
          IoT Alert Triage
        </Typography>
        <Typography>Frontend bootstrap OK — MUI theme is wired.</Typography>
        <Button variant="contained" color="secondary" sx={{ alignSelf: 'flex-start' }}>
          Test Button
        </Button>
      </Stack>
    </Container>
  );
}
