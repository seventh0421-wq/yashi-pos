import { useState } from 'react';
import { Staff, AttendanceRecord } from '../types';
import { formatTime, formatDateTime } from '../lib/format';
import { 
  Clock, 
  Play, 
  Square, 
  Edit3, 
  ShieldCheck, 
  Calendar 
} from 'lucide-react';

interface AttendanceViewProps {
  currentStaff: Staff | null;
  attendanceList: AttendanceRecord[];
  staffList: Staff[];
  onClockIn: (staffId: string) => Promise<void>;
  onClockOut: (staffId: string) => Promise<void>;
  onUpdateAttendance: (id: string, updates: Record<string, unknown>) => Promise<void>;
  isClocking: boolean;
}

export function AttendanceView({
  currentStaff,
  attendanceList,
  staffList,
  onClockIn,
  onClockOut,
  onUpdateAttendance,
  isClocking,
}: AttendanceViewProps) {
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editMinutes, setEditMinutes] = useState<number>(0);
  const [editNote, setEditNote] = useState<string>('');

  const isManager = currentStaff?.role === 'manager';

  const currentRecord = currentStaff 
    ? attendanceList.find(a => a.staffId === currentStaff.id) 
    : undefined;
  const isWorking = currentRecord && !currentRecord.clockOutTime;

  const handleStartEdit = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setEditMinutes(record.minutesWorked);
    setEditNote(record.note || '');
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    await onUpdateAttendance(editingRecord.id, {
      minutesWorked: Number(editMinutes),
      note: editNote.trim()
    });
    setEditingRecord(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Personal Punch Card in Cream & Powder Blue */}
      <div className="bg-white border border-[#E8E2D7] rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#E8F1F8] border border-[#BFD7EE] flex items-center justify-center shrink-0 text-[#245280]">
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-[#5B88B4] font-semibold">
                ATTENDANCE & TIME TRACKING
              </span>
              <h1 className="font-manor text-xl font-bold text-slate-800 mt-0.5">
                執事／女僕出勤打卡
              </h1>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                夜蒔館工時以「實際工作分鐘」精確計量，做為當日薪資權重分派的核心基礎。登入後請於開席前開始上班，招待完畢後結束上班。
              </p>
            </div>
          </div>

          {currentStaff && (
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              {isWorking ? (
                <button
                  onClick={() => onClockOut(currentStaff.id)}
                  disabled={isClocking}
                  className="w-full sm:w-auto px-6 py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-rose-700/30"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>結束上班打卡 (Clock Out)</span>
                </button>
              ) : (
                <button
                  onClick={() => onClockIn(currentStaff.id)}
                  disabled={isClocking}
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-emerald-700/30"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>開始上班打卡 (Clock In)</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Current Punch status details */}
        {currentRecord && (
          <div className="mt-6 pt-4 border-t border-[#EAE3D6] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E8E2D7]">
              <span className="text-slate-500 block text-[11px]">今日上班時間</span>
              <span className="font-mono text-sm font-semibold text-slate-800 mt-0.5 block">
                {formatDateTime(currentRecord.clockInTime)}
              </span>
            </div>
            <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E8E2D7]">
              <span className="text-slate-500 block text-[11px]">今日下班時間</span>
              <span className="font-mono text-sm font-semibold text-slate-800 mt-0.5 block">
                {currentRecord.clockOutTime ? formatDateTime(currentRecord.clockOutTime) : '上班執勤中...'}
              </span>
            </div>
            <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E8E2D7]">
              <span className="text-slate-500 block text-[11px]">今日累計工時</span>
              <span className="font-mono text-sm font-semibold text-[#245280] mt-0.5 block">
                {currentRecord.minutesWorked} 分鐘 (權重)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Attendance Records Table */}
      <div className="bg-white border border-[#E8E2D7] rounded-2xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D6]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#5B88B4]" />
            <h2 className="font-manor text-base font-semibold text-slate-800">
              今日全員出勤紀錄 (Attendance Register)
            </h2>
          </div>
          {isManager && (
            <span className="flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              店長具備出勤時數修正權限
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#EAE3D6] text-slate-500">
                <th className="pb-3 font-medium">侍從名稱</th>
                <th className="pb-3 font-medium">身分角色</th>
                <th className="pb-3 font-medium">上班打卡時間</th>
                <th className="pb-3 font-medium">下班打卡時間</th>
                <th className="pb-3 font-medium text-right">工作分鐘 (權重)</th>
                <th className="pb-3 font-medium text-center">狀態</th>
                <th className="pb-3 font-medium text-right">備註／操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE3D6]">
              {staffList.filter(s => s.isActive).map(staff => {
                const record = attendanceList.find(a => a.staffId === staff.id);
                const isStaffWorking = record && !record.clockOutTime;

                return (
                  <tr key={staff.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full overflow-hidden border border-[#DFD6C7] bg-[#F1ECE1]">
                          <img src={staff.avatar} alt={staff.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="font-medium text-slate-800">{staff.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-slate-500">{staff.roleTitle}</td>
                    <td className="py-3 font-mono text-slate-700">
                      {record ? formatTime(record.clockInTime) : '--:--'}
                    </td>
                    <td className="py-3 font-mono text-slate-700">
                      {record?.clockOutTime ? formatTime(record.clockOutTime) : record ? '在勤中' : '--:--'}
                    </td>
                    <td className="py-3 font-mono font-semibold text-right text-[#245280]">
                      {record ? `${record.minutesWorked} 分` : '0 分'}
                    </td>
                    <td className="py-3 text-center">
                      {record ? (
                        isStaffWorking ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-50 border border-emerald-300 text-emerald-800 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            上班中
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">
                            已下班
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] text-slate-400">未出勤</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {record?.note && (
                          <span className="text-[10px] text-slate-500 truncate max-w-[120px]" title={record.note}>
                            {record.note}
                          </span>
                        )}
                        {isManager && record && (
                          <button
                            onClick={() => handleStartEdit(record)}
                            className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-[#F4EFE6] rounded-lg transition-colors cursor-pointer"
                            title="修正工時紀錄"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isManager && !record && (
                          <button
                            onClick={() => onClockIn(staff.id)}
                            className="text-[11px] text-[#5B88B4] hover:underline cursor-pointer"
                          >
                            幫忙打卡
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manager Edit Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-[#E8E2D7] rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE3D6] pb-3">
              <h3 className="font-manor text-base font-semibold text-slate-800 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-600" />
                修正出勤打卡紀錄：{editingRecord.staffName}
              </h3>
              <button onClick={() => setEditingRecord(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-medium">實際工作分鐘 (薪資權重基礎)：</label>
                <input
                  type="number"
                  min={0}
                  value={editMinutes}
                  onChange={e => setEditMinutes(Number(e.target.value))}
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#DFD6C7] rounded-lg text-slate-800 font-mono"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  範例：2小時即 120 分鐘；將依此數字計算薪資池分派權重。
                </span>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-medium">修正原因備註：</label>
                <input
                  type="text"
                  value={editNote}
                  onChange={e => setEditNote(e.target.value)}
                  placeholder="例如：店長覆核補登提早到館整頓..."
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#DFD6C7] rounded-lg text-slate-800"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2 text-xs bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors cursor-pointer shadow-xs"
              >
                儲存修正
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
