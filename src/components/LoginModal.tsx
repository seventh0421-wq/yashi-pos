import { Staff } from '../types';
import { StaffLoginScreen } from './StaffLoginScreen';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: Staff[];
  onSelectStaff: (username?: string, password?: string, staffId?: string, newPassword?: string) => Promise<void>;
  currentStaffId?: string;
}

export function LoginModal({
  isOpen,
  onClose,
  staffList,
  onSelectStaff,
  currentStaffId,
}: LoginModalProps) {
  if (!isOpen) return null;

  return (
    <StaffLoginScreen
      staffList={staffList}
      onLogin={onSelectStaff}
      isModal={true}
      onClose={onClose}
      currentStaffId={currentStaffId}
    />
  );
}
