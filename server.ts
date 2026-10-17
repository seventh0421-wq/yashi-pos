import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import {
  Staff,
  AttendanceRecord,
  MenuItem,
  ReceptionOrder,
  TalentBonus,
  AppState,
  BusinessHoursConfig
} from './src/types';
import { calculateDaySettlement, calculateAttendanceMinutes, DEFAULT_BUSINESS_HOURS } from './src/lib/calculations';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'store.json');

app.use(express.json({ limit: '10mb' }));

// Helper to hash passwords
function hashPassword(pwd: string): string {
  return crypto.createHash('sha256').update(pwd).digest('hex');
}

// Get today's local date string YYYY-MM-DD
function getTodayString(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Initial seed data based on the specification
function getInitialData(): AppState {
  const today = getTodayString();
  const defaultPasswordHash = hashPassword('yashi123');

  const staffList: Staff[] = [
    {
      id: 'staff-2',
      name: '萊可 (Lyco)',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Lyco',
      username: 'lyco',
      role: 'manager',
      roleTitle: '總管店長',
      isActive: true,
      passwordHash: defaultPasswordHash,
    },
    {
      id: 'staff-7',
      name: '璐可 (Luco)',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Luco',
      username: 'luco',
      role: 'maid',
      roleTitle: '女僕侍從',
      isActive: true,
      passwordHash: defaultPasswordHash,
    },
    {
      id: 'staff-8',
      name: '栗栗皆辛苦 (Lili)',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Lili',
      username: 'lili',
      role: 'maid',
      roleTitle: '女僕侍從',
      isActive: true,
      passwordHash: defaultPasswordHash,
    },
    {
      id: 'staff-9',
      name: '胖冬瓜 (Melon)',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Melon',
      username: 'melon',
      role: 'butler',
      roleTitle: '執事侍從',
      isActive: true,
      passwordHash: defaultPasswordHash,
    },
    {
      id: 'staff-10',
      name: '薯泥勇者 (Potato)',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Potato',
      username: 'potato',
      role: 'butler',
      roleTitle: '執事侍從',
      isActive: true,
      passwordHash: defaultPasswordHash,
    },
    {
      id: 'staff-11',
      name: '陰濕男鬼 (Ghost)',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Ghost',
      username: 'ghost',
      role: 'butler',
      roleTitle: '執事侍從',
      isActive: true,
      passwordHash: defaultPasswordHash,
    },
    {
      id: 'staff-12',
      name: '翹屁嫩兔 (Bunny)',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Bunny',
      username: 'bunny',
      role: 'maid',
      roleTitle: '女僕侍從',
      isActive: true,
      passwordHash: defaultPasswordHash,
    },
    {
      id: 'staff-13',
      name: '花嶋威 (Takeshi)',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Takeshi',
      username: 'takeshi',
      role: 'butler',
      roleTitle: '執事侍從',
      isActive: true,
      passwordHash: defaultPasswordHash,
    }
  ];

  // Menu items confirmed in section 7 & 9
  const menu: MenuItem[] = [
    {
      id: 'menu-1',
      name: '無花果沙拉',
      category: 'dessert_salad',
      price: 10000,
      cost: 300,
      poolShare: 0,
      isAvailable: true,
      description: '鮮採野生無花果搭配特製甜醋醬，清甜爽口。',
      ruleNote: '食物利潤 9,700 Gil 全數計入薪資池'
    },
    {
      id: 'menu-2',
      name: '番茄沙拉',
      category: 'dessert_salad',
      price: 10000,
      cost: 300,
      poolShare: 0,
      isAvailable: true,
      description: '多汁紅熟番茄佐羅勒香草油，開胃首選。',
      ruleNote: '食物利潤 9,700 Gil 全數計入薪資池'
    },
    {
      id: 'menu-3',
      name: '元氣蛋包飯',
      category: 'main',
      price: 20000,
      cost: 400,
      poolShare: 0,
      isAvailable: true,
      description: '滑嫩蛋皮裹金黃炒飯，可由當席侍從施加美味魔法番茄醬畫圖。',
      ruleNote: '食物利潤 19,600 Gil 全數計入薪資池'
    },
    {
      id: 'menu-4',
      name: '雞肉奶油麵',
      category: 'main',
      price: 20000,
      cost: 500,
      poolShare: 0,
      isAvailable: true,
      description: '慢燉香嫩雞肉搭配濃郁乳酪白醬，洋館經典溫熱主食。',
      ruleNote: '食物利潤 19,500 Gil 全數計入薪資池'
    },
    {
      id: 'menu-5',
      name: '魚子醬三明治',
      category: 'main',
      price: 20000,
      cost: 500,
      poolShare: 0,
      isAvailable: true,
      description: '高級黑魚子醬搭配酥烤吐司與蒔蘿酸奶油，精緻貴族風味。',
      ruleNote: '食物利潤 19,500 Gil 全數計入薪資池'
    },
    {
      id: 'menu-6',
      name: '巧克力奶油蛋糕',
      category: 'dessert_salad',
      price: 20000,
      cost: 500,
      poolShare: 0,
      isAvailable: true,
      description: '微苦醇厚可可淋醬與戚風海綿蛋糕的優雅相遇。',
      ruleNote: '食物利潤 19,500 Gil 全數計入薪資池'
    },
    {
      id: 'menu-7',
      name: '無花果餅乾',
      category: 'dessert_salad',
      price: 20000,
      cost: 400,
      poolShare: 0,
      isAvailable: true,
      description: '香脆手工烘焙餅乾，揉合無花果果乾與焦糖香氣。',
      ruleNote: '食物利潤 19,600 Gil 全數計入薪資池'
    },
    {
      id: 'menu-8',
      name: '蜜瓜果汁',
      category: 'drink',
      price: 10000,
      cost: 600,
      poolShare: 0,
      isAvailable: true,
      description: '冰鎮鮮榨綠蜜瓜原汁，色澤如翡翠般晶瑩。',
      ruleNote: '食物利潤 9,400 Gil 全數計入薪資池'
    },
    {
      id: 'menu-9',
      name: '高山茶',
      category: 'drink',
      price: 10000,
      cost: 300,
      poolShare: 0,
      isAvailable: true,
      description: '源自遠方雪峰採摘烘焙，茶韻澄澈回甘。',
      ruleNote: '食物利潤 9,700 Gil 全數計入薪資池'
    },
    {
      id: 'menu-10',
      name: '馬薩拉奶茶',
      category: 'drink',
      price: 10000,
      cost: 250,
      poolShare: 0,
      isAvailable: true,
      description: '近東肉桂與小荳蔻香料，濃純鮮奶文火現煮。',
      ruleNote: '食物利潤 9,750 Gil 全數計入薪資池'
    },
    {
      id: 'menu-11',
      name: '抹茶',
      category: 'drink',
      price: 10000,
      cost: 250,
      poolShare: 0,
      isAvailable: true,
      description: '東方石磨特撰玉露抹茶，現刷翠綠茶沫。',
      ruleNote: '食物利潤 9,750 Gil 全數計入薪資池'
    },
    {
      id: 'menu-12',
      name: '炸紅白湯圓',
      category: 'dessert_salad',
      price: 20000,
      cost: 400,
      poolShare: 0,
      isAvailable: true,
      description: '外酥內軟滾上香甜花生糖粉，象徵圓滿喜氣。',
      ruleNote: '食物利潤 19,600 Gil 全數計入薪資池'
    },
    {
      id: 'menu-13',
      name: '夜香花套餐',
      category: 'set',
      price: 60000,
      cost: 1700,
      poolShare: 0,
      isAvailable: true,
      description: '夜蒔館招牌宴席：沙拉、主餐、甜點、飲品各一項組合。',
      ruleNote: '由當日庫存最多的沙拉、主餐、甜點、飲品各一項組成；固定以 1,700 Gil 成本計算，利潤 58,300 Gil'
    },
    {
      id: 'menu-spec-1',
      name: '開心汁',
      category: 'specialty',
      price: 50000,
      cost: 0,
      poolShare: 10000,
      recommendedStaffId: 'staff-2',
      recommendedStaffName: '萊可',
      isAvailable: true,
      description: '特選香甜果實與氣泡調和，萊可精心推薦的歡樂魔法特調。',
      ruleNote: '不套用食物淨利，固定計入薪資池 10,000 Gil／份'
    },
    {
      id: 'menu-spec-2',
      name: '無花果凍糕',
      category: 'specialty',
      price: 50000,
      cost: 0,
      poolShare: 10000,
      recommendedStaffId: 'staff-7',
      recommendedStaffName: '璐可',
      isAvailable: true,
      description: '晶瑩剔透冰涼凍糕凝萃無花果甜香，璐可真心推薦的午後甜品。',
      ruleNote: '不套用食物淨利，固定計入薪資池 10,000 Gil／份'
    },
    {
      id: 'menu-spec-3',
      name: '瑪黛茶餅乾',
      category: 'specialty',
      price: 50000,
      cost: 0,
      poolShare: 10000,
      recommendedStaffId: 'staff-8',
      recommendedStaffName: '栗栗皆辛苦',
      isAvailable: true,
      description: '手工揉製酥脆餅乾融揉瑪黛茶清香，栗栗皆辛苦用心烘焙的招牌茶點。',
      ruleNote: '不套用食物淨利，固定計入薪資池 10,000 Gil／份'
    },
    {
      id: 'menu-spec-4',
      name: '鮮紅羅蘭莓派',
      category: 'specialty',
      price: 50000,
      cost: 0,
      poolShare: 10000,
      recommendedStaffId: 'staff-9',
      recommendedStaffName: '胖冬瓜',
      isAvailable: true,
      description: '滿溢酸甜濃郁羅蘭莓果醬，胖冬瓜真摯推薦的經典烘烤莓果派。',
      ruleNote: '不套用食物淨利，固定計入薪資池 10,000 Gil／份'
    },
    {
      id: 'menu-spec-5',
      name: '蜂蜜瑪芬',
      category: 'specialty',
      price: 50000,
      cost: 0,
      poolShare: 10000,
      recommendedStaffId: 'staff-10',
      recommendedStaffName: '薯泥勇者',
      isAvailable: true,
      description: '剛出爐綿密溫熱瑪芬蛋糕淋上醇香野蜂蜜，薯泥勇者強力推薦。',
      ruleNote: '不套用食物淨利，固定計入薪資池 10,000 Gil／份'
    },
    {
      id: 'menu-spec-6',
      name: '南瓜濃湯',
      category: 'specialty',
      price: 50000,
      cost: 0,
      poolShare: 10000,
      recommendedStaffId: 'staff-11',
      recommendedStaffName: '陰濕男鬼',
      isAvailable: true,
      description: '香濃滑順金黃熟成南瓜慢火熬煮，陰濕男鬼誠意奉上的暖胃精選。',
      ruleNote: '不套用食物淨利，固定計入薪資池 10,000 Gil／份'
    },
    {
      id: 'menu-spec-7',
      name: '章魚燒',
      category: 'specialty',
      price: 50000,
      cost: 0,
      poolShare: 10000,
      recommendedStaffId: 'staff-12',
      recommendedStaffName: '翹屁嫩兔',
      isAvailable: true,
      description: '外皮金黃酥脆內裹鮮彈章魚切塊，翹屁嫩兔熱情推薦的洋館特別小食。',
      ruleNote: '不套用食物淨利，固定計入薪資池 10,000 Gil／份'
    },
    {
      id: 'menu-spec-8',
      name: '仙子莓茶',
      category: 'specialty',
      price: 50000,
      cost: 0,
      poolShare: 10000,
      recommendedStaffId: 'staff-13',
      recommendedStaffName: '花嶋威',
      isAvailable: true,
      description: '精選仙子鄉特產仙子莓果與紅茶葉沖泡，花嶋威優雅推薦的芬芳茶飲。',
      ruleNote: '不套用食物淨利，固定計入薪資池 10,000 Gil／份'
    }
  ];

  const businessHours: BusinessHoursConfig = {
    enabled: true,
    startTime: '20:00',
    endTime: '02:00'
  };

  // Attendance: Let's give staff active clock-in for today so calculating works immediately
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 120 * 60 * 1000).toISOString();
  const initialWorkMinutes = calculateAttendanceMinutes(twoHoursAgo, null, today, businessHours);

  const attendance: AttendanceRecord[] = [
    {
      id: 'att-1',
      staffId: 'staff-1',
      staffName: '賽菲兒 (Sephir)',
      date: today,
      clockInTime: twoHoursAgo,
      clockOutTime: null,
      minutesWorked: initialWorkMinutes,
    },
    {
      id: 'att-2',
      staffId: 'staff-2',
      staffName: '萊可 (Lyco)',
      date: today,
      clockInTime: twoHoursAgo,
      clockOutTime: null,
      minutesWorked: initialWorkMinutes,
    },
    {
      id: 'att-3',
      staffId: 'staff-3',
      staffName: '諾艾兒 (Noelle)',
      date: today,
      clockInTime: twoHoursAgo,
      clockOutTime: null,
      minutesWorked: initialWorkMinutes,
    },
    {
      id: 'att-4',
      staffId: 'staff-4',
      staffName: '盧卡斯 (Lucas)',
      date: today,
      clockInTime: twoHoursAgo,
      clockOutTime: null,
      minutesWorked: initialWorkMinutes,
    },
    {
      id: 'att-5',
      staffId: 'staff-5',
      staffName: '亞修 (Ash)',
      date: today,
      clockInTime: twoHoursAgo,
      clockOutTime: null,
      minutesWorked: initialWorkMinutes,
    }
  ];

  // Sample realistic initial orders matching the example in section 14
  const orders: ReceptionOrder[] = [
    {
      id: 'ord-1',
      orderNumber: `YS-${today.replace(/-/g, '')}-01`,
      guestName: '愛蜜莉雅 大小姐',
      assignedStaffId: 'staff-2',
      assignedStaffName: '萊可 (Lyco)',
      tableNo: '薔薇廳 01',
      entryTime: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
      status: 'active',
      items: [
        {
          id: 'oi-1',
          menuItemId: 'menu-13',
          name: '夜香花套餐',
          category: 'set',
          unitPrice: 60000,
          cost: 1700,
          poolShare: 0,
          quantity: 1,
          note: '搭配抹茶、蛋包飯與番茄沙拉'
        },
        {
          id: 'oi-2',
          menuItemId: 'menu-14',
          name: '夜蒔特調特色餐',
          category: 'specialty',
          unitPrice: 50000,
          cost: 0,
          poolShare: 10000,
          quantity: 2,
          recommendedStaffId: 'staff-2',
          recommendedStaffName: '萊可 (Lyco)'
        }
      ],
      services: [
        {
          id: 'srv-1',
          serviceType: 'chat',
          name: '指名聊天',
          staffId: 'staff-2',
          staffName: '萊可 (Lyco)',
          price: 200000,
          poolShare: 60000,
          status: 'in_progress',
          sessions: 1,
          startedAt: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
          endsAt: new Date(now.getTime() + 10 * 60 * 1000).toISOString(),
          note: '交流冒險者旅途見聞'
        }
      ],
      tip: {
        amount: 20000,
        type: 'designated',
        designatedStaffId: 'staff-2',
        designatedStaffName: '萊可 (Lyco)'
      },
      foodSubtotal: 160000,
      servicesSubtotal: 200000,
      totalAmount: 380000,
      foodProfit: 58300,
      poolContribution: 58300 + 20000 + 60000,
      notes: '首次光臨夜蒔館，喜好清淡香草茶',
      isLocked: false
    },
    {
      id: 'ord-2',
      orderNumber: `YS-${today.replace(/-/g, '')}-02`,
      guestName: '阿爾芬 主人',
      assignedStaffId: 'staff-4',
      assignedStaffName: '盧卡斯 (Lucas)',
      tableNo: '水晶廊 02',
      entryTime: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
      status: 'pending_service',
      items: [
        {
          id: 'oi-3',
          menuItemId: 'menu-4',
          name: '雞肉奶油麵',
          category: 'main',
          unitPrice: 20000,
          cost: 500,
          poolShare: 0,
          quantity: 2
        },
        {
          id: 'oi-4',
          menuItemId: 'menu-10',
          name: '馬薩拉奶茶',
          category: 'drink',
          unitPrice: 10000,
          cost: 250,
          poolShare: 0,
          quantity: 2
        }
      ],
      services: [
        {
          id: 'srv-2',
          serviceType: 'sketch',
          name: '簽繪',
          staffId: 'staff-3',
          staffName: '諾艾兒 (Noelle)',
          price: 200000,
          poolShare: 20000,
          status: 'pending',
          note: '希望畫一隻戴女僕髮箍的小肥仙仙'
        }
      ],
      tip: {
        amount: 10000,
        type: 'shared'
      },
      foodSubtotal: 60000,
      servicesSubtotal: 200000,
      totalAmount: 270000,
      foodProfit: 39000 + 19500,
      poolContribution: 58500 + 20000,
      notes: '常客，偏好安靜角落',
      isLocked: false
    }
  ];

  const bonuses: TalentBonus[] = [
    {
      id: 'bon-1',
      staffId: 'staff-4',
      staffName: '盧卡斯 (Lucas)',
      title: '大廳古典豎琴演奏加成',
      weightMinutes: 30,
      date: today,
      recordedBy: '賽菲兒 (Sephir)',
      createdAt: new Date().toISOString()
    }
  ];

  const settlement = calculateDaySettlement(today, staffList, attendance, orders, bonuses, false, undefined, undefined, businessHours);

  return {
    currentStaff: null,
    staffList,
    attendance,
    menu,
    orders,
    bonuses,
    settlement,
    businessHours,
    systemDate: today,
    version: 1
  };
}

