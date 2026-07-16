'use client'

import React, { useId, useState, useRef } from 'react'
import { FieldWrapper } from '../utils/field-wrapper'
import { UploadCloud, File, X, Check, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/helpers'

export interface UploadFieldItem {
  id: string
  file?: File
  name: string
  size?: number
  type?: string
  previewUrl?: string
  remoteUrl?: string
  status: 'pending' | 'uploading' | 'done' | 'error'
  progress?: number
  error?: string
}

export interface UploadFieldProps {
  label?: string
  hint?: string
  error?: string
  inline?: boolean
  disabled?: boolean
  value?: UploadFieldItem[]
  defaultValue?: UploadFieldItem[]
  uploadUrl?: string
  uploadMethod?: 'POST' | 'PUT' | 'PATCH'
  uploadFieldName?: string
  uploadHeaders?: Record<string, string>
  uploadData?: Record<string, unknown>
  mapUploadResponse?: (response: unknown) => { remoteUrl: string }
  multiple?: boolean
  maxFiles?: number
  previewStrategy?: 'auto' | 'image-only' | 'none'
  removable?: boolean
  name?: string
  onChange?: (e: {
    target: {
      name: string
      value: UploadFieldItem[]
      files: File[]
      uploaded: boolean
    }
    persist: () => void
  }) => void
}

export function UploadField({
  label,
  hint,
  error,
  inline = false,
  disabled = false,
  value,
  defaultValue = [],
  uploadUrl,
  uploadMethod = 'POST',
  uploadFieldName = 'file',
  uploadHeaders = {},
  uploadData = {},
  mapUploadResponse,
  multiple = false,
  maxFiles,
  previewStrategy = 'auto',
  removable = true,
  name = '',
  onChange,
}: UploadFieldProps) {
  const generatedId = useId()
  const id = `${name || 'upload'}-${generatedId}`

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const [internalVal, setInternalVal] = useState<UploadFieldItem[]>(defaultValue)
  const currentVal = value !== undefined ? value : internalVal

  const triggerChange = (newItems: UploadFieldItem[]) => {
    if (value === undefined) {
      setInternalVal(newItems)
    }

    const files = newItems.map((item) => item.file).filter(Boolean) as File[]
    const allUploaded = newItems.every((item) => item.status === 'done')

    if (onChange) {
      onChange({
        target: {
          name,
          value: newItems,
          files,
          uploaded: allUploaded,
        },
        persist: () => {},
      })
    }
  }

  const uploadFile = (item: UploadFieldItem, itemsList: UploadFieldItem[]) => {
    if (!uploadUrl || !item.file) return

    const xhr = new XMLHttpRequest()
    const formData = new FormData()
    formData.append(uploadFieldName, item.file)

    Object.entries(uploadData).forEach(([key, val]) => {
      formData.append(key, String(val))
    })

    xhr.open(uploadMethod, uploadUrl, true)

    Object.entries(uploadHeaders).forEach(([key, val]) => {
      xhr.setRequestHeader(key, val)
    })

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100)
        const updatedList = itemsList.map((it) => {
          if (it.id === item.id) {
            return { ...it, status: 'uploading' as const, progress: percent }
          }
          return it
        })
        triggerChange(updatedList)
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        let remoteUrl = ''
        try {
          const response = JSON.parse(xhr.responseText) as Record<string, unknown>
          if (mapUploadResponse) {
            remoteUrl = mapUploadResponse(response).remoteUrl
          } else {
            const data = response.data as Record<string, unknown> | undefined
            remoteUrl =
              (response.url as string) ||
              (response.secure_url as string) ||
              (data?.url as string) ||
              ''
          }
        } catch (e) {
          console.warn('Failed to parse upload response JSON', e)
        }

        const updatedList = itemsList.map((it) => {
          if (it.id === item.id) {
            return { ...it, status: 'done' as const, progress: 100, remoteUrl }
          }
          return it
        })
        triggerChange(updatedList)
      } else {
        const updatedList = itemsList.map((it) => {
          if (it.id === item.id) {
            return { ...it, status: 'error' as const, error: `Upload failed: ${xhr.statusText}` }
          }
          return it
        })
        triggerChange(updatedList)
      }
    }

    xhr.onerror = () => {
      const updatedList = itemsList.map((it) => {
        if (it.id === item.id) {
          return { ...it, status: 'error' as const, error: 'Network error occurred' }
        }
        return it
      })
      triggerChange(updatedList)
    }

    xhr.send(formData)
  }

  const handleFilesAdded = (filesList: FileList) => {
    if (disabled) return

    const newItems: UploadFieldItem[] = []
    const limit = maxFiles !== undefined ? maxFiles : Infinity
    const currentCount = currentVal.length
    const availableSlots = limit - currentCount
    if (availableSlots <= 0) return

    const filesToProcess = Array.from(filesList).slice(0, multiple ? availableSlots : 1)

    filesToProcess.forEach((file) => {
      let previewUrl = ''
      const isImage = file.type.startsWith('image/')

      if (isImage && (previewStrategy === 'auto' || previewStrategy === 'image-only')) {
        previewUrl = URL.createObjectURL(file)
      }

      const item: UploadFieldItem = {
        id: Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl,
        status: uploadUrl ? 'pending' : 'done',
        progress: 0,
      }

      newItems.push(item)
    })

    const updatedList = multiple ? [...currentVal, ...newItems] : newItems
    triggerChange(updatedList)

    if (uploadUrl) {
      newItems.forEach((item) => {
        uploadFile(item, updatedList)
      })
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (disabled) return
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled) return
    if (e.dataTransfer.files) {
      handleFilesAdded(e.dataTransfer.files)
    }
  }

  const handleRemove = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation()
    if (!removable || disabled) return
    const updatedList = currentVal.filter((item) => item.id !== itemId)
    triggerChange(updatedList)
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  return (
    <FieldWrapper
      id={id}
      label={label}
      hint={hint}
      error={error}
      inline={inline}
      disabled={disabled}
    >
      <div className="flex flex-col gap-3 w-full">
        <input
          ref={fileInputRef}
          id={id}
          type="file"
          multiple={multiple}
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files) {
              handleFilesAdded(e.target.files)
            }
          }}
          className="sr-only"
        />

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={cn(
            'w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-(--border-primary) rounded-xl bg-(--bg-card) cursor-pointer select-none transition-all duration-300 ease-in-out',
            isDragging && 'border-(--accent) bg-(--accent-soft) scale-[0.99]',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          <UploadCloud
            size={36}
            className={cn(
              'text-(--text-muted) transition-colors duration-300',
              isDragging && 'text-(--accent)'
            )}
          />
          <span className="text-sm font-semibold tracking-wide text-(--text-primary) mt-3">
            {isDragging ? 'Drop your files here' : 'Drag & drop your files here'}
          </span>
          <span className="text-xs text-(--text-muted) mt-1">
            or <span className="text-(--accent) font-medium hover:underline">browse files</span> on your computer
          </span>
        </div>

        {currentVal.length > 0 && (
          <div className="flex flex-col gap-2">
            {currentVal.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 bg-(--bg-card) border-2 border-(--border-primary) rounded-xl p-2 w-full animate-in fade-in-50 slide-in-from-top-1"
              >
                {item.previewUrl ? (
                  <img
                    src={item.previewUrl}
                    alt={item.name}
                    className="w-10 h-10 rounded-lg object-cover border-2 border-(--border-primary)"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg border-2 border-(--border-primary) bg-(--bg-tertiary) flex items-center justify-center text-(--text-muted)">
                    <File size={20} />
                  </div>
                )}

                <div className="flex-1 flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-(--text-primary) truncate">{item.name}</span>
                  <span className="text-[10px] text-(--text-muted) mt-0.5 font-mono">
                    {formatFileSize(item.size)}
                  </span>

                  {item.status === 'uploading' && (
                    <div className="w-full flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 bg-(--bg-tertiary) rounded-full overflow-hidden">
                        <div
                          className="h-full bg-(--accent) rounded-full transition-all duration-150"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-(--accent) font-bold">{item.progress}%</span>
                    </div>
                  )}

                  {item.status === 'error' && (
                    <span className="text-[10px] text-red-500 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle size={10} />
                      {item.error || 'Failed to upload'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {item.status === 'uploading' && (
                    <Loader2 size={14} className="text-(--accent) animate-spin" />
                  )}
                  {item.status === 'done' && (
                    <div className="p-0.5 rounded-lg bg-(--success-soft) border border-(--success)/40 text-(--success)">
                      <Check size={12} className="stroke-[3px]" />
                    </div>
                  )}
                  {item.status === 'error' && (
                    <div className="p-0.5 rounded-lg bg-red-500/10 border border-red-500/40 text-red-500 font-bold">
                      <X size={12} className="stroke-[3px]" />
                    </div>
                  )}

                  {removable && (
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={(e) => handleRemove(e, item.id)}
                      className="p-1.5 text-(--text-muted) hover:text-red-500 rounded-lg hover:bg-(--bg-tertiary) transition-colors"
                      title="Remove file"
                      aria-label="Remove file"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </FieldWrapper>
  )
}
