import { ActionIcon, Loader } from '@mantine/core';
import { useCallback, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

import usePdfContent from '~/queries/buckets/usePdfContent';
import IconChevronLeft from '~icons/solar/arrow-left-bold';
import IconChevronRight from '~icons/solar/arrow-right-bold';
import IconZoomIn from '~icons/solar/magnifer-zoom-in-outline';
import IconZoomOut from '~icons/solar/magnifer-zoom-out-outline';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface PdfViewerProps {
  fileKey: string;
  bucketName: string;
  apiUrl?: string;
}

const PdfViewer = ({ fileKey, bucketName, apiUrl }: PdfViewerProps) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [documentError, setDocumentError] = useState<string | null>(null);

  const pdfContent = usePdfContent({
    bucketName,
    fileKey,
    enabled: true,
    apiUrl,
  });

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    console.log('PDF loaded successfully:', { numPages });
    setNumPages(numPages);
    setDocumentError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('Error loading PDF document:', error);
    setDocumentError(error.message);
  }, []);

  const goToPrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, numPages || 1));
  }, [numPages]);

  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.2, 3.0));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  }, []);

  // Show loading while fetching PDF data
  if (pdfContent.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Loader size="lg" />
          <p className="mt-2 text-gray-500 text-sm">Loading PDF...</p>
        </div>
      </div>
    );
  }

  // Show error if PDF data fetch failed
  if (pdfContent.isError || !pdfContent.data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 dark:text-red-400">Failed to load PDF</p>
          <p className="text-gray-500 text-sm">{pdfContent.error?.message}</p>
        </div>
      </div>
    );
  }

  // Show document error if PDF parsing failed
  if (documentError) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 dark:text-red-400">Failed to parse PDF</p>
          <p className="text-gray-500 text-sm">{documentError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex items-center justify-between border-gray-200 border-b pb-4 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <ActionIcon
            variant="default"
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            size="lg"
          >
            <IconChevronLeft className="h-4 w-4" />
          </ActionIcon>

          <span className="text-gray-600 text-sm dark:text-gray-400">
            Page {currentPage} of {numPages || '?'}
          </span>

          <ActionIcon
            variant="default"
            onClick={goToNextPage}
            disabled={currentPage >= (numPages || 1)}
            size="lg"
          >
            <IconChevronRight className="h-4 w-4" />
          </ActionIcon>
        </div>

        <div className="flex items-center gap-3">
          <ActionIcon variant="default" onClick={zoomOut} disabled={scale <= 0.5} size="lg">
            <IconZoomOut className="h-4 w-4" />
          </ActionIcon>

          <span className="text-gray-600 text-sm dark:text-gray-400">
            {Math.round(scale * 100)}%
          </span>

          <ActionIcon variant="default" onClick={zoomIn} disabled={scale >= 3.0} size="lg">
            <IconZoomIn className="h-4 w-4" />
          </ActionIcon>
        </div>
      </div>

      {/* PDF Document */}
      <div className="overflow-auto">
        <div className="flex min-w-fit justify-center">
          <Document
            file={pdfContent.data}
            key={`${bucketName}-${fileKey}-${pdfContent.dataUpdatedAt}`}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                  <Loader size="lg" />
                  <p className="mt-2 text-gray-500 text-sm">Parsing PDF...</p>
                </div>
              </div>
            }
            error={
              <div className="flex h-64 items-center justify-center">
                <p className="text-red-500 dark:text-red-400">Failed to load PDF document</p>
              </div>
            }
          >
            <Page
              pageNumber={currentPage}
              scale={scale}
              loading={
                <div className="flex h-64 items-center justify-center">
                  <Loader size="md" />
                </div>
              }
              className="shadow-lg"
            />
          </Document>
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;