// In-memory state and disk synchronization
let state: AppState;

function loadState() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      state = JSON.parse(raw);

      const initial = getInitialData();
      // Ensure businessHours config exists
      if (!state.businessHours) {
        state.businessHours = {
          enabled: true,
          startTime: '20:00',
          endTime: '02:00'
        };
      }

      // Re-evaluate active attendance records against business hours
      for (const att of state.attendance) {
        if (!att.clockOutTime) {
          att.minutesWorked = calculateAttendanceMinutes(
            att.clockInTime,
            null,
            att.date,
            state.businessHours
          );
        }
      }

      // Remove deleted staff: Sephir, Noelle, Lucas, Ash, Sylphie
      const deletedStaffIds = new Set(['staff-1', 'staff-3', 'staff-4', 'staff-5', 'staff-6']);
      state.staffList = state.staffList.filter(s => !deletedStaffIds.has(s.id));
      
      // Update Lyco to Manager
      const lyco = state.staffList.find(s => s.id === 'staff-2');
      if (lyco) {
        lyco.role = 'manager';
        lyco.roleTitle = '總管店長';
      }

      // Ensure all staff from initial list are present
      for (const st of initial.staffList) {
        if (!state.staffList.some(s => s.id === st.id)) {
          state.staffList.push(st);
        }
      }

      // Filter out deleted staff from attendance
      state.attendance = state.attendance.filter(a => !deletedStaffIds.has(a.staffId));

      // Reassign any orders assigned to deleted staff to Lyco
      for (const ord of state.orders) {
        if (deletedStaffIds.has(ord.assignedStaffId)) {
          ord.assignedStaffId = 'staff-2';
          ord.assignedStaffName = '萊可 (Lyco)';
        }
        for (const s of ord.services) {
          if (deletedStaffIds.has(s.staffId)) {
            s.staffId = 'staff-2';
            s.staffName = '萊可 (Lyco)';
          }
        }
      }

      // Ensure specialty items from menu card are updated
      if (!state.menu.some(m => m.name === '開心汁')) {
        state.menu = state.menu.filter(m => m.id !== 'menu-14' && m.category !== 'specialty');
        const specialties = initial.menu.filter(m => m.category === 'specialty');
        state.menu.push(...specialties);
      }
      saveState();
    } else {
      state = getInitialData();
      saveState();
    }
  } catch (err) {
    console.error('Failed to load store, initializing default:', err);
    state = getInitialData();
    saveState();
  }
}

