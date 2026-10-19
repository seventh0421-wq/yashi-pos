import { ReceptionOrder } from '../types';

export function formatGil(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 Gil';
  return `${amount.toLocaleString('en-US')} Gil`;
}

export function formatTime(isoString?: string): string {
  if (!isoString) return '--:--';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '--:--';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function formatDateTime(isoString?: string): string {
  if (!isoString) return '--';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '--';
  const yyyy = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}/${MM}/${dd} ${hh}:${mm}`;
}

export function generateCheckoutMacro(order: ReceptionOrder): string {
  const isMadam = order.guestName.includes('大小姐');
  const title = isMadam ? '大小姐' : '主人';
  const totalGil = (order.totalAmount || 0).toLocaleString('en-US');

  return `/p 這邊為${title}送上餐點～！ <wait.2>
/遞交 <wait.2>
/p ${title}的餐點金額為＂${totalGil}＂ Gil 這邊要先跟${title}收取唷～ <wait.2>
/行禮`;
}

export function generateBillReceiptText(order: ReceptionOrder): string {
  const line = '━'.repeat(30);
  const subLine = '─'.repeat(30);
  
  const itemsText = order.items.length > 0
    ? order.items.map(it => {
        const itemTotal = it.unitPrice * it.quantity;
        const displayName = it.recommendedStaffName ? `${it.name} [${it.recommendedStaffName}推薦]` : it.name;
        return `  ${displayName.padEnd(12, '　')} ×${it.quantity}  ${itemTotal.toLocaleString('en-US')} Gil`;
      }).join('\n')
    : '  (無餐點項目)';

  const servicesText = order.services.length > 0
    ? order.services.map(sv => {
        const detail = sv.serviceType === 'chat' 
          ? ` (${sv.sessions || 1}節/${(sv.sessions || 1) * 20}分)` 
          : sv.quantity && sv.quantity > 1 
          ? ` (×${sv.quantity}${sv.serviceType === 'sketch' ? '張' : '次'})` 
          : '';
        return `  ${(sv.name + detail).padEnd(12, '　')} [${sv.staffName}]  ${sv.price.toLocaleString('en-US')} Gil`;
      }).join('\n')
    : '';

  const tipText = order.tip && order.tip.amount > 0
    ? `  心意小費 (${order.tip.type === 'designated' ? `指定給 ${order.tip.designatedStaffName || '侍從'}` : '全店共同'}): ${order.tip.amount.toLocaleString('en-US')} Gil\n`
    : '';

  return `
✦━━━━━━━━━━━━━━━━━━━━✦
   夜 蒔 館  Y A S H I   M A N O R
      STAFF POS · 結帳明細
✦━━━━━━━━━━━━━━━━━━━━✦
貴賓稱呼：${order.guestName}
擔當侍從：${order.assignedStaffName}
入館時間：${formatTime(order.entryTime)}
結帳時間：${formatTime(order.settledTime || new Date().toISOString())}
單據編號：${order.orderNumber}
${subLine}
【點選餐點】
${itemsText}
${order.services.length > 0 ? `\n【特別侍奉服務】\n${servicesText}` : ''}
${subLine}
餐點小計：${order.foodSubtotal.toLocaleString('en-US')} Gil
服務小計：${order.servicesSubtotal.toLocaleString('en-US')} Gil
${tipText}${line}
【應收總計】：${order.totalAmount.toLocaleString('en-US')} Gil
${line}
感謝 主人／大小姐 光臨夜蒔館，願今夜清風與繁花長伴。
`.trim();
}
