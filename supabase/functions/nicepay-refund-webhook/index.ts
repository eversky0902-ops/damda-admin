import { refundHandler } from '../_shared/refund-handler.ts'
Deno.serve(refundHandler(true))
