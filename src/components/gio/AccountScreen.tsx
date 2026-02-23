"use client";

import GuardiaAccount from "../lobby/GuardiaAccount";

interface AccountScreenProps {
  onLogout?: () => void;
}

export default function AccountScreen({ onLogout }: AccountScreenProps) {
  return (
    <div className="h-full overflow-y-auto">
      <GuardiaAccount onLogout={onLogout} />
    </div>
  );
}
