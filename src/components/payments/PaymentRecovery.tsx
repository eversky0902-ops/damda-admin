import { useState } from 'react'
import { Button, Modal, Form, Input, Alert, message } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function PaymentRecovery() {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form] = Form.useForm<{ orderId: string; tid: string }>()
  const cache = useQueryClient()
  const submit = async () => {
    const values = await form.validateFields()
    setBusy(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('다시 로그인해주세요.')
      const base = import.meta.env.VITE_USER_SITE_URL
      if (!base) throw new Error('메인 사이트 주소 설정을 확인해주세요.')
      const response = await fetch(new URL('/api/payment/reconcile', base), {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ orderId: values.orderId.trim(), tid: values.tid.trim() }),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error || '확인 대기 상태입니다. 거래·주문 상태를 검토해주세요.')
      message.success('NICEPAY 거래 확인 및 예약 상태 반영을 완료했습니다.')
      await Promise.all([cache.invalidateQueries({ queryKey: ['payments'] }), cache.invalidateQueries({ queryKey: ['reservations'] }), cache.invalidateQueries({ queryKey: ['paymentStats'] })])
      setOpen(false)
      form.resetFields()
    } catch (error) { message.error(error instanceof Error ? error.message : '거래 확인에 실패했습니다.') }
    finally { setBusy(false) }
  }
  return <>
    <Button onClick={() => setOpen(true)}>거래 재조회·예약 복구</Button>
    <Modal title="NICEPAY 거래 재조회·예약 복구" open={open} onCancel={() => setOpen(false)} onOk={submit} confirmLoading={busy} okText="거래 조회 후 복구">
      <Alert type="info" showIcon message="실제 결제 완료가 확인된 유효 주문만 복구합니다. 만료 주문과 불일치는 확인 대기로 남으며, 재결제나 재승인은 요청하지 않습니다." style={{ marginBottom: 16 }} />
      <Form form={form} layout="vertical">
        <Form.Item name="orderId" label="주문번호" rules={[{ required: true, pattern: /^[A-Za-z0-9_-]{1,64}$/ }]}><Input /></Form.Item>
        <Form.Item name="tid" label="NICEPAY TID" rules={[{ required: true, pattern: /^[A-Za-z0-9_-]{1,100}$/ }]}><Input /></Form.Item>
      </Form>
    </Modal>
  </>
}
