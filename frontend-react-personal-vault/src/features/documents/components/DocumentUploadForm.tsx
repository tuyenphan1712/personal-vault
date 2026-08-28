import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { ALLOWED_DOCUMENT_TYPES, MAX_FILE_SIZE_BYTES } from '@/config/constants'
import { useUploadDocument } from '../hooks/useUploadDocument'
import { DOCUMENT_TYPES } from '../types/document.types'

const uploadSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  docType: z.enum(DOCUMENT_TYPES).optional(),
  file: z
    .instanceof(FileList)
    .refine((files) => files.length === 1, 'A file is required')
    .refine((files) => files[0].size <= MAX_FILE_SIZE_BYTES, 'File must be 10MB or smaller')
    .refine(
      (files) => (ALLOWED_DOCUMENT_TYPES as readonly string[]).includes(files[0].type),
      'Only JPEG, PNG, or PDF files are allowed',
    ),
})

type UploadFormValues = z.infer<typeof uploadSchema>

interface DocumentUploadFormProps {
  onSuccess: (message: string) => void
}

export function DocumentUploadForm({ onSuccess }: DocumentUploadFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UploadFormValues>({ resolver: zodResolver(uploadSchema) })
  const uploadDocument = useUploadDocument()

  const onSubmit = handleSubmit(async (values) => {
    await uploadDocument.mutateAsync({
      file: values.file[0],
      title: values.title,
      docType: values.docType,
    })
    onSuccess('Document uploaded.')
  })

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input label="Title" {...register('title')} error={errors.title?.message} />
      <div className="flex flex-col gap-1">
        <label htmlFor="docType" className="text-sm font-medium text-ink">
          Document type (optional)
        </label>
        <select
          id="docType"
          {...register('docType')}
          className="rounded-md border border-line px-3 py-2 text-sm text-ink shadow-sm focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-primary"
        >
          <option value="">Select a type</option>
          {DOCUMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.toUpperCase()}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="file" className="text-sm font-medium text-ink">
          File
        </label>
        <input
          id="file"
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          {...register('file')}
          className="text-sm text-ink file:mr-3 file:rounded-md file:border file:border-line file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink hover:file:bg-surface-hover"
        />
        {errors.file ? <p className="text-sm text-danger">{errors.file.message}</p> : null}
        <p className="text-xs text-muted">Max 10MB. JPEG, PNG, or PDF only.</p>
      </div>
      <Button type="submit" isLoading={uploadDocument.isPending}>
        Upload document
      </Button>
    </form>
  )
}
