import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation, type TFunction } from 'react-i18next'
import { z } from 'zod'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { ALLOWED_DOCUMENT_TYPES, MAX_FILE_SIZE_BYTES } from '@/config/constants'
import { useUploadDocument } from '../hooks/useUploadDocument'
import { DOCUMENT_TYPE_VALUES, OTHER_DOCUMENT_TYPE } from '../types/document.types'

function createUploadSchema(t: TFunction) {
  return z
    .object({
      title: z.string().min(1, t('documents.errors.titleRequired')),
      docType: z.string().optional(),
      customDocType: z.string().optional(),
      file: z
        .instanceof(FileList)
        .refine((files) => files.length === 1, t('documents.errors.fileRequired'))
        .refine((files) => files[0].size <= MAX_FILE_SIZE_BYTES, t('documents.errors.fileTooLarge'))
        .refine(
          (files) => (ALLOWED_DOCUMENT_TYPES as readonly string[]).includes(files[0].type),
          t('documents.errors.fileTypeInvalid'),
        ),
    })
    .refine((values) => values.docType !== OTHER_DOCUMENT_TYPE || Boolean(values.customDocType?.trim()), {
      message: t('documents.errors.customTypeRequired'),
      path: ['customDocType'],
    })
}

type UploadFormValues = z.infer<ReturnType<typeof createUploadSchema>>

interface DocumentUploadFormProps {
  onSuccess: (message: string) => void
}

export function DocumentUploadForm({ onSuccess }: DocumentUploadFormProps) {
  const { t } = useTranslation()
  const uploadSchema = useMemo(() => createUploadSchema(t), [t])
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UploadFormValues>({ resolver: zodResolver(uploadSchema) })
  const uploadDocument = useUploadDocument()
  const selectedDocType = watch('docType')
  const isOtherSelected = selectedDocType === OTHER_DOCUMENT_TYPE

  const onSubmit = handleSubmit(async (values) => {
    const docType = values.docType === OTHER_DOCUMENT_TYPE ? values.customDocType?.trim() : values.docType

    await uploadDocument.mutateAsync({
      file: values.file[0],
      title: values.title,
      docType: docType || undefined,
    })
    onSuccess(t('documents.uploadedToast'))
  })

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input label={t('documents.fields.title')} {...register('title')} error={errors.title?.message} />
      <div className="flex flex-col gap-1">
        <label htmlFor="docType" className="text-sm font-medium text-ink">
          {t('documents.fields.docType')}
        </label>
        <select
          id="docType"
          {...register('docType')}
          className="rounded-md border border-line px-3 py-2 text-sm text-ink shadow-sm focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-primary"
        >
          <option value="">{t('documents.fields.selectType')}</option>
          {DOCUMENT_TYPE_VALUES.map((value) => (
            <option key={value} value={value}>
              {t(`documents.types.${value}`)}
            </option>
          ))}
          <option value={OTHER_DOCUMENT_TYPE}>{t('documents.fields.otherType')}</option>
        </select>
      </div>
      {isOtherSelected ? (
        <Input
          label={t('documents.fields.customTypeLabel')}
          placeholder={t('documents.fields.customTypePlaceholder')}
          {...register('customDocType')}
          error={errors.customDocType?.message}
        />
      ) : null}
      <div className="flex flex-col gap-1">
        <label htmlFor="file" className="text-sm font-medium text-ink">
          {t('documents.fields.file')}
        </label>
        <input
          id="file"
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          {...register('file')}
          className="text-sm text-ink file:mr-3 file:rounded-md file:border file:border-line file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink hover:file:bg-surface-hover"
        />
        {errors.file ? <p className="text-sm text-danger">{errors.file.message}</p> : null}
        <p className="text-xs text-muted">{t('documents.fields.fileHint')}</p>
      </div>
      <Button type="submit" isLoading={uploadDocument.isPending}>
        {t('documents.uploadButton')}
      </Button>
    </form>
  )
}