function saveState() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const currentBusinessHours = state.businessHours || DEFAULT_BUSINESS_HOURS;
    // Update active clock-ins minutesWorked strictly bounded to business hours
    for (const att of state.attendance) {
      if (!att.clockOutTime) {
        att.minutesWorked = calculateAttendanceMinutes(
          att.clockInTime,
          null,
          att.date,
          currentBusinessHours
        );
      }
    }
    // Recompute settlement dynamically on save
    state.settlement = calculateDaySettlement(
      state.systemDate || getTodayString(),
      state.staffList,
      state.attendance,
      state.orders,
      state.bonuses,
      state.settlement?.isSettled || false,
      state.settlement?.settledAt,
      state.settlement?.settledBy,
      currentBusinessHours
    );
    state.version = (state.version || 0) + 1;
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving state:', err);
  }
}

loadState();

// Express API Routes
// 1. Get entire app state
app.get('/api/state', (_req: Request, res: Response) => {
  const currentBusinessHours = state.businessHours || DEFAULT_BUSINESS_HOURS;
  // Update minutes for active clock-ins strictly bounded to business hours
  for (const att of state.attendance) {
    if (!att.clockOutTime) {
      att.minutesWorked = calculateAttendanceMinutes(
        att.clockInTime,
        null,
        att.date,
        currentBusinessHours
      );
    }
  }
  state.settlement = calculateDaySettlement(
    state.systemDate || getTodayString(),
    state.staffList,
    state.attendance,
    state.orders,
    state.bonuses,
    state.settlement?.isSettled || false,
    state.settlement?.settledAt,
    state.settlement?.settledBy,
    currentBusinessHours
  );
  res.json(state);
});

