import { useMutation } from '@tanstack/react-query'
import * as Sharing from 'expo-sharing'
import { documentService } from '../services/document.service'

interface DownloadDocumentInput {
  id: string
  fileName: string
}

export function useDownloadDocument() {
  return useMutation({
    mutationFn: async ({ id, fileName }: DownloadDocumentInput) => {
      const file = await documentService.download(id, fileName)

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri)
      }

      return file
    },
  })
}
