interface PaginationProps {
  currentPage: number;
  onPageChange: (page: number) => void;
  hasMore: boolean;
}

export function Pagination({ currentPage, onPageChange, hasMore }: PaginationProps) {
  return (
    <div className="pagination">
      <button
        className="page-btn"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        ← Prev
      </button>

      <span className="page-info">Page {currentPage}</span>

      <button
        className="page-btn"
        disabled={!hasMore}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next →
      </button>
    </div>
  );
}
