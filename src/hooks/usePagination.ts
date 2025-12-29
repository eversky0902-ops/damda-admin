import { useState, useCallback } from 'react'
import { DEFAULT_PAGE_SIZE } from '@/constants'

interface UsePaginationOptions {
  initialPage?: number
  initialPageSize?: number
}

export function usePagination(options: UsePaginationOptions = {}) {
  const { initialPage = 1, initialPageSize = DEFAULT_PAGE_SIZE } = options

  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const handlePageChange = useCallback((newPage: number, newPageSize?: number) => {
    setPage(newPage)
    if (newPageSize && newPageSize !== pageSize) {
      setPageSize(newPageSize)
      setPage(1) // 페이지 사이즈 변경 시 첫 페이지로
    }
  }, [pageSize])

  const reset = useCallback(() => {
    setPage(initialPage)
    setPageSize(initialPageSize)
  }, [initialPage, initialPageSize])

  return {
    page,
    pageSize,
    handlePageChange,
    reset,
    // Supabase range 계산용
    from: (page - 1) * pageSize,
    to: page * pageSize - 1,
  }
}
