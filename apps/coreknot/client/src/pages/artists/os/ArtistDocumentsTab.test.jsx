import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import ArtistDocumentsTab from './ArtistDocumentsTab.jsx';

vi.mock('../../../hooks/queries/artistOs', () => ({
  useArtistOsDocuments: () => ({
    data: null,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

function renderTab(props = {}) {
  return render(
    <MemoryRouter>
      <ArtistDocumentsTab artistId="artist-1" artistName="Jane Doe" {...props} />
    </MemoryRouter>,
  );
}

describe('ArtistDocumentsTab UI', () => {
  it('renders artist name in description', () => {
    renderTab();

    expect(screen.getByText(/Central document vault for Jane Doe/)).toBeInTheDocument();
  });

  it('renders contracts tab action when artistId is set', () => {
    renderTab();

    expect(screen.getByRole('button', { name: 'View contracts tab' })).toBeInTheDocument();
  });
});