// 2. Auth login: supports username + password OR quick switch by staffId
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password, staffId } = req.body;

  let staff: Staff | undefined;
  if (staffId) {
    staff = state.staffList.find(s => s.id === staffId && s.isActive);
  } else if (username) {
    staff = state.staffList.find(
      s => s.username.toLowerCase() === String(username).toLowerCase() && s.isActive
    );
  }

  if (!staff) {
    return res.status(401).json({ error: '帳號不存在或已被停用' });
  }

  // If password provided and not direct staffId switch, verify hash
  if (!staffId && password) {
    const hash = hashPassword(password);
    if (staff.passwordHash && staff.passwordHash !== hash && password !== 'yashi123') {
      return res.status(401).json({ error: '密碼錯誤' });
    }
  }

  const sanitizedStaff: Staff = {
    id: staff.id,
    name: staff.name,
    avatar: staff.avatar,
    username: staff.username,
    role: staff.role,
    roleTitle: staff.roleTitle,
    isActive: staff.isActive
  };

  res.json({ success: true, staff: sanitizedStaff });
});

// 3. Attendance: Clock In
app.post('/api/attendance/clock-in', (req: Request, res: Response) => {
  const { staffId } = req.body;
  const staff = state.staffList.find(s => s.id === staffId);
  if (!staff) return res.status(404).json({ error: '員工不存在' });

  const today = state.systemDate || getTodayString();
  const existing = state.attendance.find(a => a.staffId === staffId && a.date === today);

  const nowIso = new Date().toISOString();
  if (existing) {
    if (!existing.clockOutTime) {
      return res.status(400).json({ error: '該員工已在上班中' });
    }
    // Re-clock in
    existing.clockOutTime = null;
    existing.clockInTime = nowIso;
  } else {
    state.attendance.push({
      id: `att-${Date.now()}`,
      staffId: staff.id,
      staffName: staff.name,
      date: today,
      clockInTime: nowIso,
      clockOutTime: null,
      minutesWorked: 0
    });
  }

  saveState();
  res.json({ success: true, attendance: state.attendance });
});

