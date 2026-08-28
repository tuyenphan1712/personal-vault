import { useState } from 'react'
import { documentService } from '../services/document.service'

/** Triggers a same-tab save via a temporary object URL — the API never exposes a public file URL. */
export function useDownloadDocument() {
  const [isDownloading, setIsDownloading] = useState(false)

  const download = async (id: string, fileName: string) => {
    setIsDownloading(true)
    try {
      const blob = await documentService.download(id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsDownloading(false)
    }
  }

  return { download, isDownloading }
}
