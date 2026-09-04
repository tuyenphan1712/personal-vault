import { useLocalSearchParams } from 'expo-router'
import { DocumentDetailScreen } from '@/src/features/documents'

export default function DocumentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <DocumentDetailScreen documentId={id ?? ''} />
}