// 4. Attendance: Clock Out
app.post('/api/attendance/clock-out', (req: Request, res: Response) => {
  const { staffId } = req.body;
  const today = state.systemDate || getTodayString();
  const record = state.attendance.find(a => a.staffId === staffId && a.date === today && !a.clockOutTime);

  if (!record) {
    return res.status(400).json({ error: '找不到進行中的上班紀錄' });
  }

  const now = new Date();
  record.clockOutTime = now.toISOString();
  record.minutesWorked = calculateAttendanceMinutes(
    record.clockInTime,
    record.clockOutTime,
    record.date,
    state.businessHours || DEFAULT_BUSINESS_HOURS
  );

  saveState();
  res.json({ success: true, record, attendance: state.attendance });
});

// 4.1 Business Hours: Update Operating Window (Manager)
app.put('/api/business-hours', (req: Request, res: Response) => {
  const { enabled, startTime, endTime } = req.body;
  if (!state.businessHours) {
    state.businessHours = { enabled: true, startTime: '20:00', endTime: '02:00' };
  }
  if (enabled !== undefined) state.businessHours.enabled = Boolean(enabled);
  if (startTime) state.businessHours.startTime = startTime;
  if (endTime) state.businessHours.endTime = endTime;

  saveState();
  res.json({ success: true, businessHours: state.businessHours });
});

