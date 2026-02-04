import { supabase } from '@/lib/supabase'

export async function uploadVendorLogo(file: File, vendorId?: string): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = vendorId
    ? `${vendorId}.${fileExt}`
    : `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = `vendor-logos/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('public')
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    throw new Error(uploadError.message)
  }

  const { data } = supabase.storage.from('public').getPublicUrl(filePath)
  return data.publicUrl
}

export async function deleteVendorLogo(logoUrl: string): Promise<void> {
  const path = logoUrl.split('/public/')[1]
  if (!path) return

  const { error } = await supabase.storage.from('public').remove([path])
  if (error) {
    console.error('Failed to delete logo:', error)
  }
}

// 상품 이미지 업로드
export async function uploadProductImage(file: File, productId?: string): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  const fileName = productId
    ? `${productId}_${timestamp}_${random}.${fileExt}`
    : `temp_${timestamp}_${random}.${fileExt}`
  const filePath = `product-images/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('public')
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    throw new Error(uploadError.message)
  }

  const { data } = supabase.storage.from('public').getPublicUrl(filePath)
  return data.publicUrl
}

// 상품 이미지 삭제
export async function deleteProductImage(imageUrl: string): Promise<void> {
  const path = imageUrl.split('/public/')[1]
  if (!path) return

  const { error } = await supabase.storage.from('public').remove([path])
  if (error) {
    console.error('Failed to delete product image:', error)
  }
}

// 일반 이미지 업로드 (배너, 팝업 등)
export async function uploadImage(file: File, folder: string): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  const fileName = `${timestamp}_${random}.${fileExt}`
  const filePath = `${folder}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('public')
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    throw new Error(uploadError.message)
  }

  const { data } = supabase.storage.from('public').getPublicUrl(filePath)
  return data.publicUrl
}

// 이미지 삭제
export async function deleteImage(imageUrl: string): Promise<void> {
  const path = imageUrl.split('/public/')[1]
  if (!path) return

  const { error } = await supabase.storage.from('public').remove([path])
  if (error) {
    console.error('Failed to delete image:', error)
  }
}

// 사업주 문서 업로드
export async function uploadVendorDocument(
  file: File,
  vendorId: string,
  documentType: string
): Promise<{ url: string; fileName: string; fileSize: number; mimeType: string }> {
  const fileExt = file.name.split('.').pop()
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  const fileName = `${vendorId}_${documentType}_${timestamp}_${random}.${fileExt}`
  const filePath = `vendor-documents/${vendorId}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('public')
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    throw new Error(uploadError.message)
  }

  const { data } = supabase.storage.from('public').getPublicUrl(filePath)
  return {
    url: data.publicUrl,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  }
}

// 사업주 문서 삭제
export async function deleteVendorDocument(fileUrl: string): Promise<void> {
  const path = fileUrl.split('/public/')[1]
  if (!path) return

  const { error } = await supabase.storage.from('public').remove([path])
  if (error) {
    console.error('Failed to delete vendor document:', error)
  }
}

// 어린이집 문서 업로드
export async function uploadDaycareDocument(
  file: File,
  daycareId: string,
  documentType: string
): Promise<{ url: string; fileName: string; fileSize: number; mimeType: string }> {
  const fileExt = file.name.split('.').pop()
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  const fileName = `${daycareId}_${documentType}_${timestamp}_${random}.${fileExt}`
  const filePath = `daycare-documents/${daycareId}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('public')
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    throw new Error(uploadError.message)
  }

  const { data } = supabase.storage.from('public').getPublicUrl(filePath)
  return {
    url: data.publicUrl,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  }
}

// 어린이집 문서 삭제
export async function deleteDaycareDocument(fileUrl: string): Promise<void> {
  const path = fileUrl.split('/public/')[1]
  if (!path) return

  const { error } = await supabase.storage.from('public').remove([path])
  if (error) {
    console.error('Failed to delete daycare document:', error)
  }
}
