import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CalendarPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function CalendarPagination({
  currentPage,
  totalPages,
  onPageChange,
}: CalendarPaginationProps) {
  if (totalPages <= 1) return null

  return (
    <nav className="mt-7 flex flex-wrap items-center justify-center gap-1.5" aria-label="캘린더 목록 페이지">
      <button
        className="grid size-9 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-[#547094] transition hover:bg-[#f0f5fb] active:scale-95 disabled:cursor-default disabled:opacity-25 disabled:hover:bg-transparent"
        type="button"
        aria-label="이전 페이지"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft size={18} />
      </button>

      {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
        <button
          className={`grid size-9 cursor-pointer place-items-center rounded-full border-0 text-sm font-black transition active:scale-95 ${page === currentPage ? 'bg-[#e6f0ff] text-brand-600' : 'bg-transparent text-[#526989] hover:bg-[#f0f5fb]'}`}
          key={page}
          type="button"
          aria-label={`${page}페이지`}
          aria-current={page === currentPage ? 'page' : undefined}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}

      <button
        className="grid size-9 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-[#547094] transition hover:bg-[#f0f5fb] active:scale-95 disabled:cursor-default disabled:opacity-25 disabled:hover:bg-transparent"
        type="button"
        aria-label="다음 페이지"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronRight size={18} />
      </button>
    </nav>
  )
}