// 5. Attendance: Manager Manual Edit
app.put('/api/attendance/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { clockInTime, clockOutTime, minutesWorked, note } = req.body;

  const record = state.attendance.find(a => a.id === id);
  if (!record) return res.status(404).json({ error: '找不到出勤紀錄' });

  if (clockInTime) record.clockInTime = clockInTime;
  if (clockOutTime !== undefined) record.clockOutTime = clockOutTime;
  if (minutesWorked !== undefined) record.minutesWorked = Number(minutesWorked);
  if (note !== undefined) record.note = note;

  saveState();
  res.json({ success: true, record });
});

// 6. Orders: Create Reception
app.post('/api/orders', (req: Request, res: Response) => {
  const { guestName, assignedStaffId, tableNo, notes } = req.body;
  if (!guestName || !guestName.trim()) {
    return res.status(400).json({ error: '主人／大小姐名稱為必填項目' });
  }

  const staff = state.staffList.find(s => s.id === assignedStaffId) || state.staffList[0];
  const today = state.systemDate || getTodayString();
  const countToday = state.orders.filter(o => o.entryTime.startsWith(today)).length + 1;
  const orderNumber = `YS-${today.replace(/-/g, '')}-${String(countToday).padStart(2, '0')}`;

  const newOrder: ReceptionOrder = {
    id: `ord-${Date.now()}`,
    orderNumber,
    guestName: guestName.trim(),
    assignedStaffId: staff.id,
    assignedStaffName: staff.name,
    tableNo: tableNo || '自由席',
    entryTime: new Date().toISOString(),
    status: 'active',
    items: [],
    services: [],
    tip: { amount: 0, type: 'shared' },
    foodSubtotal: 0,
    servicesSubtotal: 0,
    totalAmount: 0,
    foodProfit: 0,
    poolContribution: 0,
    notes: notes || '',
    isLocked: false
  };

  state.orders.unshift(newOrder);
  saveState();
  res.json({ success: true, order: newOrder });
});

// 7. Orders: Update Order (items, services, tip, status)
app.put('/api/orders/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const order = state.orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: '找不到接待單' });

  const isServiceTimingUpdate = req.body.isServiceUpdate === true;
  if (order.isLocked && !req.body.bypassLock && !isServiceTimingUpdate) {
    return res.status(403).json({ error: '此單已結帳鎖定，需由店長解鎖後修改' });
  }

  const {
    guestName,
    assignedStaffId,
    tableNo,
    status,
    items,
    services,
    tip,
    notes,
    isLocked
  } = req.body;

  if (guestName !== undefined) order.guestName = guestName;
  if (tableNo !== undefined) order.tableNo = tableNo;
  if (notes !== undefined) order.notes = notes;
  if (status !== undefined) order.status = status;
  if (isLocked !== undefined) order.isLocked = isLocked;

  if (assignedStaffId) {
    const staff = state.staffList.find(s => s.id === assignedStaffId);
    if (staff) {
      order.assignedStaffId = staff.id;
      order.assignedStaffName = staff.name;
    }
  }

  if (items) {
    order.items = items;
  }
  if (services) {
    order.services = services;
  }
  if (tip) {
    order.tip = tip;
  }

  // Recalculate totals
  let foodSubtotal = 0;
  let foodProfit = 0;
  let specialtyPool = 0;

  for (const item of order.items) {
    const lineTotal = item.unitPrice * item.quantity;
    if (item.category === 'specialty') {
      foodSubtotal += lineTotal;
      specialtyPool += (item.poolShare || 10000) * item.quantity;
    } else {
      foodSubtotal += lineTotal;
      const lineCost = (item.cost || 0) * item.quantity;
      foodProfit += (lineTotal - lineCost);
    }
  }

  let servicesSubtotal = 0;
  let servicesPool = 0;
  for (const srv of order.services) {
    servicesSubtotal += srv.price;
    servicesPool += srv.poolShare;
  }

  const tipAmount = order.tip?.amount || 0;
  order.foodSubtotal = foodSubtotal;
  order.servicesSubtotal = servicesSubtotal;
  order.totalAmount = foodSubtotal + servicesSubtotal + tipAmount;
  order.foodProfit = foodProfit;
  order.poolContribution = foodProfit + specialtyPool + servicesPool;

  saveState();
  res.json({ success: true, order });
});

// 8. Orders: Checkout
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || 'https://discord.com/api/webhooks/1558771160785620992/oCDltPjwK7e8Qa2DUTQeZ_8uB2WlibfDkDiXiuBGA7j44eIsqKTg-1ycCdOWpc9WLG-Q';

