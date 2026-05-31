import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SeverityChip } from '@/features/alerts/components/SeverityChip';
import { StatusBadge } from '@/features/alerts/components/StatusBadge';
import { titleForAlert, initials } from '@/features/alerts/lib/format';

describe('format helpers', () => {
  it('humanizes alert_type into a title', () => {
    expect(titleForAlert({ alertType: 'high_temperature' })).toBe('High Temperature');
    expect(titleForAlert({ alertType: 'door_fault' })).toBe('Door Fault');
  });

  it('derives up to two initials', () => {
    expect(initials('Alice Chen')).toBe('AC');
    expect(initials('Bob')).toBe('B');
  });
});

describe('SeverityChip', () => {
  it('renders the Critical label', () => {
    render(<SeverityChip severity="critical" />);
    expect(screen.getByText('Critical')).toBeTruthy();
  });
});

describe('StatusBadge', () => {
  it('renders the right label for each status', () => {
    render(<StatusBadge status="acknowledged" />);
    expect(screen.getByText('Acknowledged')).toBeTruthy();
  });
});
