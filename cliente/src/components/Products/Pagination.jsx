import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 3; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1, "...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;

  };
  return <>
    <div className="flex items-center space-x-2 justify-center" >
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-full border store-surface disabled:opacity-50 disabled:cursor-not-allowed" style={{ borderColor: "var(--store-border)" }}>
        <ChevronLeft className="w-5 h-5 store-text" />
      </button>
      {
        getPageNumbers().map((page, index) => {
          return (
            <button key={index} disabled={page === "..."} onClick={() => typeof page === "number" && onPageChange(page)}
              className={`px-4 py-2 rounded-full font-medium transition-all ${page === currentPage ? "text-white" : page === "..." ? "cursor-default store-muted" : "store-surface store-text border"}
                }`}
              style={
                page === currentPage
                  ? { background: "var(--store-ink)" }
                  : page === "..."
                    ? undefined
                    : { borderColor: "var(--store-border)" }
              }
            >
              {page}
            </button>
          )
        })
      }
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: "var(--store-ink)" }}>
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  </>;
};

export default Pagination;