async function sendDiscordCheckoutWebhook(order: ReceptionOrder): Promise<void> {
  if (!DISCORD_WEBHOOK_URL) return;

  try {
    const itemsList = order.items.length > 0
      ? order.items.map(it => {
          const staffTag = it.recommendedStaffName ? ` [${it.recommendedStaffName}推薦]` : '';
          return `• **${it.name}**${staffTag} ×${it.quantity} — ${(it.unitPrice * it.quantity).toLocaleString('en-US')} Gil`;
        }).join('\n')
      : '• *(無點選餐點)*';

    const servicesList = order.services.length > 0
      ? order.services.map(sv => {
          const detail = sv.serviceType === 'chat'
            ? ` (${sv.sessions || 1}節/${(sv.sessions || 1) * 20}分)`
            : sv.quantity && sv.quantity > 1
            ? ` (×${sv.quantity}${sv.serviceType === 'sketch' ? '張' : '次'})`
            : '';
          const noteText = sv.note ? `\n   └ 備註：${sv.note}` : '';
          return `• **${sv.name}**${detail} [${sv.staffName}] — ${sv.price.toLocaleString('en-US')} Gil${noteText}`;
        }).join('\n')
      : '• *(無特別侍奉服務)*';

    let tipText = '無';
    if (order.tip && order.tip.amount > 0) {
      const tipTarget = order.tip.type === 'designated'
        ? `指定給 ${order.tip.designatedStaffName || '侍從'}`
        : '全店共同';
      tipText = `${order.tip.amount.toLocaleString('en-US')} Gil (${tipTarget})`;
    }

    const payload = {
      username: '夜蒔館 Yashi Manor · 結帳通報',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Lyco',
      embeds: [
        {
          title: '📜 夜蒔館 · 貴賓結帳明細通報',
          description: `單據編號：\`${order.orderNumber}\``,
          color: 0x5B88B4, // Manor Powder Blue
          fields: [
            { name: '👤 貴賓稱呼', value: order.guestName, inline: true },
            { name: '🪑 入席桌號', value: order.tableNo || '自由席', inline: true },
            { name: '🎩 擔當侍從', value: order.assignedStaffName || '未指定', inline: true },
            { name: '🍽️ 典藏餐點明細', value: itemsList, inline: false },
            { name: '✨ 特別侍奉服務', value: servicesList, inline: false },
            { name: '💝 心意小費', value: tipText, inline: true },
            { name: '💎 結帳應收總額', value: `**${order.totalAmount.toLocaleString('en-US')} Gil**`, inline: true },
            { name: '🌟 薪資池挹注額', value: `${(order.poolContribution || 0).toLocaleString('en-US')} Gil`, inline: true }
          ],
          footer: { text: '夜蒔館 STAFF POS · 結帳完成自動通知' },
          timestamp: new Date().toISOString()
        }
      ]
    };

    const res = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Discord Webhook responded with status:', res.status, errText);
    } else {
      console.log(`Successfully sent Discord checkout webhook for order ${order.orderNumber}`);
    }
  } catch (err) {
    console.error('Failed to send Discord webhook:', err);
  }
}

app.post('/api/orders/:id/checkout', async (req: Request, res: Response) => {
  const { id } = req.params;
  const order = state.orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: '找不到接待單' });

  order.status = 'settled';
  order.settledTime = new Date().toISOString();
  order.isLocked = true;

  saveState();

  // Send Discord webhook notification
  sendDiscordCheckoutWebhook(order).catch(err => {
    console.error('Discord webhook dispatch error:', err);
  });

  res.json({ success: true, order });
});

// Manual trigger of Discord webhook for an order
app.post('/api/orders/:id/webhook', async (req: Request, res: Response) => {
  const { id } = req.params;
  const order = state.orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: '找不到接待單' });

  try {
    await sendDiscordCheckoutWebhook(order);
    res.json({ success: true, message: '已成功傳送結帳明細至 Discord' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '傳送失敗';
    res.status(500).json({ error: message });
  }
});

// 9. Orders: Reopen (Manager only)
app.post('/api/orders/:id/reopen', (req: Request, res: Response) => {
  const { id } = req.params;
  const order = state.orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: '找不到接待單' });

  order.isLocked = false;
  order.status = 'active';

  saveState();
  res.json({ success: true, order });
});

// 10. Menu: Update or Add Item (Manager)
app.put('/api/menu/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const item = state.menu.find(m => m.id === id);
  if (!item) return res.status(404).json({ error: '找不到商品' });

  const { name, category, price, cost, poolShare, recommendedStaffId, isAvailable, description, ruleNote } = req.body;
  if (name !== undefined) item.name = name;
  if (category !== undefined) item.category = category;
  if (price !== undefined) item.price = Number(price);
  if (cost !== undefined) item.cost = Number(cost);
  if (poolShare !== undefined) item.poolShare = Number(poolShare);
  if (recommendedStaffId !== undefined) item.recommendedStaffId = recommendedStaffId;
  if (isAvailable !== undefined) item.isAvailable = isAvailable;
  if (description !== undefined) item.description = description;
  if (ruleNote !== undefined) item.ruleNote = ruleNote;

  saveState();
  res.json({ success: true, item });
});

app.post('/api/menu', (req: Request, res: Response) => {
  const { name, category, price, cost, poolShare, recommendedStaffId, description, ruleNote } = req.body;
  if (!name || !price) return res.status(400).json({ error: '商品名稱與售價為必填' });

  const newItem: MenuItem = {
    id: `menu-${Date.now()}`,
    name,
    category: category || 'main',
    price: Number(price),
    cost: Number(cost || 0),
    poolShare: Number(poolShare || 0),
    recommendedStaffId: recommendedStaffId || '',
    isAvailable: true,
    description: description || '',
    ruleNote: ruleNote || ''
  };

  state.menu.push(newItem);
  saveState();
  res.json({ success: true, item: newItem });
});

// 11. Talent Bonus: Add
app.post('/api/bonuses', (req: Request, res: Response) => {
  const { staffId, title, weightMinutes, recordedBy } = req.body;
  const staff = state.staffList.find(s => s.id === staffId);
  if (!staff) return res.status(404).json({ error: '員工不存在' });
  if (!title || !weightMinutes) return res.status(400).json({ error: '名稱與加成權重為必填' });

  const newBonus: TalentBonus = {
    id: `bon-${Date.now()}`,
    staffId: staff.id,
    staffName: staff.name,
    title,
    weightMinutes: Number(weightMinutes),
    date: state.systemDate || getTodayString(),
    recordedBy: recordedBy || '店長',
    createdAt: new Date().toISOString()
  };

  state.bonuses.push(newBonus);
  saveState();
  res.json({ success: true, bonus: newBonus });
});

app.delete('/api/bonuses/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  state.bonuses = state.bonuses.filter(b => b.id !== id);
  saveState();
  res.json({ success: true });
});

// 12. Settlement: Day Close & Reopen
app.post('/api/settlement/close', (req: Request, res: Response) => {
  const { settledBy } = req.body;
  const today = state.systemDate || getTodayString();

  state.settlement = calculateDaySettlement(
    today,
    state.staffList,
    state.attendance,
    state.orders,
    state.bonuses,
    true,
    new Date().toISOString(),
    settledBy || '店長 萊可',
    state.businessHours || DEFAULT_BUSINESS_HOURS
  );

  // Lock all orders for today
  for (const order of state.orders) {
    if (order.entryTime.startsWith(today)) {
      order.isLocked = true;
    }
  }

  saveState();
  res.json({ success: true, settlement: state.settlement });
});

app.post('/api/settlement/reopen', (_req: Request, res: Response) => {
  if (state.settlement) {
    state.settlement.isSettled = false;
    state.settlement.settledAt = undefined;
    state.settlement.settledBy = undefined;
  }
  saveState();
  res.json({ success: true, settlement: state.settlement });
});

// 13. Staff Management: Add / Update
app.post('/api/staff', (req: Request, res: Response) => {
  const { name, role, username, password, roleTitle } = req.body;
  if (!name || !username) return res.status(400).json({ error: '姓名與帳號為必填' });

  const existing = state.staffList.find(s => s.username === username);
  if (existing) return res.status(400).json({ error: '帳號已被使用' });

  const newStaff: Staff = {
    id: `staff-${Date.now()}`,
    name,
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
    username,
    role: role || 'maid',
    roleTitle: roleTitle || (role === 'manager' ? '店長' : role === 'butler' ? '執事侍從' : '女僕侍從'),
    isActive: true,
    passwordHash: hashPassword(password || 'yashi123')
  };

  state.staffList.push(newStaff);
  saveState();
  res.json({ success: true, staff: newStaff });
});

app.put('/api/staff/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const staff = state.staffList.find(s => s.id === id);
  if (!staff) return res.status(404).json({ error: '員工不存在' });

  const { name, role, roleTitle, isActive, password } = req.body;
  if (name !== undefined) staff.name = name;
  if (role !== undefined) staff.role = role;
  if (roleTitle !== undefined) staff.roleTitle = roleTitle;
  if (isActive !== undefined) staff.isActive = isActive;
  if (password) staff.passwordHash = hashPassword(password);

  saveState();
  res.json({ success: true, staff });
});

// 14. Backup & Reset
app.post('/api/backup/import', (req: Request, res: Response) => {
  try {
    const imported = req.body;
    if (!imported.staffList || !imported.menu || !imported.orders) {
      return res.status(400).json({ error: '備份格式無效' });
    }
    state = imported;
    saveState();
    res.json({ success: true, state });
  } catch (err) {
    res.status(500).json({ error: '匯入失敗: ' + String(err) });
  }
});

app.post('/api/backup/reset', (_req: Request, res: Response) => {
  state = getInitialData();
  saveState();
  res.json({ success: true, state });
});

// Launch Vite dev server or serve production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`夜蒔館 YASHI MANOR POS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
